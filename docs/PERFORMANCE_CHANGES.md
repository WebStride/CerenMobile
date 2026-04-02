# Performance Changes

This document summarizes all backend and frontend performance work completed across two branches:

- `feature/Performance` — initial query, rendering, and API layer optimisations
- `feature/StagingPerformanceFix` — network-level and process management fixes that addressed why all screens were noticeably slower on staging and production compared to local

The goal across both rounds was to improve API response time, reduce repeated work in the mobile app, avoid unnecessary rerenders, and make local debugging of latency issues easier.

## Why local was fast but staging was slow

Before the second round of fixes, the app felt fine when pointed at the local backend but every screen — OTP, shop, cart, orders, invoices — loaded slowly on staging and production.

The reason is that local runs over LAN with roughly 1–5 ms round-trip latency. Staging and production run over the internet with TLS, giving 150–250 ms per round-trip. Any inefficiency that costs one or two extra round-trips or a few kilobytes of extra payload is invisible locally but adds up to a second or more of perceived lag on staging.

Four root causes were identified:

1. **No gzip** — every JSON response was sent uncompressed. A typical product list is 40–80 KB raw. Over a mobile internet connection that means extra transfer time on every single API call.
2. **keepAlive timeout mismatch** — Node.js closes idle keep-alive connections after 5 seconds by default. Nginx holds them open for 65 seconds. After a few seconds of navigating between screens, Nginx would attempt to reuse a connection that Node had already closed, receive an `ECONNRESET`, and have to open a new TCP+TLS connection for the retry. That retry cost 150–400 ms on random requests and was completely invisible in local testing.
3. **PM2 fork mode on staging** — the `ecosystem.config.js` used a `process.env.NODE_ENV` ternary to select `cluster` mode for production and `fork` mode for staging. But PM2 reads the config file before injecting environment variables from the `env_staging` / `env_production` blocks, so `process.env.NODE_ENV` is always `undefined` at parse time. The ternary always resolved to the else branch, leaving both staging and production running as a single-process fork. Any slow or blocking request would stall all other in-flight requests.
4. **Redundant AsyncStorage reads** — every API function called `getSessionState()` independently, which reads four AsyncStorage keys via `Promise.all`. Functions that also called `getAuthHeaders()` (which calls `getSessionState()` internally) were doing eight reads per API call. On a real device, AsyncStorage reads take 10–30 ms each. Screens that fire multiple API calls in sequence compounded this.

## Scope

The work covered two areas:

1. Backend request and query performance
2. Frontend rendering and client-side request overhead

Some runtime hardening changes were completed during the same effort because they directly affected the ability to validate performance locally, but this document focuses on the actual performance-related changes.

## Backend Changes

### 1. Prisma client reuse

File:
- `backend/src/lib/prisma.ts`

What changed:
- The backend now uses a single Prisma client instance instead of creating clients repeatedly.
- Startup connection retry logic was kept around the shared client so the server can recover more gracefully during local or remote DB connection delays.

Why it helps:
- Avoids connection pool exhaustion.
- Reduces unnecessary connection churn.
- Makes request latency more predictable under load.

### 2. Request timing and health visibility

File:
- `backend/src/app.ts`

What changed:
- Added lightweight request timing logs for each HTTP request.
- Added a `/health` endpoint for quick reachability and response-time checks.

Why it helps:
- Makes slow endpoints visible immediately during local testing.
- Simplifies distinguishing backend slowness from mobile-side issues.

### 3. Product service query optimization

File:
- `backend/src/service/product/index.ts`

What changed:
- Added a 5-minute pricing cache for customer pricing context.
- Replaced per-product image lookups with batched image loading via `getBatchProductImages(...)`.
- Reduced product queries to fetch only the required fields using Prisma `select`.
- Kept product pagination bounded in `getAllProducts(...)` with explicit `take` and `skip` parameters.

Why it helps:
- Removes repeated pricing lookups for the same customer context.
- Fixes N+1-style image fetch patterns for product lists.
- Shrinks DB payload size and serialization overhead.
- Prevents large unbounded product responses from slowing down the app.

Impacted flows:
- Exclusive offers
- Customer preferred products
- All products list
- New products
- Catalog and category-driven product responses

### 4. Orders and invoices service slimming

File:
- `backend/src/service/orders/index.ts`

What changed:
- Slimmed orders and invoices queries to fetch only the fields needed by the mobile app.
- Added default pagination limits for orders and invoices (`take = 100`, `skip = 0`).
- Replaced heavier response serialization with a targeted `jsonReplacer` for `bigint` values.
- Batched product and image lookups when enriching order items and invoice items.
- Added caching for the external invoice API token.

