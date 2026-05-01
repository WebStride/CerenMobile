# CerenMobile Architecture

## Purpose

This document describes the implemented architecture of the CerenMobile project as it exists in the repository today. It is intended to help contributors understand how the Expo mobile app, Node.js backend, Prisma data layer, and environment configuration fit together.

The project is a wholesale ordering system for distributors and store owners. Users authenticate with phone-based OTP, select a store they operate, browse products, manage cart and favourites, place orders, and review invoices.

## System Overview

At runtime, the system has four major parts:

1. Expo / React Native mobile client in `MobileAppUI/`
2. Express + TypeScript backend API in `backend/`
3. MySQL database accessed through Prisma
4. External integrations for OTP and order workflows

```text
Mobile App (Expo / React Native / Expo Router)
        |
        | HTTPS REST API
        v
Backend API (Express + TypeScript)
        |
        +--> Prisma ORM
        |       |
        |       v
        |    MySQL
        |
        +--> MSG91 OTP / messaging
        |
        +--> External order and invoice APIs
```

The mobile app does not talk directly to MySQL. All protected business operations go through the backend.

## Repository Layout

### Mobile app

`MobileAppUI/`

- `app/`: Expo Router routes and route groups
- `app/_layout.tsx`: root provider composition and global error boundary
- `app/(tabs)/`: primary tab-based application shell
- `app/login/`: OTP, registration, address, and store selection flow
- `app/context/`: React context providers for auth, cart, and favourites
- `services/api.ts`: centralized API client and token/header handling
- `utils/session.ts`: guest vs authenticated session helpers
- `app.config.js`: environment-aware Expo config generator

### Backend

`backend/`

- `src/app.ts`: Express bootstrap, env loading, middleware, health endpoint
- `src/routes.ts`: route registration
- `src/controllers/`: HTTP request handlers
- `src/service/`: core business logic and integration services
- `src/services/`: additional service layer code used by some controllers
- `src/middleware/auth.ts`: JWT verification and transparent token refresh
- `src/lib/prisma.ts`: Prisma client setup
- `prisma/schema.prisma`: database schema source of truth

## Mobile App Architecture

### Entry and navigation model

The mobile app uses Expo Router.

- `index.tsx` routes immediately into `OnboardingScreen.tsx`
- `app/_layout.tsx` wraps the app with `ErrorBoundary`, `AuthProvider`, `CartProvider`, and `FavouritesProvider`
- `app/(tabs)/_layout.tsx` defines the main tabs: Shop, Cart, Orders, Invoices, and Account

The tabs shell is aware of store selection. If `selectedStoreId` is missing from AsyncStorage, the Invoices tab is hidden and direct navigation to invoices is redirected back to shop.

### State model

There are three main state layers in the client:

1. Navigation and screen-local UI state
2. AsyncStorage-backed session state
3. Context-managed cart and favourites state

#### AuthProvider

`app/context/AuthContext.js` is intentionally lightweight. It stores transient OTP confirmation state and does not act as a full auth/session source of truth.

#### Session persistence

The durable session state lives in AsyncStorage, not React context.

Key values include:

- `accessToken`
- `refreshToken`
- `customerId`
- `selectedStoreId`
- `selectedStoreName`
- `sessionMode`

`utils/session.ts` defines guest and authenticated modes. Guest mode explicitly clears auth tokens and selected-store identifiers while preserving the ability to browse the catalog.

#### Cart and favourites

`CartContext.tsx` and `FavouritesContext.tsx` maintain UI state with server synchronization and AsyncStorage fallback behavior.

For cart specifically:

- initial load tries the backend first
- AsyncStorage is used as a fallback and local backup
- mutations optimistically update local state first
- backend sync happens in the background through `services/api.ts`

This design keeps the UI responsive even when the network is slow, but it means local and server state can briefly diverge during failures.

### API client architecture

`MobileAppUI/services/api.ts` is the client-side integration boundary.

It is responsible for:

- resolving the active backend base URL
- reading tokens and store selection from AsyncStorage
- attaching `Authorization` and `x-refresh-token` headers
- propagating selected store context through query params and `x-customer-id`
- updating stored access tokens when the backend returns `X-New-Access-Token`

The file also uses a very short-lived in-memory session cache to avoid repeated AsyncStorage reads during a single request flow.

### Guest vs authenticated behavior

The app supports two operating modes:

#### Guest mode

- no access token or refresh token
- product browsing allowed
- pricing may be missing or reduced depending on backend pricing rules
- checkout-related flows are limited

#### Authenticated mode

- OTP login completed
- access token and refresh token stored
- store selection may be required after login
- cart, favourites, orders, invoices, and addresses become store-aware or user-aware

## Backend Architecture

### Application bootstrap

`backend/src/app.ts` performs the following in order:

