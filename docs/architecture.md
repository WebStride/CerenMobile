# CerenMobile Architecture

## Overview

CerenMobile is a wholesale ordering mobile application built for store owners and distributors to browse products, manage favourites and cart items, place orders, review invoices, and manage delivery addresses.

The system has three main layers:

1. Mobile client in Expo / React Native
2. Backend API in Node.js / Express with Prisma
3. MySQL database plus an external ERP/order API

At a high level, the mobile app talks only to the backend API. The backend is responsible for authentication, ownership checks, business rules, MySQL access, and communication with the external order and invoice services.

```text
Mobile App (Expo / React Native)
        |
        | HTTPS REST APIs
        v
Backend API (Express + Prisma)
        |
        +--> MySQL database
        |
        +--> External ERP API for order placement and invoice sync
        |
        +--> MSG91 for OTP and admin notifications
```

## Repository Structure

### Mobile App

`MobileAppUI/`

- `app/`: Expo Router screens and route groups
- `app/login/`: login, OTP, location, address, and store selection flow
- `app/(tabs)/`: primary app tabs for shop, cart, orders, invoices, and account
- `app/context/`: React context providers for auth, cart, and favourites
- `services/api.ts`: all backend API calls and notification helper calls
- `services/useAuth.ts`: token validation and session recovery
- `utils/session.ts`: guest and authenticated session mode helpers

### Backend

`backend/`

- `src/app.ts`: Express bootstrap, env loading, middleware, health endpoint
- `src/routes.ts`: full route registration
- `src/controllers/`: request handling layer
- `src/service/` and `src/services/`: business logic and integrations
- `src/middleware/auth.ts`: JWT auth and token refresh handling
- `prisma/schema.prisma`: source of truth for the database model

## Core Identity Model

The most important architectural concept in this project is that there are two different identities:

1. The app user
2. The customer store

These are stored in different tables and they serve different purposes.

### 1. `USERCUSTOMERMASTER`

This table represents the app-level user account.

Relevant fields:

- `id`: primary key for the app user
- `name`: app user name
- `phoneNumber`: unique phone used for login
- `address`: latest saved address summary

This is the identity used in JWT tokens.

When a user logs in successfully, the backend creates or updates a `USERCUSTOMERMASTER` row and generates tokens using:

- `userId = USERCUSTOMERMASTER.id`
- `phoneNumber = USERCUSTOMERMASTER.phoneNumber`

This means:

- `req.user.userId` in backend middleware always refers to `USERCUSTOMERMASTER.id`
- this is the authenticated app user identity

### 2. `CUSTOMERMASTER`

This table represents the business customer or store account.

Relevant fields:

- `CUSTOMERID`: primary key for the store/customer record
- `CUSTOMERNAME`: store name
- `PHONENO`: store phone number
- `USERID`: link to `USERCUSTOMERMASTER.id`
- `PRICEGROUPID`: determines pricing column logic
- `DISCOUNTGROUPID`: determines discount configuration
- `CITY`, `PINCODE`, `ADDRESS`: store details

This is not the login identity. This is the business entity that:

- owns orders
- owns invoices
- owns cart and favourites state in the app
- determines pricing rules
- is selected as the active store when a user has multiple stores

## `customerId`, `storeId`, and `userCustomerMasterID`

This distinction is critical.

### `userCustomerMasterID`

In practical terms, this means `USERCUSTOMERMASTER.id`.

This is:

- the authenticated user ID
- stored in JWT as `userId`
- used to find which stores belong to the logged-in user

### `customerId` or `storeId`

In practical terms, this means `CUSTOMERMASTER.CUSTOMERID`.

This is:

- the selected store/business account ID
- stored in mobile session state as `customerId` and `selectedStoreId`
- used for cart, favourites, orders, invoices, and pricing

### Relationship Between the Two

`CUSTOMERMASTER.USERID` points to `USERCUSTOMERMASTER.id`.

That means one app user can be linked to zero, one, or many store records.

```text
USERCUSTOMERMASTER
  id = 25
  name = Amit
  phoneNumber = +919999999999

CUSTOMERMASTER
  CUSTOMERID = 1201   USERID = 25   CUSTOMERNAME = Store A
  CUSTOMERID = 1340   USERID = 25   CUSTOMERNAME = Store B
```

So:

- `25` is the logged-in user
- `1201` and `1340` are stores owned by that user

The app authenticates the user with `USERCUSTOMERMASTER`, but operational data is typically executed against a selected `CUSTOMERMASTER` row.

## Why the App Needs Both IDs