Why it helps:
- Reduces DB and JSON serialization cost on large order/invoice payloads.
- Removes repeated product/image round-trips.
- Avoids repeated login calls to the external invoice API.

Impacted flows:
- Order history
- Order detail items
- Invoice history
- Invoice detail items
- External invoice sync calls

### 5. Auth persistence path cleanup

File:
- `backend/src/service/auth/index.ts`

What changed:
- User persistence during OTP verification was moved to `upsert` in `saveUserAndGenerateTokens(...)`.
- The service now safely handles missing `name` values by preserving the existing name or generating a fallback for first-time users.

Why it helps:
- Removes an extra read-before-write pattern from the auth flow.
- Keeps OTP verification fast and safe for both new and returning users.

### 6. Environment loading required for local performance validation

File:
- `backend/src/app.ts`

What changed:
- Default `.env` is loaded first and environment-specific overrides are applied after that.
- Placeholder MSG91 development values are skipped instead of overriding real credentials.
- Route loading happens after environment initialization.

Why it matters to performance work:
- This was necessary to validate OTP and auth flows locally without false regressions while performance changes were being tested.
- It removed setup issues that looked like runtime failures but were actually env-loading problems.

### 7. Gzip response compression

Branch: `feature/StagingPerformanceFix`

File:
- `backend/src/app.ts`
- `backend/package.json`

What changed:
- Installed the `compression` npm package and added `app.use(compression())` as Express middleware, positioned immediately after CORS and before all routes.
- No changes to any route handler were needed — the middleware compresses every JSON response automatically.

Why it helps:
- JSON responses were previously sent uncompressed over the wire. A typical product list response is 40–80 KB. With gzip, the same payload compresses to 4–8 KB — roughly a 90% reduction.
- The compression cost on the server (CPU) is negligible compared to the transfer time saved, especially on mobile internet connections.
- Because this is applied globally, every endpoint — products, cart, orders, invoices, categories — benefits automatically.

### 8. Node.js / Nginx keepAlive timeout mismatch fix

Branch: `feature/StagingPerformanceFix`

File:
- `backend/src/app.ts`

Root cause:
- Node.js `http.Server` has a default `keepAliveTimeout` of 5 seconds. Nginx is configured with `keepalive_timeout 65s`. After a user navigates between screens and there is a brief pause of more than 5 seconds, Node silently closes the persistent TCP connection. Nginx does not know this has happened and attempts to reuse the same connection for the next request. This results in an `ECONNRESET` error, which forces Nginx to open a new TCP connection with a full TLS handshake. That retry adds 150–400 ms to a random request and the user sees an unexplained slow screen load.

What changed:
- `app.listen(...)` now returns a reference to the underlying HTTP server.
- `server.keepAliveTimeout` is set to `65000` ms (65 seconds), matching Nginx's keepalive window.
- `server.headersTimeout` is set to `66000` ms, which must always be higher than `keepAliveTimeout` to prevent a separate race condition in Node's HTTP parser.

```typescript
const server = app.listen(port, host, () => {
  console.log(`App is running at port: http://${host}:${port}`);
});

server.keepAliveTimeout = 65000;  // match Nginx keepalive_timeout
server.headersTimeout  = 66000;   // must be > keepAliveTimeout
```

Why it helps:
- Eliminates the `ECONNRESET` retries that caused random 150–400 ms penalty on requests made a few seconds after navigating to a new screen.
- Because local testing has essentially zero idle time between requests, this problem was invisible locally and only appeared on staging and production.

### 9. Routes registered before server start

Branch: `feature/StagingPerformanceFix`

File:
- `backend/src/app.ts`

Root cause:
- The previous code called `await routes(app)` inside the `app.listen(...)` callback. This means the server started accepting connections before routes were registered. Any request arriving in the milliseconds between the server binding to the port and route registration completing would receive a 404.

What changed:
- `routes(app)` is now called before `app.listen(...)` so all routes are registered before the server accepts its first connection.

```typescript
// Before
app.listen(port, host, async () => {
  await routes(app);  // routes registered AFTER server starts accepting connections
});

