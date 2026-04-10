---
name: mobile-engineer
description: Universal mobile engineering skill covering React Native, native iOS/Android integration, performance, offline support, and app store deployment. Works across Expo and bare React Native workflows.
applyTo: ["**/*.tsx", "**/*.jsx", "**/*.ts", "**/*.js", "**/*.swift", "**/*.kt"]
teamRole: Engineering
relatedSkills:
  - frontend-engineer
  - frontend-performance
  - accessibility-design
  - backend-engineer
  - frontend-testing
expertise:
  - react-native
  - native-modules
  - offline-first
  - push-notifications
  - app-store-submission
  - mobile-performance
  - deep-linking
---

# Mobile Engineer Skill

## Role Overview
The mobile engineer builds and maintains native and cross-platform mobile applications. Responsible for smooth 60fps UI, battery efficiency, offline capability, OS-specific integrations, and successful app store submissions.

> **Context7 MCP**: Query Context7 for the latest React Native, Expo, or native platform APIs before implementation — APIs shift frequently across versions.

---

## Core Responsibilities
- Build performant, accessible mobile UI components
- Integrate with device hardware (camera, GPS, biometrics, notifications)
- Implement offline-first data patterns
- Handle deep linking and navigation
- Optimize startup time, bundle size, and memory usage
- Submit to App Store and Google Play
- Implement OTA updates where applicable (Expo EAS Updates)

---

## Architecture Patterns

### Folder Structure
```
src/
  screens/        ← full-screen views
  components/     ← reusable UI components
  navigation/     ← stack, tab, drawer setup
  hooks/          ← custom hooks (data, device)
  services/       ← API clients, native bridges
  store/          ← global state (Zustand/Redux)
  utils/
  constants/
```

### Navigation (React Navigation)
```typescript
// Root navigator pattern
const Stack = createNativeStackNavigator<RootStackParamList>();
export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Detail" component={DetailScreen} />
    </Stack.Navigator>
  );
}

// Always type your navigation params
type RootStackParamList = {
  Home: undefined;
  Detail: { id: string };
};
```

---

## Performance

### JS Thread vs UI Thread
The JS thread runs your React code. Heavy computation here causes frame drops.
- **Fix**: Use `InteractionManager.runAfterInteractions()` for post-navigation work
- **Fix**: Use `useMemo` and `useCallback` to prevent re-renders in list items
- **Fix**: Move animations to the UI thread using `react-native-reanimated`

### FlatList Optimization
```typescript
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={renderItem}
  getItemLayout={(_, index) => ({  // For fixed-height items
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={21}
/>
```

### Image Optimization
- Use `react-native-fast-image` over built-in `Image` for caching and priority loading
- Always specify `width` and `height` — avoid layout thrash
- Use WebP format where OS supports it

### Bundle Size
- Use `metro-bundle-analyzer` to find large dependencies
- Tree-shake imports: `import { format } from 'date-fns'` not `import * as dateFns`
- Lazy-load heavy screens with `React.lazy` + Suspense (Expo SDK 50+)

---

## Offline Support

### Strategy
```
User Action
  → Check network status (NetInfo)
  → If online: API request → cache response locally
  → If offline: serve from local cache → queue action for sync
```

### Offline Queue Pattern
```typescript
// Queue writes when offline, sync when reconnected
async function queueWrite(action: QueuedAction) {
  await storage.push('offline_queue', action);
}

async function syncQueue() {
  const queue = await storage.getAll('offline_queue');
  for (const action of queue) {
    await executeAction(action);
  }
  await storage.clear('offline_queue');
}
```

---

## Device Integrations

### Push Notifications
```typescript
// Expo Notifications
const { status } = await Notifications.requestPermissionsAsync();
if (status !== 'granted') return;
const token = await Notifications.getExpoPushTokenAsync();
// Send token to backend for storage
```

### Biometric Auth
```typescript
import * as LocalAuthentication from 'expo-local-authentication';
const result = await LocalAuthentication.authenticateAsync({
  promptMessage: 'Confirm your identity',
  fallbackLabel: 'Use passcode',
});
if (result.success) { /* proceed */ }
```

### Deep Linking
```typescript
// app.json (Expo)
{
  "expo": {
    "scheme": "myapp",
    "ios": { "associatedDomains": ["applinks:yourdomain.com"] },
    "android": { "intentFilters": [{ "action": "VIEW", "data": [{ "scheme": "https", "host": "yourdomain.com" }] }] }
  }
}
```

---

## Security

- Never store sensitive data in `AsyncStorage` — use `expo-secure-store` (Keychain/Keystore)
- Certificate pinning for high-security apps
- Obfuscate JS bundle for production (`metro` + Hermes)
- Validate all deep link parameters — treat them as untrusted input
- Use biometric auth as second factor, not sole authentication

---

## App Store Submission

### Checklist
- [ ] App icon at all required resolutions
- [ ] Splash screen configured
- [ ] Privacy manifest (iOS 17+) if using required APIs
- [ ] Permissions strings in Info.plist / AndroidManifest.xml (with justification)
- [ ] Tested on physical device (not just simulator)
- [ ] Tested on minimum supported OS version
- [ ] No API calls on main thread (iOS will reject)
- [ ] Accessibility labels on all interactive elements
- [ ] App reviewed against store guidelines

---

## Testing

### Unit Tests
Test navigation logic, hooks, and utility functions with Jest.

### Component Tests
Use `@testing-library/react-native`:
```typescript
it('renders submit button', () => {
  const { getByRole } = render(<CheckoutScreen />);
  expect(getByRole('button', { name: /submit/i })).toBeTruthy();
});
```

### E2E Tests
Use Detox or Maestro for full device automation:
```yaml
# Maestro flow
- launchApp
- tapOn: "Login"
- inputText: "user@example.com"
- tapOn: "Submit"
- assertVisible: "Welcome"
```

---

## Collaboration Patterns

| Partner | When |
|---------|------|
| **frontend-engineer** | Sharing component patterns, state management patterns |
| **backend-engineer** | API design for mobile-specific needs (pagination, offline sync) |
| **ux-design** | Platform-specific UX patterns (iOS vs Android conventions) |
| **accessibility-design** | Accessible touch targets, screen reader flows |
| **devops-engineer** | EAS Build/Submit pipelines, OTA update pipelines |

---

## Anti-Patterns
- Calling heavy synchronous functions on the JS thread during animations
- Using `AsyncStorage` for sensitive credentials
- Not handling network errors and showing blank screens
- Ignoring platform differences (iOS vs Android navigation gestures)
- Not testing on physical devices before release
- Missing permission justifications in store metadata

---

## Pre-Handoff Checklist
- [ ] Tested on iOS and Android physical devices
- [ ] No performance regressions (FPS stays ≥ 60 during scroll)
- [ ] Offline states handled (no blank/broken UI)
- [ ] Push notification tokens captured and stored
- [ ] Deep links tested with both cold and warm app start
- [ ] Accessibility labels set on all interactive elements
- [ ] Store submission assets ready (icons, screenshots, metadata)
