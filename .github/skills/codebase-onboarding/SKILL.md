---
name: codebase-onboarding
description: 'Complete guide for new developers or AI agents entering the CerenMobile codebase for the first time. Covers project structure, key files, critical architecture decisions, environment setup, development workflow, and where to find things. Use at the start of any new session, when onboarding a new team member, or when resuming work after a long break.'
argument-hint: 'What role or area are you onboarding to? (full-stack, mobile, backend, AI agent session)'
origin: ECC
---

# Codebase Onboarding — CerenMobile

**Applies to:** New developers, new AI agents, and anyone resuming work after a break.  
**Trigger:** Start of a new work session, team member joins, or AI agent begins a fresh session.

> "30 minutes of orientation saves 3 hours of wrong assumptions."

---

## When to Activate

- First time working in this codebase
- Resuming after more than 1 week away
- Starting a new AI Copilot/Claude session
- Onboarding a new team member
- Starting work in an unfamiliar part of the codebase

---

## Step 1 — Read the Source of Truth Files

Always read these first, in order:

```
1. docs/architecture.md          → System design, data model, auth flow, database
2. .github/design.md             → UI/UX design system, component patterns
3. .github/memory/decisions.md   → Past architecture decisions that must not be reversed
4. .github/memory/lessons.md     → Prior mistakes to avoid
5. .github/memory/anti-patterns.md → Patterns that caused bugs — never repeat these
```

If any of these files are missing, that's a gap to fix.

---

## Step 2 — Project Structure Overview

```
CerenMobile/
├── backend/                    ← Node.js + Express + Prisma backend
│   ├── src/                   ← TypeScript source (edit this)
│   │   ├── app.ts             ← Express app setup, middleware
│   │   ├── routes.ts          ← Top-level route registration
│   │   ├── controllers/       ← Request handlers (thin layer)
│   │   ├── services/          ← Business logic (fat layer)
│   │   ├── middleware/        ← Auth middleware, error handlers
│   │   ├── lib/prisma.ts      ← Prisma client singleton
│   │   └── routes/            ← Route files by domain
│   ├── prisma/
│   │   ├── schema.prisma      ← Database schema (source of truth for DB)
│   │   └── migrations/        ← Migration history (never edit manually)
│   ├── build/                 ← Compiled JS output (never edit)
│   └── package.json
│
├── MobileAppUI/               ← React Native + Expo mobile app
│   ├── app/                   ← Expo Router screens
│   │   ├── _layout.tsx        ← Root layout, auth guard
│   │   ├── index.tsx          ← Entry point redirect
│   │   ├── (tabs)/            ← Tab navigation screens
│   │   ├── login/             ← Auth screens
│   │   ├── products/          ← Product browsing
│   │   ├── orders/            ← Order management
│   │   ├── invoices/          ← Invoice viewing
│   │   ├── account/           ← User account
│   │   └── context/           ← React context providers
│   ├── components/            ← Shared UI components
│   ├── services/              ← API service layer, hooks
│   │   ├── api.ts             ← Base API client with auth
│   │   ├── useAuth.ts         ← Auth state management
│   │   └── useFetch.ts        ← Generic data fetching hook
│   ├── utils/                 ← Pure utility functions
│   ├── constants/             ← App constants, image references
│   ├── interfaces/            ← TypeScript type definitions
│   └── assets/                ← Images, fonts
│
└── docs/                      ← Architecture and deployment docs
```

---

## Step 3 — Critical Architecture Facts

### Identity Model (CRITICAL — never confuse these)

From `docs/architecture.md`:

```
USERCUSTOMERMASTER.id        → Auto-incremented internal row ID (used for JWT)
USERCUSTOMERMASTER.customerId → References CUSTOMERMASTER.CUSTOMERID (business ID)

When querying orders, invoices, products:
  → Use customerId (the business ID)
  
When identifying the logged-in user:
  → Use USERCUSTOMERMASTER.id (the JWT subject)
  → Then look up customerId from that record
```

**NEVER use `USERCUSTOMERMASTER.id` to query business data. Always resolve to `customerId` first.**

### Authentication Flow

```
1. User enters phone number
2. MSG91 sends OTP SMS
3. User enters OTP
4. Backend validates OTP via MSG91
5. Backend finds USERCUSTOMERMASTER record by phone
6. Issues JWT: { sub: userCustomerMaster.id, customerId: ... }
7. Mobile stores tokens in expo-secure-store (NOT AsyncStorage)
8. API requests include Bearer token
9. Auth middleware validates JWT and attaches user to req.user
```