The split exists because one person can operate multiple stores.

If the system used only one user table, it would not correctly model:

- multiple stores for the same phone/login
- store-level pricing
- store-level invoices and orders
- store selection after login

The architecture therefore separates:

- human identity and authentication: `USERCUSTOMERMASTER`
- business/store identity: `CUSTOMERMASTER`

## Registration and Login Flow

## Step 1: Phone Check

The app starts in `MobileAppUI/app/login/index.tsx`.

The user enters a phone number. The app calls:

- `GET /auth/check-customer?phone=...`

The backend checks whether the phone exists in `USERCUSTOMERMASTER` and may also resolve a linked `CUSTOMERMASTER`.

This determines whether the flow is:

- existing user login
- new user registration

## Step 2: OTP Send

For both registration and login, the app sends an OTP through MSG91.

Backend route:

- `POST /auth/register`
- `POST /auth/send-otp`

Backend service:

- formats the phone number to `+91XXXXXXXXXX`
- sends OTP using MSG91

## Step 3: OTP Verification

The app verifies OTP through:

- `POST /auth/verify`

On success, the backend:

1. verifies the OTP
2. upserts the user in `USERCUSTOMERMASTER`
3. generates `accessToken` and `refreshToken`
4. returns user payload and tokens

The returned `user.id` is the `USERCUSTOMERMASTER.id`.

## Step 4: Store Lookup

After login, the app calls:

- `GET /customer/stores`

The backend uses the authenticated JWT user ID and finds stores by:

- `CUSTOMERMASTER.USERID = req.user.userId`

Possible outcomes:

1. No linked stores
2. One linked store
3. Multiple linked stores

### No linked stores

The user can still browse catalog-style flows, add address details, and continue in a limited mode depending on feature requirements.

### One linked store

The app automatically stores that `CUSTOMERID` as the active store.

### Multiple linked stores

The app routes the user to store selection.

## Step 5: Active Store Selection

The selected store is persisted in AsyncStorage using keys such as:

- `customerId`
- `selectedStoreId`
- `selectedStoreName`

These values refer to `CUSTOMERMASTER.CUSTOMERID`, not `USERCUSTOMERMASTER.id`.

From this point onward, most business APIs run in the context of the selected store.

## Session and Authentication Model

The app stores the following auth/session state in AsyncStorage:

- `accessToken`
- `refreshToken`
- `userData`
- `customerId`
- `selectedStoreId`
- `selectedStoreName`
- `sessionMode`

### Token Behavior

- access token is short-lived
- refresh token is long-lived
- backend middleware can issue a new access token when refresh token is valid
- backend attaches refreshed token using `X-New-Access-Token`

### Guest Mode

The app also supports guest mode through `utils/session.ts`.

In guest mode:

- auth tokens are removed
- store selection is removed
- user browses without authenticated ordering capabilities

## Ownership and Security Model

Every endpoint that works on store-scoped data must ensure that the selected `customerId` belongs to the authenticated user.

This is done using the relationship:

- `CUSTOMERMASTER.CUSTOMERID = requested customerId`
- `CUSTOMERMASTER.USERID = req.user.userId`

This pattern is used in features like:

- cart
- favourites
- orders
- invoices

This prevents one authenticated user from passing another store's `CUSTOMERID` and accessing data they do not own.

## How the Whole App Works

## Frontend Layer

The mobile app is built with Expo Router and organized around route groups and screen-level flows.

Main frontend responsibilities:

- authentication screens
- product browsing
- cart and favourites state
- store switching
- address selection and management
- order and invoice display

React Context is used for shared state:

- `AuthProvider`: auth-related transient state
- `CartProvider`: cart state and sync with backend
- `FavouritesProvider`: favourites state and sync with backend

## Backend Layer

The backend follows a layered approach.

### Routes

Defined in `backend/src/routes.ts`.

These map HTTP endpoints to controllers.

### Controllers

Controllers parse requests, validate input, call service methods, and return responses.

Examples:

- auth controllers
- user controllers
- customer controllers
- cart controllers
- favourites controllers
- orders controllers
- support controllers

### Services

Services contain the business logic and database interactions.

Examples:

- auth service handles OTP, token generation, and user upsert
- product service handles category/product retrieval and pricing logic
- cart service handles upsert/update/delete cart rows
- orders service handles DB lookups and external ERP API integration
- support and SMS service handles MSG91 notifications

### Database Access

Prisma is used as the ORM over MySQL.

The database contains both:

