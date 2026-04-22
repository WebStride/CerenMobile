import { Stack } from "expo-router";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext"; // <-- Import your new CartProvider
import { FavouritesProvider } from "./context/FavouritesContext";
import { ErrorBoundary } from "../components/ErrorBoundary";
import OfflineNotice from "../components/OfflineNotice";

// Runtime safety shim: wrap the global Response constructor to avoid a
// RangeError when some code (or a failed network request) produces a
// Response with an invalid status like 0. This is a temporary measure
// to unblock the app while the root cause is investigated.
// It coerces invalid status values into 500 and logs a warning.
try {
  // @ts-ignore
  const OriginalResponse = global.Response;
  if (OriginalResponse) {
    // Create a safe subclass that normalizes invalid status values
    // and preserves the original prototype/behavior.
    // @ts-ignore
    class SafeResponse extends OriginalResponse {
      constructor(body?: BodyInit | null, init?: ResponseInit) {
        if (init && typeof init.status === 'number' && (init.status === 0 || init.status < 100 || init.status > 599)) {
          console.warn('Shim: replacing invalid Response status', init.status, 'with 500');
          init = { ...init, status: 500 };
        }
        // @ts-ignore
        super(body, init);
      }
    }
    // @ts-ignore
    global.Response = SafeResponse;
  }
} catch (e) {
  // If anything goes wrong, don't block the app; just log.
  // eslint-disable-next-line no-console
  console.warn('Failed to apply Response shim', e);
}

// Global console.error interceptor to prevent Expo Dev Client's red error overlay
// from popping up indiscriminately when the device is offline.
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const isIgnoredError = args.some(arg => {
    if (!arg) return false;
    if (arg instanceof TypeError && arg.message === 'Network request failed') return true;
    if (arg.message && typeof arg.message === 'string') {
      const msg = arg.message.toLowerCase();
      if (msg.includes('network request failed') || msg.includes('network error') || msg.includes('invalid response from api') || msg.includes('failed to fetch')) return true;
    }
    if (typeof arg === 'string') {
      const str = arg.toLowerCase();
      if (str.includes('network request failed') || str.includes('network error') || str.includes('error fetching user addresses') || str.includes('error loading invoices') || str.includes('error fetching invoices') || str.includes('failed to fetch')) return true;
    }
    return false;
  });

  if (isIgnoredError) {
    // Only warn so we do not trigger the red Toast overlay
    console.warn("Suppressed offline API error to prevent dev toast:", ...args);
    return;
  }
  originalConsoleError(...args);
};

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <FavouritesProvider>
            <OfflineNotice />
            <Stack screenOptions={{ headerShown: false }} />
          </FavouritesProvider>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