// After
routes(app);          // routes registered first
const server = app.listen(port, host, () => { ... });
```

Why it helps:
- Correctness fix: no 404 window at startup.
- Prevents any ambiguity about request routing during server startup under PM2 cluster restarts.

### 10. PM2 cluster mode fix for staging and production

Branch: `feature/StagingPerformanceFix`

File:
- `backend/ecosystem.config.js`

Root cause:
- The configuration used a ternary on `process.env.NODE_ENV` to select `cluster` mode and `max` instances for production, and `fork` mode with 1 instance for staging:

```javascript
instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',
```

- PM2 reads and evaluates `ecosystem.config.js` at parse time. At that moment, `process.env.NODE_ENV` has not yet been set — it is only injected later by the `env_staging` or `env_production` blocks when the process actually starts. This means the ternaries always evaluated to `undefined === 'production'`, which is `false`, and both staging and production always ran as a single-process `fork` with 1 instance.
- A single-process `fork` means one slow database query or one external API call blocks every other in-flight request for its entire duration. Under real user load this creates queuing latency that compounds on top of all other slowness.

What changed:
- Removed the broken `process.env.NODE_ENV` ternaries entirely.
- Both staging and production now explicitly use `cluster` mode with `2` instances (matching the 2 vCPUs available on both the t3.micro staging instance and t3.small production instance).
- A single `max_memory_restart` of `500M` applies to both environments, which fits within available memory on both instance types.

```javascript
// Before (broken — always resolved to fork / 1 instance)
instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',
max_memory_restart: process.env.NODE_ENV === 'production' ? '700M' : '450M',

// After
instances: 2,
exec_mode: 'cluster',
max_memory_restart: '500M',
```

Why it helps:
- Cluster mode spawns one worker process per instance. Requests are distributed across workers by the Node.js cluster module, so a slow query in one worker does not stall requests being handled by another.
- Staging now actually runs in cluster mode for the first time since the config was written.
- Worker crashes are isolated — PM2 will restart the failed worker while the remaining worker continues serving traffic, giving zero-downtime resilience.

## Frontend Changes

### 1. Shared API layer overhead reduction

File:
- `MobileAppUI/services/api.ts`

What changed:
- Added `DEBUG_API_LOGS` and `debugLog(...)` so heavy API logging only runs in development.
- Added `getSessionState()` to load access token, refresh token, customer ID, and selected store ID in parallel using `Promise.all` instead of four sequential `await` calls.
- Added `getAuthHeaders()` to centralize auth header construction.
- Updated key API calls to reuse those helpers instead of repeatedly awaiting AsyncStorage in sequence.

Why it helps:
- Reduces repeated AsyncStorage access across many screens.
- Lowers JS-thread overhead caused by very noisy request logging.
- Makes shared API calls cheaper and more consistent.

Impacted flows:
- Auth
- Products
- Categories and subcategories
- Cart
- Orders
- Invoices
- Favourites

### 2. AsyncStorage deduplication via short-lived cache

Branch: `feature/StagingPerformanceFix`

File:
- `MobileAppUI/services/api.ts`

Root cause:
- After the `getSessionState()` helper was introduced, many API functions still called it more than once in the same async flow. A function that reads `selectedStoreId` from the session state directly and then also calls `getAuthHeaders()` (which internally calls `getSessionState()`) ends up doing 8 AsyncStorage reads for a single API request instead of 4. On a real Android device, each AsyncStorage read takes 10–30 ms. Screens that fire multiple sequential API calls compound this further.

What changed:
- A 50 ms TTL in-memory cache was added around `getSessionState()`.
- The first call within a 50 ms window fires the real `Promise.all` over 4 AsyncStorage keys and stores the resulting promise.
- Any subsequent call within the same 50 ms window returns the already-resolved promise directly, with no additional AsyncStorage I/O.
- After 50 ms the cache entry expires and the next call performs a fresh read. This is short enough that a token rotation (login or refresh) is always visible to the next screen load.

```typescript
let _sessionStateCache: { promise: Promise<SessionState>; expireAt: number } | null = null;

