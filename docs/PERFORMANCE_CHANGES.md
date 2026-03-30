# Performance Changes

This document summarizes the backend and frontend performance work completed in the `feature/Performance` branch.

The goal of these changes was to improve API response time, reduce repeated work in the mobile app, avoid unnecessary rerenders, and make local debugging of latency issues easier.

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

## Frontend Changes

### 1. Shared API layer overhead reduction

File:
- `MobileAppUI/services/api.ts`

What changed:
- Added `DEBUG_API_LOGS` and `debugLog(...)` so heavy API logging only runs in development.
- Added `getSessionState()` to load access token, refresh token, customer ID, and selected store ID in parallel.
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

### 2. Shop screen list rendering optimization

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

### 3. All products screen optimization

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

### 4. Cart context rerender reduction

File:
- `MobileAppUI/app/context/CartContext.tsx`

What changed:
- Wrapped `refreshCart`, `addToCart`, `removeFromCart`, `increase`, `decrease`, and `clearCart` in `useCallback(...)`.
- Memoized the context value with `useMemo(...)`.

Why it helps:
- Reduces avoidable rerenders in components consuming the cart context.
- Keeps cart state updates predictable while preserving AsyncStorage and server persistence behavior.

### 5. Favourites context stabilization

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

Backend:
- Backend build and startup were validated after the performance changes.
- Local backend startup and request timing logs were verified.

Frontend:
- The touched frontend files were checked with editor diagnostics and came back clean.
- A full mobile TypeScript check still has unrelated pre-existing issues outside the main performance changes, including:
  - `MobileAppUI/app/login/index.tsx`
  - `MobileAppUI/utils/pdfTemplates.ts`
  - one `node_modules` typing issue from Expo file system

## Suggested Follow-up Work

1. Apply the same list and font-scaling hardening patterns across the remaining login screens.
2. Continue reducing duplicate fetch triggers in heavier screens such as shop and invoices.
3. Add a lightweight benchmark checklist for backend endpoints and key mobile list screens.
4. If needed, add DB indexes or query plans for any remaining slow backend endpoints identified from timing logs.