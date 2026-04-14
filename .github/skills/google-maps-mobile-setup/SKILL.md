---
name: google-maps-mobile-setup
description: 'Configure Google Maps in Expo or React Native mobile apps and implement live place search, tap-to-pin location selection, reverse geocoding, and environment-safe API key handling. Use when adding or fixing maps, location permission flows, Google Places autocomplete, place details, geocoding, distributor locator screens, or pin location UX in this CerenMobile project.'
argument-hint: 'What do you need: setup, fix, or build? Example: "Expo Google Maps config for Android and iOS", "live search + pin location screen", or "secure backend proxy for Places API"'
user-invocable: true
disable-model-invocation: false
---

# Google Maps Mobile Setup

Use this skill when working on Google Maps, location permissions, live place search, or pin-drop flows in the mobile app.

This skill is tailored to the current CerenMobile stack:
- Expo + React Native mobile app under `MobileAppUI/`
- `react-native-maps` for map rendering
- `expo-location` for permissions, GPS, geocoding, and reverse geocoding
- Google Maps / Places / Geocoding APIs for search and pin location flows

## Primary Outcome

Produce a working, secure, and testable map flow that covers:
- Android and iOS Google Maps configuration
- environment-based API key loading
- location permission handling
- live search with autocomplete
- place selection and place details lookup
- tap-to-pin marker placement
- reverse geocoding from coordinates to address
- handoff of the selected address and coordinates back to the calling screen

## Repo Context

Before designing anything new, inspect the current implementation:
- `MobileAppUI/app/login/PinLocation.tsx`
- `MobileAppUI/app.config.js`
- `MobileAppUI/app.json`
- `backend/src/controllers/maps.ts` or the built equivalent if source is missing
- `backend/src/routes.ts`

Current verified repo state:
- `PinLocation.tsx` already contains a substantial map flow with GPS lookup, debounced search, tap-to-pin, and reverse geocoding.
- `app.config.js` already loads map keys from env and injects them into Expo config.
- `app.json` still contains Google Maps keys in tracked config. Treat that as a security and configuration drift issue.
- Backend maps endpoints exist in controller code but are currently not wired in routes.

## When To Use

Use this skill for requests like:
- "configure Google Maps in Expo"
- "fix map not loading on Android or iOS"
- "add place autocomplete"
- "build a pick location screen with a pin"
- "reverse geocode the tapped coordinate"
- "secure Google Places API keys"
- "add nearby distributor lookup with map"

## Phase 1 — Classify The Task

First identify which of these jobs is being requested:

1. Config only
Add or fix Android and iOS Google Maps setup, permissions, env keys, or EAS build config.

2. Feature build
Create or improve a map screen with search, GPS centering, marker placement, and address selection.

3. Security hardening
Move Places and Geocoding calls behind a backend proxy, lock down keys, and remove tracked secrets.

4. UX or bug fix
Resolve grey map screens, missing permissions, stale search results, incorrect coordinates, or poor fallback behavior.

If the request combines multiple categories, handle config and security first, then build the UI flow.

## Phase 2 — Verify Configuration

For Expo or Expo Router apps, verify the configuration path before touching screen code.

### Required checks

- Confirm whether `app.config.js` or `app.json` is the active source of truth.
- Confirm whether keys come from env files, EAS profile env, or tracked config.
- Confirm the app uses Google provider intentionally on iOS as well as Android.
- Confirm the project is using `react-native-maps` and `expo-location` versions compatible with the installed Expo SDK.

### Required config rules for this repo

1. Prefer `MobileAppUI/app.config.js` as the single source of truth for maps keys.
2. Do not keep live API keys in `MobileAppUI/app.json`.
3. Keep map keys in env files or EAS profile env values, not in tracked JSON.
4. Ensure iOS permission strings are present for foreground location usage.
5. If native config changes are made, require a rebuild instead of assuming Expo Go hot reload is enough.

