import { Stack } from "expo-router";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext"; // <-- Import your new CartProvider
import { FavouritesProvider } from "./context/FavouritesContext";

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
