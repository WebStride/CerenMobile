import { Stack } from "expo-router";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext"; // <-- Import your new CartProvider
import { FavouritesProvider } from "./context/FavouritesContext";

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

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <FavouritesProvider> {/* Add this wrapper */}
          <Stack screenOptions={{ headerShown: false }} />
        </FavouritesProvider>
      </CartProvider>
    </AuthProvider>
  );
}
