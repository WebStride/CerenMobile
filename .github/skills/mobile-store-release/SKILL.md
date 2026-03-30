---
name: mobile-store-release
description: 'Universal mobile release and distribution workflow for Android and iOS. Use when preparing preview builds, internal/closed testing, TestFlight distribution, Play Store/App Store submissions, release checklists, versioning, signing, metadata prep, and rejection prevention across any mobile app project. Covers build strategy, signing, environment safety, Android testing tracks, iOS TestFlight, store review readiness, submission flow, and post-release verification.'
argument-hint: 'Which platform, stack, and release goal? (e.g. "Expo preview build for Android", "Flutter TestFlight release", "React Native app store submission checklist")'
---

# Mobile Store Release — Universal Build, Test, and Submission Workflow

**Applies to:** Any mobile app stack: React Native, Expo, Flutter, Ionic, Kotlin/Java Android, Swift/SwiftUI iOS, Xamarin, Capacitor

**Use this skill when:**
- generating preview builds for testers
- preparing Android internal, closed, or open testing releases
- preparing iOS TestFlight builds
- submitting to Google Play or Apple App Store
- preventing common review rejections
- verifying signing, versioning, metadata, privacy, and release safety

**Primary outcome:** a releasable mobile app build with the correct environment, signing, versioning, store metadata, tester distribution path, and review-readiness checks.

---

## Release Philosophy

This skill assumes a senior mobile release mindset:

- Release builds must be reproducible.
- Preview builds must point to the intended backend and use safe environment values.
- Test builds must be installable by non-developers.
- App Store and Play Store submissions must be reviewed for rejection risks before upload.
- Versioning, signing, privacy declarations, and tester instructions must be explicit.

If any of these are unclear, stop and resolve them before shipping.

---

## Phase 1 — Classify the Release Goal

**Goal:** Decide exactly what kind of build is needed before touching configuration.

Classify the request into one of these release types:

### 1. Preview Build

Use when QA, stakeholders, or internal teams need an installable build before store submission.

- Android: APK or AAB-backed internal testing distribution
- iOS: Ad Hoc, development build, or TestFlight depending on device/tester scope

### 2. Pre-Submission Build

Use when the app is close to store submission and needs production config, signing, versioning, and final validation.

### 3. Store Submission

Use when the build is ready and the remaining work is store metadata, compliance, rollout strategy, and review readiness.

### 4. Hotfix Release

Use when an already-published app needs a targeted fix with minimal risk.

**Decision checklist:**
- [ ] Is this for testers or for public release?
- [ ] Is the backend environment development, staging, or production?
- [ ] Does the build need native signing or just simulator/emulator validation?
- [ ] Is the app already published, or is this the first submission?

---

## Phase 2 — Collect Release Inputs

**Goal:** Gather every input that changes the build output.

Required inputs:

- Platform: Android, iOS, or both
- Stack: Expo, React Native CLI, Flutter, native Android, native iOS, Ionic, etc.
- Release type: preview, internal testing, closed testing, production release
- App identifiers:
  - Android application ID / package name
  - iOS bundle identifier
- Versioning:
  - marketing version / app version
  - build number / version code
- Environment:
  - development
  - staging
  - production
- Signing status:
  - Android keystore available?
  - iOS certificates and provisioning profiles available?
- Distribution target:
  - testers only
  - internal QA
  - closed beta
  - public store release

If any of the above is unknown, surface it immediately as a release blocker.

---

## Phase 3 — Environment and Config Safety

**Goal:** Prevent the most common release mistake: shipping the wrong backend, keys, or feature flags.

Review the following before every build:

- App environment file selection
- API base URL
- analytics keys
- push notification keys
- map keys
- payment keys
- feature flags
- debug logging
- dev-only auth bypasses
- staging banners or hidden tester affordances

**Checklist:**
- [ ] Release build points to the correct backend
- [ ] No debug credentials are embedded
- [ ] No OTP bypass or test accounts are enabled in production
- [ ] No verbose logging remains in critical production paths
- [ ] App name, bundle ID, and icons match the intended environment

**Branching guidance:**

### For preview builds
- Staging backend is usually correct
- Use a visible preview/test marker if the team benefits from it

### For production builds
- Use production backend and production API keys only
- Remove or disable preview-only indicators

---

## Phase 4 — Versioning and Release Identity

**Goal:** Ensure the stores accept the build and testers can identify it.

Validate:

- Android `versionCode` increases for every uploaded build
- Android `versionName` matches release intent
- iOS `CFBundleShortVersionString` matches the user-facing app version
- iOS `CFBundleVersion` increments for every uploaded build