1. Loads `.env`
2. Loads `.env.{NODE_ENV}` if present
3. Skips placeholder MSG91 values so incomplete local config does not overwrite real environment values
4. Registers CORS, compression, JSON parsing, request timing logs, and health endpoint
5. Registers application routes
6. Starts the HTTP server

The backend defaults to port `3002` unless `PORT` is provided.

### Route registration

`backend/src/routes.ts` composes the public and protected API surface.

Major route groups:

- `/auth/*`: registration, OTP, token validation, token refresh, logout
- `/user/*`: address management and user master address
- `/products/*`: public and authenticated product browsing endpoints
- `/cart/*`: authenticated cart operations
- `/favourites/*`: authenticated favourites operations
- `/customer/*`: store lookup and customer checks
- `/orders/*`: order history and order placement
- `/invoices/*`: invoice history and invoice detail lookups
- `/support/*`: contact-us endpoint

There are two lightweight health endpoints:

- `/health`
- `/healthcheck`

### Layering model

The backend broadly follows a controller-to-service pattern.

#### Controllers

Controllers in `src/controllers/` handle:

- request parsing
- response shaping
- basic validation
- auth assumptions and ownership checks

#### Services

Business logic is split between `src/service/` and `src/services/`.

`src/service/` appears to hold most of the active application logic, including:

- auth and OTP
- products and pricing
- orders and invoices
- SMS integration

`src/services/` is still present and contains some domain-specific logic such as customer-related behavior. This split is functional but inconsistent, and contributors should check both locations before assuming a domain has a single service entry point.

### Authentication middleware

`src/middleware/auth.ts` validates access tokens and supports transparent access-token renewal.

Behavior:

1. Read bearer token from `Authorization`
2. Read refresh token from `x-refresh-token`
3. If access token is valid, continue
4. If access token is expired but refresh token is valid, mint a new access token and expose it through `X-New-Access-Token`
5. If both are invalid, return an auth error

This means the frontend must consistently send both headers for smooth session renewal.

### External integration boundaries

The backend integrates with the following external systems:

#### MSG91

Used for OTP delivery and verification.

Important behavior:

- dev/test bypass support exists for configured test numbers
- placeholder env values are intentionally filtered during env loading

#### External order and invoice APIs

Order placement and some invoice retrieval flows rely on external APIs rather than fully local transactional tables. The backend acts as the policy and integration layer between the mobile client and those external systems.

## Data Architecture

The database is MySQL, accessed through Prisma.

The schema includes many ERP-style tables, but the mobile experience depends most heavily on a smaller set of domains.

### Core domains

#### App user identity

`USERCUSTOMERMASTER`

This is the authenticated app-user table.

Key fields:

- `id`
- `name`
- `phoneNumber`
- `address`

JWT `userId` maps to `USERCUSTOMERMASTER.id`.

#### Store / business identity

`CUSTOMERMASTER`

This is the business customer or store account table.

Key fields:

- `CUSTOMERID`
- `CUSTOMERNAME`
- `PHONENO`
- `USERID`
- `PRICEGROUPID`
- `DISCOUNTGROUPID`
- `CITY`
- `PINCODE`

`CUSTOMERMASTER.USERID` links a store to an authenticated app user.

#### Cart

`Cart`

The cart is modeled as a per-customer, per-product table with a uniqueness constraint on `(customerId, productId)`.

#### Favourites

`UserFavourites`

The favourites table follows the same general pattern as the cart: it is keyed by customer and product, not by app-user alone.

#### Delivery addresses

`DeliveryAddress`

Addresses can be associated with `UserID`, `CustomerID`, or both depending on the flow.

#### Financial and invoice data

The schema also includes:

- `ACCOUNTSMASTER`
- `CUSTOMERACCOUNTHISTORY`
- `EInvoices`
- `EInvoiceItems`

These support invoice and account-history scenarios exposed in the app.

## The Most Important Architectural Rule: App User ID vs Store ID

This project has two different identities that must not be conflated.

### App user ID

This is `USERCUSTOMERMASTER.id`.

It is:

- the value inside JWT `userId`
- the authenticated human user identity
- the owner used to discover which stores belong to the logged-in user

### Store ID

This is `CUSTOMERMASTER.CUSTOMERID`.

It is:

- the active store or business account
- the identifier used for pricing, cart, favourites, orders, and invoices
- the value stored in AsyncStorage as `customerId` or `selectedStoreId`

### Relationship

One app user can operate multiple stores.

```text
USERCUSTOMERMASTER.id = 25

CUSTOMERMASTER.CUSTOMERID = 1201, USERID = 25
CUSTOMERMASTER.CUSTOMERID = 1340, USERID = 25
```

So:

- `25` is the logged-in app user
- `1201` and `1340` are stores that belong to that user

### Ownership rule

For any store-scoped operation, the backend should first prove:

```text
CUSTOMERMASTER.USERID === req.user.userId
```

and then operate using the requested `CUSTOMERMASTER.CUSTOMERID`.

### Current risk area

