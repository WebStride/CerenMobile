# Environment Setup for CerenMobile (Backend + MobileAppUI)

This guide explains how to manage 2 deployment environments in your repo:
- `develop` (staging/dev)
- `main` (production)

## Backend (`backend/`)

### Env file strategy
Use these files in the backend root:
- `.env.development` (for `develop`/staging)
- `.env.production` (for `main`/production)
- `.env.example` (template, no secrets)

### How loading works
`backend/src/app.ts` now loads`NODE_ENV`-specific env file:
- `NODE_ENV=development` -> `.env.development`
- `NODE_ENV=production` -> `.env.production`
- fallback -> `.env`

### Run commands
For develop/staging:
```bash
cd backend
NODE_ENV=development npm run dev
```
For production:
```bash
cd backend
NODE_ENV=production npm start  # or node build/app.js
```

### Deploy workflow (matching your GitHub Actions)
- Push to `develop` → CI runs `deploy-staging` (staging server)
- Push to `main` → CI runs `deploy-production` (production server)

## Mobile app (`MobileAppUI`)

### Env file strategy
- `.env.development` (for developer/live staging backend URL)
- `.env.production` (for production backend URL)
- `.env.development.example` and `.env.example` for template

### app.config.js behavior
`NODE_ENV` is used to load `.env.${NODE_ENV}`. If missing, falls back to `.env`.
- `NODE_ENV=development` → `.env.development` (e.g. `EXPO_PUBLIC_API_URL=http://192.168.x.x:3003`)
- `NODE_ENV=production` → `.env.production` (e.g. `EXPO_PUBLIC_API_URL=https://cerenmobile.onrender.com`)

### Run devel or prod locally
```bash
cd MobileAppUI
NODE_ENV=development npm run start
# (or use expo prebuild/eas commands)
```

```bash
cd MobileAppUI
NODE_ENV=production npm run start
```

## How to debug production logs when needed
- Your production branch (`main`) should already be deployed via GitHub Actions using production env vars.
- Reproduce issue from production by checking the `main` branch code / logs.
- If you need local debug with production server, set env to production:
  - `NODE_ENV=production` backend
  - `EXPO_PUBLIC_API_URL` points at production API in mobile env config

## Branch workflow (apply exactly now)
1. Develop new features on `develop` via feature branches.
2. Push feature branch, PR to `develop`.
3. Merge after tests pass.
4. Test on staging.
5. Create PR `develop -> main` and merge when stable.

> This setup ensures `develop` has all main updates (shadowing production), and `main` stays clean for production debugging.