Recommended versioning rule:

- User-facing version: semantic versioning or product-approved version string
- Build number: monotonically increasing integer for each platform upload

**Checklist:**
- [ ] Android build number is higher than the last uploaded build
- [ ] iOS build number is higher than the last uploaded build
- [ ] Release notes match the actual changes in the build

---

## Phase 5 — Signing and Build Preconditions

**Goal:** Confirm the project can produce installable builds before starting CI or cloud builds.

### Android

Check:
- Keystore exists and is accessible
- alias and passwords are available
- Play App Signing expectations are understood
- package name is final and consistent

### iOS

Check:
- Apple Developer account access is available
- correct team is selected
- certificates are valid
- provisioning is valid
- bundle identifier is registered
- required capabilities are enabled

**Checklist:**
- [ ] Android signing config works for release builds
- [ ] iOS signing works for archive/distribution builds
- [ ] No signing values are hardcoded insecurely in tracked files

---

## Phase 6 — Build Strategy by Stack

**Goal:** Pick the correct build path for the project’s stack.

### Expo / EAS

Use when the project is Expo-managed or EAS-driven.

Typical outputs:
- Android preview build
- Android production build
- iOS preview build
- iOS TestFlight-ready build

Typical concerns:
- `eas.json` profiles
- `app.json` or `app.config.*`
- environment variable injection
- native plugin configuration
- build profile mismatch between preview and production

### React Native CLI

Use when native Android and iOS projects are committed.

Typical outputs:
- Android signed APK/AAB via Gradle
- iOS archive via Xcode or CI

Typical concerns:
- Gradle signing config
- Xcode schemes/configurations
- Info.plist and build settings
- native dependency stability

### Flutter

Use when Flutter drives both platforms.

Typical outputs:
- Android APK/AAB
- iOS IPA / archive for TestFlight

Typical concerns:
- flavor configuration
- Dart define environment handling
- iOS signing in Xcode
- Android keystore wiring

### Native Android / Native iOS

Use the platform-native release flow directly.

---

## Phase 7 — Android Preview and Play Store Workflow

**Goal:** Produce the right Android artifact and distribute it through the correct channel.

### Android preview build options

Use one of these based on tester needs:

1. APK preview build
   - Best for direct install by QA or stakeholders
   - Good for quick manual distribution

2. Internal testing track
   - Best for Play-backed distribution with minimal review delay
   - Good for larger tester groups

3. Closed testing track
   - Best for organized beta cohorts
   - Better approximation of store delivery

### Android release checks

- [ ] release artifact builds successfully
- [ ] package name is correct
- [ ] app icon, label, and splash are correct
- [ ] permissions are justified and expected
- [ ] no debug menu is accessible
- [ ] deep links and auth flows work in release mode
- [ ] update path from previous build is valid

### Google Play rejection prevention

Check these before submission:

- privacy policy URL is live and relevant
- data safety form matches actual SDK/data behavior
- permissions are minimal and justified
- account deletion is provided if account creation exists and policy requires it
- screenshots match the current UI
- misleading metadata is removed
- billing/subscription behavior matches Play policy if applicable
- login-gated apps provide reviewer access instructions if needed

### Android rollout guidance

- Internal testing: use for QA and business review
- Closed testing: use before wide rollout
- Production staged rollout: use when the risk of regression is non-trivial

---

## Phase 8 — iOS Preview and TestFlight Workflow

**Goal:** Produce an iOS build suitable for tester distribution and App Store review.

### Default iOS testing path

For most real-device tester distribution, use **TestFlight**.

Use TestFlight when:
- testers are outside the developer machine/device list
- the team needs easy install/update flow
- the build should be close to App Store conditions

### iOS preview options

1. Development build
   - Best for engineers and limited internal testing

2. Ad Hoc distribution
   - Best for small known device sets
   - Less scalable than TestFlight

3. TestFlight
   - Best default for wider QA/business testing
   - Recommended for most iOS preview and pre-release testing

### iOS release checks

- [ ] bundle ID is correct
- [ ] build number is incremented
- [ ] archive succeeds in release mode
- [ ] signing and capabilities are valid
- [ ] push notifications, associated domains, maps, camera, location, and background modes are declared correctly
- [ ] required usage descriptions exist in Info.plist

### App Store rejection prevention

Review these carefully:

- missing or vague permission usage descriptions
- features described in metadata but missing in app
- placeholder text, empty screens, broken links, or unfinished UI
- crashing or blocked login flow
- mandatory sign-in without a valid reason
- subscription or purchase copy that is unclear or misleading
- missing account deletion path when accounts are created
- hidden features requiring special credentials without review notes

