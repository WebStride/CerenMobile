---
name: e2e-testing
description: 'End-to-end test patterns for React Native / Expo with Maestro (preferred) or Detox. Covers writing E2E test flows, running them against Android/iOS simulators, CI integration, and maintaining test reliability. Use when building critical user flows, regression testing, or preparing for store release.'
argument-hint: 'Which user flow needs E2E test coverage?'
origin: ECC
---

# End-to-End Testing — React Native / Expo

**Applies to:** Critical user flows in the CerenMobile app: auth, product browse, cart, orders, invoices.  
**Trigger:** When building a new screen flow, preparing for release, or setting up regression coverage.

> "E2E tests own the user journey. If the journey works, ship it. If it doesn't, nothing else matters."

---

## When to Activate

- New onboarding or authentication flow added
- Critical cart or order placement flow changed
- Release preparation (before EAS build submission)
- Regression testing after major refactor
- CI/CD pipeline setup for automated verification

---

## Recommended Tool: Maestro (Primary)

Maestro is the recommended E2E tool for Expo/React Native:
- No native setup required (unlike Detox)
- YAML-based test files — readable and maintainable
- Runs on both Android and iOS simulators/devices
- Works with Expo Go and custom dev client

```bash
# Install Maestro
curl -Ls "https://get.maestro.mobile.dev" | bash

# Verify installation
maestro --version
```

---

## Maestro Test Structure

### Directory
```
MobileAppUI/
  .maestro/
    flows/
      auth/
        login.yaml
        otp-verification.yaml
        logout.yaml
      products/
        browse-products.yaml
        search-product.yaml
        view-product-detail.yaml
      cart/
        add-to-cart.yaml
        update-quantity.yaml
        remove-from-cart.yaml
      orders/
        place-order.yaml
        view-order-history.yaml
      account/
        view-profile.yaml
```

### Maestro Test File Format

```yaml
# .maestro/flows/auth/login.yaml
appId: com.cerenmobile.app
name: Login Flow
---
- launchApp:
    clearState: true

- assertVisible: "Welcome to Ceren"

- tapOn: "Login"

- tapOn:
    id: "phone-input"
- inputText: "9876543210"

- tapOn: "Send OTP"

- assertVisible: "Enter OTP"

# In dev mode, OTP is 123456
- tapOn:
    id: "otp-input"
- inputText: "123456"

- tapOn: "Verify"

- assertVisible: "Home"
- assertNotVisible: "Login"
```

### Full Order Flow Example

```yaml
# .maestro/flows/orders/place-order.yaml
appId: com.cerenmobile.app
name: Place Order Flow
---
- launchApp

# Navigate to Products
- tapOn: "Products"
- assertVisible:
    text: "Products"

# Add product to cart
- tapOn:
    id: "product-list-item-0"
- tapOn:
    id: "add-to-cart-button"
- assertVisible: "Added to cart"

# Go to cart
- tapOn:
    id: "cart-tab"
- assertVisible: "Cart"
- assertVisible:
    id: "cart-item-0"

# Place order
- tapOn: "Place Order"
- assertVisible: "Order Confirmation"
- assertVisible:
    text: "Order placed successfully"
```

---

## Running Maestro Tests

```bash
# Start the app first (Expo dev client)
cd MobileAppUI && npx expo start --dev-client

# Run a single flow
maestro test .maestro/flows/auth/login.yaml

# Run all flows
maestro test .maestro/flows/

# Run with device selection
maestro test --device emulator-5554 .maestro/flows/

# Record test execution (for debugging)
maestro record .maestro/flows/auth/login.yaml
```

---

## Alternative: Detox (For Native-Heavy Scenarios)

Use Detox when you need native gesture simulation or custom native module testing:

```bash
# Install Detox
cd MobileAppUI && npm install --save-dev detox

# Initialize Detox config
npx detox init

# Build for testing (Android)
npx detox build --configuration android.emu.debug

# Run tests
npx detox test --configuration android.emu.debug
```

### Detox Test Example

```typescript
// MobileAppUI/e2e/login.test.ts
import { by, device, element, expect } from 'detox';

describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should navigate to home after successful login', async () => {
    await element(by.id('phone-input')).typeText('9876543210');
    await element(by.text('Send OTP')).tap();
    await expect(element(by.text('Enter OTP'))).toBeVisible();
    
    await element(by.id('otp-input')).typeText('123456');
    await element(by.text('Verify')).tap();
    
    await expect(element(by.text('Home'))).toBeVisible();
  });
});
```

---

## Test IDs — Required in All Interactive Components

Add `testID` props to every interactive element:

```tsx
// ✅ Correct — has testID
<TouchableOpacity testID="add-to-cart-button" onPress={handleAddToCart}>
  <Text>Add to Cart</Text>
</TouchableOpacity>

<TextInput testID="phone-input" ... />
<FlatList testID="product-list" ... />

// ❌ Wrong — no testID, untestable
<TouchableOpacity onPress={handleAddToCart}>
  <Text>Add to Cart</Text>
</TouchableOpacity>
```

---

## CI Integration (GitHub Actions)

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: cd MobileAppUI && npm ci
      
      - name: Install Maestro
        run: curl -Ls "https://get.maestro.mobile.dev" | bash
      
      - name: Start Android Emulator
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 33
          script: |
            cd MobileAppUI && npx expo start --dev-client &
            sleep 30
            maestro test .maestro/flows/
```

---

## Critical Flows — Must Have E2E Coverage

Priority order for coverage:
1. **Login / OTP verification** — Users can't use app without this
2. **Product browsing** — Core discovery flow
3. **Add to cart** — Revenue-critical action
4. **Place order** — Primary business transaction
5. **View orders/invoices** — Post-purchase user journey
6. **Logout** — Security requirement

---

## Verification Checklist

- [ ] `testID` added to all interactive elements in new screens
- [ ] Maestro/Detox flow written for every new critical user journey
- [ ] All E2E tests pass on Android emulator
- [ ] Tests pass on iOS simulator (if available)
- [ ] CI pipeline runs E2E tests on every PR to main
- [ ] Flaky tests fixed (no `sleep` calls — use `waitFor` assertions instead)
- [ ] Tests use dev-mode OTP bypass (`123456`) gated behind `NODE_ENV=development`