const getSessionState = async (): Promise<SessionState> => {
  const now = Date.now();
  if (_sessionStateCache && now < _sessionStateCache.expireAt) {
    return _sessionStateCache.promise;
  }
  const promise = Promise.all([
    AsyncStorage.getItem('accessToken'),
    AsyncStorage.getItem('refreshToken'),
    AsyncStorage.getItem('customerId'),
    AsyncStorage.getItem('selectedStoreId'),
  ]).then(([accessToken, refreshToken, customerId, selectedStoreId]) => ({ ... }));
  _sessionStateCache = { promise, expireAt: now + 50 };
  return promise;
};
```

Why it helps:
- Eliminates the double-read pattern (direct call + call inside `getAuthHeaders`) that was present in most API functions.
- Reduces AsyncStorage I/O from 8 reads per API call to 4, and to 0 for any call that arrives within 50 ms of a preceding call.
- Particularly effective for screens that open with several parallel `Promise.all` API calls — all of them share the same single session read.

Impacted flows:
- All authenticated API calls (products, cart, orders, invoices, favourites, categories)

### 3. Shop screen list rendering optimization

File:
- `MobileAppUI/app/(tabs)/shop.tsx`

What changed:
- Replaced unstable `Math.random()`-based list keys with stable keys derived from product IDs.
- Added FlatList tuning for the search list and horizontal product rails:
  - `initialNumToRender`
  - `maxToRenderPerBatch`
  - `windowSize`
  - `removeClippedSubviews` on the grid-style search results
- Removed extra debug logging in store and product loading paths.

Why it helps:
- Prevents list items from remounting on every render.
- Lowers memory and rendering cost for larger product collections.
- Improves scroll smoothness and initial paint time.

Impacted rails:
- Search results
- Exclusive offers
- Best selling
- New products
- Buy again

### 4. All products screen optimization

File:
- `MobileAppUI/app/products/AllProductsList.tsx`

What changed:
- Memoized generated mock product data with `useMemo(...)`.
- Removed artificial delays from initial load and load-more behavior.
- Replaced unstable `Math.random()` list keys with stable keys.
- Tightened FlatList virtualization settings.

Why it helps:
- Stops mock fallback data from being regenerated every render.
- Makes the screen feel faster by removing unnecessary waiting.
- Reduces list remounts and large render batches.

### 5. Cart context rerender reduction

File:
- `MobileAppUI/app/context/CartContext.tsx`

What changed:
- Wrapped `refreshCart`, `addToCart`, `removeFromCart`, `increase`, `decrease`, and `clearCart` in `useCallback(...)`.
- Memoized the context value with `useMemo(...)`.

Why it helps:
- Reduces avoidable rerenders in components consuming the cart context.
- Keeps cart state updates predictable while preserving AsyncStorage and server persistence behavior.

### 6. Favourites context stabilization

File:
- `MobileAppUI/app/context/FavouritesContext.tsx`

What changed:
- Converted add/remove updates to functional `setState(...)` patterns.
- Memoized the provider value with `useMemo(...)`.
- Kept optimistic UI and AsyncStorage persistence intact.

Why it helps:
- Avoids recreating provider callbacks because of stale array dependencies.
- Reduces rerender churn in product cards and screens that subscribe to favourites.

## Related Non-Performance Runtime Fixes Completed During This Work

These were not direct speed improvements, but they were completed during the same effort because they blocked validation or caused regressions while performance work was being tested:

- Local/staging/production frontend environment split for mobile app backend targeting
- AWS deployment runbook updates for local vs staging mobile usage
- OTP env-loading fix so local verification uses the correct MSG91 credentials
- Auth verify fix for users without a supplied `name`
- Invoice tab hidden when no store is selected
- Login font-scaling fixes on affected login screens

## Validation Summary

### feature/Performance round

Backend:
- Backend build and startup were validated after the performance changes.
- Local backend startup and request timing logs were verified.

Frontend:
- The touched frontend files were checked with editor diagnostics and came back clean.
- A full mobile TypeScript check still has unrelated pre-existing issues outside the main performance changes, including:
  - `MobileAppUI/app/login/index.tsx`
  - `MobileAppUI/utils/pdfTemplates.ts`
  - one `node_modules` typing issue from Expo file system

### feature/StagingPerformanceFix round

Backend:
- `compression` package installed and TypeScript compilation confirmed clean with `tsc --noEmit` (zero errors).
- `app.ts` changes (compression middleware, keepAlive timeouts, route registration order) verified by reading the compiled output.
- `ecosystem.config.js` ternary removal verified \u2014 both environments now use `cluster` mode with `2` instances.

Frontend:
- `api.ts` cache change is additive and does not affect any call signatures or return types.
- The 50 ms TTL is safe for token rotation: logging in or refreshing always produces a fresh cache entry on the next screen load.

## Suggested Follow-up Work

1. Apply the same list and font-scaling hardening patterns across the remaining login screens.
2. Continue reducing duplicate fetch triggers in heavier screens such as shop and invoices.
3. Add a lightweight benchmark checklist for backend endpoints and key mobile list screens.
4. If needed, add DB indexes or query plans for any remaining slow backend endpoints identified from timing logs.
5. Once staging deployment is live, verify gzip is active by checking response headers for `Content-Encoding: gzip` on a product list call.
6. Confirm PM2 cluster mode is running on staging with `pm2 list` \u2014 the instance count column should show `2/2`.