### Minimum Expo setup target

The config should effectively provide:
- Android Google Maps API key
- iOS Google Maps API key
- `NSLocationWhenInUseUsageDescription`
- optional `expo-location` config plugin when location permission text must be managed centrally

### CerenMobile-specific config audit

Check these files in order:
- `MobileAppUI/app.config.js`
- `MobileAppUI/.env.local`
- `MobileAppUI/.env.development`
- `MobileAppUI/.env.production`
- `MobileAppUI/eas.json`
- `MobileAppUI/app.json`

If `app.json` still contains Google Maps API keys, remove them and keep only env-driven values in `app.config.js`.

## Phase 3 — Choose API Exposure Strategy

Decide how the app will call Google APIs.

### Option A — Client-side calls

Use only when:
- the feature must move quickly
- the key can be tightly restricted by package name, SHA-1, or bundle ID
- the risk of exposing Places and Geocoding usage in the app bundle is accepted temporarily

### Option B — Backend proxy

Prefer this for production when using Places autocomplete, place details, or geocoding.

Use a backend proxy when:
- you want to avoid shipping sensitive API usage directly in the mobile bundle
- you need centralized rate limiting or logging
- you want to rotate keys without rebuilding the app
- you want to hide exact Google API usage from clients

### Decision rule

- Map tiles and native SDK config still require platform keys.
- Search, place details, geocoding, and reverse geocoding should prefer a backend proxy when the product is going to production.

For this repo, note that backend maps controller logic exists already, but route wiring is incomplete. Reuse that before building a new proxy layer from scratch.

## Phase 4 — Define The User Flow

Model the exact interaction flow before coding.

### Recommended live-search + pin flow

1. Screen opens with a safe fallback region.
2. Request foreground location permission.
3. In parallel:
   - attempt GPS lookup
   - if a prior address was supplied, geocode it
4. Show whichever valid result resolves first.
5. Allow the user to type in a search box.
6. Debounce the search input.
7. Show autocomplete results.
8. On result selection, fetch place details or geocode result.
9. Animate the map to the selected coordinate.
10. Drop or move the marker.
11. Reverse geocode the marker coordinate.
12. Confirm and pass the selected address, latitude, and longitude back to the previous screen.

### Mandatory UX states

- initial loading state while the first location strategy resolves
- inline loading state for live search
- empty search state
- denied-permission state with user guidance
- failed geocode or search fallback message
- confirm-selection action that is disabled while navigation or save is in-flight

## Phase 5 — Implement Search Correctly

Autocomplete and live search are easy to make noisy or expensive. Follow these rules.

### Search rules

- Start searching only after 2 or 3 characters.
- Debounce at 300 to 500 ms.
- Cancel or ignore stale responses.
- Do not fetch place details for every list item preemptively.
- Fetch details only after the user selects a result.
- Normalize search results into one stable type before rendering.

### Suggested response shape

Use a shared type such as:

```ts
type SearchResult = {
  displayName: string;
  displayAddress: string;
  latitude: number;
  longitude: number;
  placeId?: string;
};
```

### Search quality checklist

- Debounce exists
- duplicate requests are avoided
- stale responses do not overwrite newer results
- no crash on empty result sets
- selecting a result moves the marker and address together

## Phase 6 — Implement Pin Location Correctly

Pin location is not just placing a marker. The coordinate, camera, and address must stay in sync.

### Required behavior

- tapping the map moves the marker
- dragging or selecting a new point updates the chosen coordinate
- the map camera animates to the chosen point when appropriate
- reverse geocoding updates the visible address after a tap or drag
- the selected coordinate survives navigation back to the caller

### Map interaction rules

- Use a stable initial region even before GPS resolves.
- Keep the marker state separate from the visible region state.
- Only animate the camera when the new coordinate is intentional, not on every render.
- Do not let reverse geocode responses overwrite a newer manual selection.

## Phase 7 — Extract Reusable Modules When The Flow Is Shared