### TestFlight workflow checklist

- [ ] archive created successfully
- [ ] build uploaded to App Store Connect
- [ ] processing completed
- [ ] testers assigned or external review submitted
- [ ] tester notes include what changed and what to validate

---

## Phase 9 — Metadata, Privacy, and Review Notes

**Goal:** Ensure the store listing and compliance data are not the reason the release is blocked.

Prepare or verify:

- app title and subtitle
- short and full descriptions
- screenshots for supported devices
- feature graphic or promotional media if required
- privacy policy URL
- support URL
- marketing URL if needed
- content rating answers
- age rating answers
- data safety / privacy nutrition details
- demo credentials or review account instructions
- review notes for flows that require explanation

**Checklist:**
- [ ] metadata reflects the current build
- [ ] privacy disclosures match actual SDK and backend behavior
- [ ] screenshots are current and not stretched, cropped, or outdated
- [ ] reviewer instructions are present for gated functionality

---

## Phase 10 — Final Release Validation

**Goal:** Validate the exact artifact that testers or stores will receive.

Test in release mode, not only debug mode.

Minimum release validation:

- app launch
- onboarding
- sign-up / login
- logout / token refresh
- permissions flow
- navigation tabs and deep links
- network failure handling
- payment flow if applicable
- push notifications if applicable
- maps/location if applicable
- analytics/crash reporting startup
- upgrade path from prior released version if applicable

**Checklist:**
- [ ] release build tested on real device
- [ ] no blocker crash in first-run flow
- [ ] app works on slow network or offline failure conditions
- [ ] production-only services behave correctly in release mode

---

## Phase 11 — Submission and Rollout Decision Tree

**Goal:** Choose the safest submission path.

### If the build is only for internal validation
- Do not submit to production stores
- Use Android internal testing or iOS TestFlight

### If QA passed but risk is still medium
- Use closed testing on Android
- Use TestFlight external testers on iOS
- Delay production rollout until issues stabilize

### If risk is low and release confidence is high
- Submit to production review
- Use staged rollout if the app has a large active user base

### If this is a hotfix
- Minimize changes to the smallest safe patch
- Re-validate the exact broken flow and adjacent critical flows

---

## Phase 12 — Post-Release Verification

**Goal:** Confirm the shipped app behaves correctly after distribution.

After release or tester distribution:

- verify install/update success
- verify backend health and environment correctness
- monitor crash reports
- monitor API error rates
- verify login/signup success rate
- confirm push delivery if used
- confirm deep link routing if used

**Checklist:**
- [ ] build available to intended testers/users
- [ ] no immediate crash spike
- [ ] no wrong-backend incidents
- [ ] release notes and rollout status recorded

---

## Common Failure Patterns This Skill Is Designed to Prevent

- Shipping a release build pointed to staging
- Upload rejection because version/build numbers were not incremented
- Testers unable to install because the wrong artifact type was built
- iOS review rejection due to missing permission descriptions
- App Store rejection because the reviewer cannot access gated features
- Play Store rejection due to inaccurate data safety declarations
- Release crashes because only debug builds were tested
- Using TestFlight too late and discovering signing/App Store Connect issues at the end

---

## Completion Standard

This skill is complete only when all of the following are true:

- [ ] Correct platform release path selected
- [ ] Environment and signing verified
- [ ] Versioning updated correctly
- [ ] Preview or release artifact built successfully
- [ ] Store metadata and privacy declarations reviewed
- [ ] Rejection-risk checklist completed
- [ ] Real-device release validation completed
- [ ] Distribution path executed: APK, internal testing, closed testing, TestFlight, or store submission

---

## Example Prompts

- `Use mobile-store-release for an Expo Android preview build for QA.`
- `Use mobile-store-release to prepare an iOS TestFlight build for external testers.`
- `Use mobile-store-release to review a Flutter app before Play Store submission.`
- `Use mobile-store-release for a React Native hotfix release to App Store and Play Store.`
- `Use mobile-store-release to check why this mobile app may get rejected by Apple review.`

---

## Tooling-Specific Notes

This skill is intentionally tooling-agnostic so it can work in any mobile app project.

When applying it:

- Expo/EAS projects should map phases to `eas.json`, app config, credentials, and build profiles.
- React Native CLI projects should map phases to Gradle/Xcode signing and native config.
- Flutter projects should map phases to flavors, Dart defines, Gradle, and Xcode archive steps.
- Teams using Fastlane or CI/CD should layer automation on top of this workflow, not replace the checks.