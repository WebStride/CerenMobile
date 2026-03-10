# iOS TestFlight Distribution Guide — Ceren Mobile App

This document describes the complete process to build the Ceren iOS app and distribute it to testers via Apple TestFlight.

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| Apple Developer Team | NATIVE ROOTS RETAIL PRIVATE LIMITED (ID: `64L9U96M2S`) |
| Apple ID (team member) | `pandaamitav01@gmail.com` |
| Bundle Identifier | `com.ceren.ceren` |
| Apple App ID (numeric) | `6758958090` |
| Expo Account | `cerencreatives` |
| EAS CLI | `npm install -g eas-cli` |
| Node.js | v18+ |

---

## One-Time Setup (do this only once)

### 1. Install EAS CLI

```bash
npm install -g eas-cli
```

### 2. Log in to Expo

```bash
eas login
# Use the Expo account created for the client: cerencreatives
```

### 3. Verify Bundle Identifier in app.json

Open `MobileAppUI/app.json` and confirm:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.ceren.ceren"
    }
  }
}
```

### 4. Verify the App ID is registered in Apple Developer

- Go to: https://developer.apple.com/account/resources/identifiers/list
- Confirm `com.ceren.ceren` exists under **Identifiers → App IDs**
- If it doesn't exist, click **+** and create it with:
  - Type: App IDs → App
  - Bundle ID: `com.ceren.ceren` (Explicit)

### 5. Create the App in App Store Connect (if not done)

- Go to: https://appstoreconnect.apple.com
- Click **My Apps → + → New App**
- Fill in:
  - Platform: iOS
  - Name: Ceren
  - Bundle ID: `com.ceren.ceren`
  - SKU: `ceren001` (or any unique identifier)
- Click **Create**

### 6. Clear any old credentials (if rebuilding fresh)

- Go to: https://expo.dev/accounts/cerencreatives/projects/mobileappui/credentials
- Click **iOS**
- Delete existing **Provisioning Profile** and **Distribution Certificate** if they show the old bundle id `com.amitavpanda.MobileAppUI`

---

## Building for TestFlight

Run the following command from the `MobileAppUI` directory:

```bash
cd MobileAppUI
eas build --platform ios --profile testflight
```

### During the build you will be prompted:

| Prompt | Answer |
|--------|--------|
| Log in to your Apple account? | Yes |
| Apple ID | `pandaamitav01@gmail.com` |
| Apple Team | NATIVE ROOTS RETAIL PRIVATE LIMITED (64L9U96M2S) |
| Manage credentials? | Let Expo handle the process |
| Register bundle identifier? | Yes |

EAS will:
1. Create a new Distribution Certificate
2. Create a new Provisioning Profile for `com.ceren.ceren`
3. Build the `.ipa`
4. Automatically upload to App Store Connect

Build takes approximately **10–15 minutes**.  
You can monitor the build at:  
https://expo.dev/accounts/cerencreatives/projects/mobileappui/builds

---

## Build Profiles in eas.json

| Profile | Distribution | Use Case |
|---------|-------------|----------|
| `development` | internal | Local dev with dev client |
| `preview` | internal | Ad-hoc testing (limited devices, UDID required) |
| `testflight` | store | TestFlight distribution ✅ Recommended |
| `production` | store | App Store submission |

---

## Distributing to Testers via TestFlight

### Internal Testers (team members — no Apple review needed)

1. Go to: https://appstoreconnect.apple.com → My Apps → Ceren → TestFlight
2. Under **Internal Testing** → click **+** next to testers
3. Add team member Apple IDs
4. The build is available to them immediately

### External Testers (outside the Apple team — requires Beta Review)

1. Go to: https://appstoreconnect.apple.com → My Apps → Ceren → TestFlight
2. Under **External Testing** → click **+** next to Groups
3. Create a group (e.g. "Beta Testers")
4. Add tester email addresses
5. Click **Add a Build** → select the latest build
6. Submit for **Beta App Review** (Apple usually approves within a few hours)
7. Once approved, testers receive an email invitation

### How Testers Install the App

1. Tester installs the **TestFlight** app from the App Store
2. Opens the invitation email → taps **View in TestFlight**
3. Taps **Install** → app installs on their iPhone

> No UDID registration. No `.ipa` file sharing. Works on any iPhone.

---

## Updating the Build for Testers

Every time you release an update:

```bash
cd MobileAppUI
eas build --platform ios --profile testflight
```

Testers will see an update notification inside the TestFlight app automatically.

---

## iOS vs Android Distribution Comparison

| | Android (APK) | iOS (TestFlight) |
|---|---|---|
| Share a file and install | ✅ Yes, any device | ❌ Not supported by Apple |
| Requires special app | ❌ No | ✅ TestFlight app |
| Unlimited testers | ✅ Yes | ✅ Up to 10,000 |
| No device registration | ✅ Yes | ✅ Yes (TestFlight only) |
| Install via link | ✅ Yes | ✅ Via TestFlight invitation |

---

## Troubleshooting

### "Bundle identifier mismatch" error
- Make sure `app.json` has `"bundleIdentifier": "com.ceren.ceren"`
- Delete old Expo credentials at https://expo.dev/accounts/cerencreatives/projects/mobileappui/credentials
- Rebuild using `eas build --platform ios --profile testflight`

### "Integrity cannot be verified" on device
- You are sideloading an `.ipa` that was built for a different profile/device
- Switch to TestFlight instead of sideloading

### Build still using old bundle ID
- Old credentials are cached — delete them from the Expo Dashboard (see One-Time Setup Step 6)
- Re-run `eas build --platform ios --profile testflight`

### TestFlight build not appearing in App Store Connect
- Wait a few minutes after the EAS build completes; Apple processes the upload
- Refresh the TestFlight tab in App Store Connect

---

## Key Links

| Resource | URL |
|----------|-----|
| Expo Build Dashboard | https://expo.dev/accounts/cerencreatives/projects/mobileappui/builds |
| Expo Credentials | https://expo.dev/accounts/cerencreatives/projects/mobileappui/credentials |
| App Store Connect | https://appstoreconnect.apple.com |
| Apple Developer Portal | https://developer.apple.com/account/resources/identifiers/list |
| TestFlight (for testers) | Install "TestFlight" from the App Store |