### API Communication

```
Mobile → Backend: HTTP REST API
Base URL: process.env.EXPO_PUBLIC_API_BASE_URL (mobile)
Base URL: process.env.API_BASE_URL (backend doesn't call itself)

Auth header: Authorization: Bearer <accessToken>
Token refresh: POST /api/auth/refresh with refreshToken in body
```

---

## Step 4 — Development Environment Setup

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Fill in values
npx prisma generate
npm run dev
```

**Required `.env` values:**
```
DATABASE_URL=mysql://user:pass@host:3306/dbname
ACCESS_TOKEN_SECRET=<min 32 char random string>
REFRESH_TOKEN_SECRET=<min 32 char random string>
MSG91_API_KEY=<from MSG91 dashboard>
PORT=3000
```

### Mobile Setup
```bash
cd MobileAppUI
npm install
# Create .env file with:
# EXPO_PUBLIC_API_BASE_URL=http://YOUR_IP:3000
npx expo start -c
```

**Finding your local IP for device testing:**
```bash
# Mac:
ipconfig getifaddr en0
# or:
curl ifconfig.me
```

---

## Step 5 — Key Commands Reference

```bash
# Backend
cd backend && npm run dev              # Start dev server (ts-node-dev)
cd backend && npm run build            # Compile TypeScript
cd backend && npx prisma studio        # Visual DB browser
cd backend && npx prisma migrate dev   # Create+apply migration
cd backend && npx prisma generate      # Regenerate Prisma client

# Mobile
cd MobileAppUI && npx expo start -c   # Start Metro bundler (clear cache)
cd MobileAppUI && npx expo start --tunnel  # Tunnel mode for device
cd MobileAppUI && eas build --platform android --profile preview  # Build APK
cd MobileAppUI && npx tsc --noEmit    # TypeScript check only

# Quality gates (run before any push)
cd backend && npx tsc --noEmit && npm run lint && npm run build
cd MobileAppUI && npx tsc --noEmit && npm run lint
```

---

## Step 6 — Where to Find Things

| What you need | Where to look |
|---|---|
| Database schema | `backend/prisma/schema.prisma` |
| API routes | `backend/src/routes.ts` → `backend/src/routes/` |
| Business logic | `backend/src/services/` |
| Auth middleware | `backend/src/middleware/auth.ts` |
| API client | `MobileAppUI/services/api.ts` |
| Auth state | `MobileAppUI/services/useAuth.ts` |
| Navigation | `MobileAppUI/app/_layout.tsx` |
| Global types | `MobileAppUI/interfaces/interfaces.d.ts` |
| Environment setup | `ENVIRONMENT.md` (project root) |
| Architecture decisions | `.github/memory/decisions.md` |
| Design system | `.github/design.md` |

---

## Step 7 — Anti-Patterns to Avoid Immediately

From `.github/memory/anti-patterns.md`:

1. **Never** use `AsyncStorage` for tokens — use `expo-secure-store`
2. **Never** hardcode IPs or URLs — use env vars
3. **Never** query business data using `USERCUSTOMERMASTER.id` directly — always resolve to `customerId`
4. **Never** skip auth middleware on protected endpoints
5. **Never** run `prisma migrate dev` in production — use `prisma migrate deploy`
6. **Never** commit `.env` files

---

## Step 8 — Current Known State

Check these files for current project status:
```
DEBUGGING_GUIDE.md              → Active bugs and debugging notes
PLACE_ORDER_SETUP.md            → Order placement workflow details
PRICING_DEBUG_STEPS.md          → Pricing calculation reference
docs/AWS_DEPLOYMENT.md          → Production server details
docs/PERFORMANCE_CHANGES.md     → Performance optimizations history
```

---

## Verification Checklist

- [ ] `docs/architecture.md` read and understood
- [ ] `.github/design.md` read (if doing mobile UI work)
- [ ] `.github/memory/decisions.md` reviewed
- [ ] `.github/memory/anti-patterns.md` reviewed
- [ ] Development environment running (backend + mobile)
- [ ] Database connection verified (`prisma studio` opens)
- [ ] Identity model distinction understood (USERCUSTOMERMASTER.id vs customerId)
- [ ] Auth flow understood
- [ ] Key commands memorized or bookmarked
- [ ] `.env` files configured but NOT committed