Some order and invoice controller fallback paths still treat `req.user.userId` as though it were a customer/store ID when no explicit `customerid` is supplied. That behavior is inconsistent with the data model and should be treated as a known architecture hazard until corrected.

## Primary Runtime Flows

### Login and store activation flow

1. User enters a phone number in `app/login/index.tsx`
2. App calls `GET /auth/check-customer`
3. App sends OTP through `POST /auth/send-otp` or registration flow
4. App verifies OTP through `POST /auth/verify`
5. Backend creates or updates `USERCUSTOMERMASTER` and returns tokens
6. App calls `GET /customer/stores`
7. User either auto-selects a single store or manually chooses one
8. App persists `selectedStoreId` for store-scoped operations

### Product browsing flow

1. Mobile screen calls a function in `services/api.ts`
2. API client attaches auth and selected-store context when available
3. Backend product controller delegates to service-layer pricing logic
4. Response is shaped for guest or authenticated store context
5. Screen renders data and cart/favourites state may overlay on top

### Cart flow

1. UI mutates local context state immediately
2. AsyncStorage is updated
3. Background API request persists the change
4. `refreshCart()` can rehydrate from the server after store changes or screen reloads

### Order placement flow

1. User confirms cart and delivery details
2. Mobile calls `/orders/place`
3. Backend validates auth and store ownership
4. Backend calls the external order API
5. Result is returned to the client and local UI updates accordingly

## Environment and Configuration Architecture

### Mobile configuration

`MobileAppUI/app.config.js` is the main environment bridge for local Expo runs.

It resolves the active env file in this order:

1. `APP_ENV`
2. `NODE_ENV`
3. fallback to `development`

Then it loads:

- `.env.local`
- `.env.development`
- `.env.production`

depending on the selected environment.

Important outputs from `app.config.js`:

- `EXPO_PUBLIC_API_URL`
- Google Maps keys
- public messaging-related values
- conditional Expo plugins such as `react-native-maps`

This config is then exposed through `Constants.expoConfig.extra` and consumed by `services/api.ts`.

### Backend configuration

The backend loads:

1. `.env`
2. `.env.{NODE_ENV}`

`NODE_ENV` controls the overlay file, while placeholder filtering prevents accidental overriding of real MSG91 values with development placeholders.

### Runtime environment switching

The intended environment split is:

- local phone testing: `.env.local`
- shared staging: `.env.development`
- production builds: `.env.production` and EAS production profiles

For local Expo and Metro sessions, `APP_ENV` is the primary switch. For production-style EAS builds, `eas.json` profile env blocks become the effective source.

## Architectural Strengths

- Clear separation between mobile client and backend API
- Centralized client API layer instead of ad hoc fetches everywhere
- Transparent token refresh handled in middleware
- Store ownership can be enforced at the backend boundary
- Prisma provides a typed access layer over a large legacy MySQL schema
- Expo config is environment-aware and supports local, staging, and production workflows

## Known Constraints and Cleanup Targets

### 1. Dual service directories

`src/service/` and `src/services/` coexist. The system works, but the split adds search cost and makes domain ownership less obvious.

### 2. ID semantics are easy to break

The app-user ID and store ID are both integers and are easy to confuse. New code should always name variables explicitly as `userId` or `customerId` and should avoid ambiguous names like `id` in store-aware controller code.

### 3. Optimistic client state can drift

Cart and favourites prioritize UI responsiveness. If background persistence fails, local state may temporarily differ from backend state until refresh.

### 4. Client auth contract is strict

If the client stops sending `x-refresh-token`, automatic access-token renewal stops working even though the backend still supports it.

### 5. Deployment docs must respect the current app port

The backend code defaults to port `3002`. Any deployment, reverse proxy, or PM2 configuration should explicitly set `PORT` if it expects a different internal port.

## High-Signal Files

These files are the fastest way to rebuild mental context when working on the project:

- `MobileAppUI/app/_layout.tsx`
- `MobileAppUI/app/(tabs)/_layout.tsx`
- `MobileAppUI/app/login/index.tsx`
- `MobileAppUI/services/api.ts`
- `MobileAppUI/utils/session.ts`
- `MobileAppUI/app.config.js`
- `backend/src/app.ts`
- `backend/src/routes.ts`
- `backend/src/middleware/auth.ts`
- `backend/src/controllers/orders/index.ts`
- `backend/src/controllers/customer.ts`
- `backend/prisma/schema.prisma`

## Summary

CerenMobile is an Expo mobile client backed by an Express API over a MySQL schema exposed through Prisma. The backend is the policy layer for authentication, store ownership, pricing access, orders, and invoices. The single most important architecture rule is that JWT `userId` represents the app user, while cart, pricing, orders, and invoices operate in the context of `CUSTOMERMASTER.CUSTOMERID`.

If contributors preserve that distinction and keep environment configuration aligned between `app.config.js`, env files, and EAS profiles, most of the system remains straightforward to extend.