- app-specific tables such as `USERCUSTOMERMASTER`, `DeliveryAddress`, `Cart`, `UserFavourites`
- ERP-style master and transaction tables such as `CUSTOMERMASTER`, `Orders`, `OrderItems`, `Invoices`, `InvoiceItems`, `ProductMaster`

## Major Functional Areas

## 1. Product Discovery

Users browse:

- exclusive offers
- best-selling products
- new products
- buy-again products
- categories and subcategories
- similar products

These are served by backend product endpoints and shaped according to pricing context.

## 2. Pricing Logic

Pricing is store-aware.

The backend resolves pricing using the selected customer/store's `PRICEGROUPID` and then maps that to the relevant price column in the product tables.

So the selected `CUSTOMERMASTER` row affects what price the user sees.

This is another reason the store identity cannot be replaced by the app user identity.

## 3. Cart and Favourites

Cart and favourites are stored against `customerId`, meaning the selected store.

This enables:

- store-specific cart state
- store-specific favourites
- correct ordering context

The app uses optimistic UI updates, while the backend persists records in `Cart` and `UserFavourites`.

## 4. Delivery Addresses

Addresses are primarily app-user-facing data.

The `DeliveryAddress` table can link to both:

- `UserID`
- `CustomerID`

This allows the system to support user-level saved addresses while still associating addresses to a store when needed.

The `USERCUSTOMERMASTER.address` column acts as a summary copy of the latest address.

## 5. Orders

Orders are placed from the cart for a selected store.

Flow:

1. user prepares cart
2. app calls `POST /orders/place`
3. backend validates payload
4. backend forwards the request to the external ERP API
5. backend returns the result to the app

Orders are store-scoped. The selected `customerId` is therefore mandatory for correct behavior.

## 6. Invoices

Invoices are fetched per selected store.

The backend can read invoice data from the local database and also call the external API for customer/date-range queries.

This means invoice views are also tied to `CUSTOMERMASTER.CUSTOMERID`.

## 7. Support and Notifications

The system uses MSG91 for:

- OTP delivery
- contact-us alerts
- new registration admin notifications
- price request notifications

## Typical Request Lifecycle

Example: fetching cart

1. mobile app reads `accessToken` and selected `customerId`
2. app sends `GET /cart?customerId=...`
3. backend auth middleware validates JWT
4. backend controller verifies that requested `customerId` belongs to `req.user.userId`
5. backend service queries `Cart`
6. backend returns cart items
7. frontend context updates UI state

## Architecture Summary

The architecture is centered on a deliberate separation:

- `USERCUSTOMERMASTER` answers: who is logged in?
- `CUSTOMERMASTER` answers: which business/store is being operated?

That distinction drives:

- store selection
- pricing
- cart ownership
- favourites ownership
- order placement
- invoice retrieval
- authorization checks

If you remember only one rule while working on this codebase, it should be this:

> `req.user.userId` is the app user from `USERCUSTOMERMASTER`, while `customerId` or `storeId` is the selected business store from `CUSTOMERMASTER`.

Mixing those two IDs will produce incorrect data access, broken pricing behavior, or authorization bugs.

## Known Inconsistency in Current Code

The intended architecture is consistent across auth, customer, cart, favourites, and most store-scoped flows. However, the current implementation of some orders and invoices controller fallback paths still uses `req.user.userId` as if it were a `customerId` when no explicit `customerid` query parameter is provided.

That behavior does not match the actual data model and should be treated as a bug or legacy shortcut, not as the correct architecture.

The correct rule remains:

- `req.user.userId` maps to `USERCUSTOMERMASTER.id`
- selected `customerId` or `storeId` maps to `CUSTOMERMASTER.CUSTOMERID`

## Quick Reference

| Concept | Table | Column | Used For |
|---|---|---|---|
| App user ID | `USERCUSTOMERMASTER` | `id` | JWT auth, user identity |
| User phone login | `USERCUSTOMERMASTER` | `phoneNumber` | OTP login |
| Store/customer ID | `CUSTOMERMASTER` | `CUSTOMERID` | cart, orders, invoices, pricing |
| Link from store to app user | `CUSTOMERMASTER` | `USERID` | ownership and store lookup |
| Selected store in app | AsyncStorage | `customerId` / `selectedStoreId` | active store context |

## Recommended Developer Rule

Before writing or changing any feature, ask:

1. Is this user-scoped or store-scoped?
2. Should I use `req.user.userId` or selected `customerId`?
3. Do I need to verify `CUSTOMERMASTER.USERID = req.user.userId` before continuing?

That decision is the foundation of correct implementation in this project.