If more than one screen will use maps, do not keep all logic inline in a single screen component.

Extract these pieces when reuse is expected:
- `useLocationPermission`
- `useDeviceLocation`
- `usePlacesAutocomplete`
- `useReverseGeocode`
- `MapLocationPicker` component
- shared `LocationSelection` and `SearchResult` types

For this repo, `PinLocation.tsx` is already a good extraction candidate.

## Phase 8 — Security And Key Management

This phase is mandatory before production release.

### Rules

- Never commit live Google Maps or Places keys to tracked files.
- Restrict Android keys by package name and SHA-1 certificate fingerprint.
- Restrict iOS keys by bundle identifier.
- Use separate keys for mobile SDK usage and server-side Places or Geocoding usage when possible.
- Prefer backend proxying for autocomplete, place details, and geocoding in production.
- Remove stale fallback URLs or old key names after migration to the final config path.

### CerenMobile-specific hardening checks

- remove hardcoded keys from `MobileAppUI/app.json`
- confirm `MobileAppUI/app.config.js` is the only tracked maps config source
- confirm env files and EAS profiles carry the correct values for each environment
- confirm backend proxy routes are either fully wired and used, or intentionally removed

## Phase 9 — Testing Matrix

Every completed maps change should be tested across the relevant runtime path.

### Test paths

1. Expo Go on a real Android device
2. Expo Go on a real iPhone if supported by the chosen map stack
3. Android emulator or development build
4. iOS simulator or development build
5. Production-style EAS build if native config changed

### Verify all of the following

- map renders without a grey or blank screen
- current location permission prompt appears correctly
- GPS fallback behaves predictably when permission is denied
- live search returns results and does not spam requests
- selecting a result moves the map and marker correctly
- tap-to-pin updates address and coordinate correctly
- selected values are passed back to the previous screen correctly
- environment logs point to the intended backend when using a proxy

## Phase 10 — Completion Criteria

Do not consider the work done until all of these are true.

- Android and iOS configuration is explicit and environment-safe
- no tracked Google API keys remain in committed config files
- search is debounced and robust against stale responses
- marker, region, and address stay consistent
- permission-denied behavior is user-friendly
- loading and error states are visible
- the final selected address and coordinates are returned cleanly
- production path uses a defensible API key strategy

## Decision Points And Branches

Use these branches while working:

### If the map is blank or grey

- verify platform API key injection first
- verify Google provider setup second
- verify native rebuild happened after config changes
- only then inspect component code

### If search works but map centering is wrong

- inspect place details parsing
- confirm lat/lng are numeric and not strings
- confirm the marker state and region state are not fighting each other

### If reverse geocoding is flaky

- fall back from Google geocoding to `expo-location` only as a deliberate secondary strategy
- prevent older responses from overwriting a newer manual tap

### If the request is only for a quick prototype

- allow temporary client-side autocomplete
- still require debouncing, error handling, and key restriction
- document clearly that backend proxying is the follow-up production task

## Practical Notes For This Repo

- Reuse the existing logic in `MobileAppUI/app/login/PinLocation.tsx` before writing a new location picker from scratch.
- Align any frontend proxy usage with `backend/src/routes.ts` so the mobile app and backend do not drift.
- Keep environment behavior aligned with `docs/AWS_DEPLOYMENT.md`, especially the active backend URL for local, staging, and production runs.
- If you add native config for location or maps, require a fresh development build or EAS build as appropriate.

## Example Prompts

- `/google-maps-mobile-setup fix Expo Google Maps config for Android and iOS in this repo`
- `/google-maps-mobile-setup refactor PinLocation into hooks plus a reusable map picker component`
- `/google-maps-mobile-setup add secure Places autocomplete using backend proxy routes`
- `/google-maps-mobile-setup review why the map is blank on Android release builds`
- `/google-maps-mobile-setup build a distributor locator with live search and pin confirmation`