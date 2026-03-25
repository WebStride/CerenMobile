import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs, usePathname, useRouter } from "expo-router";
import { useEffect, useState } from 'react';
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const [hasSelectedStore, setHasSelectedStore] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    const syncSelectedStore = async () => {
      const selectedStoreId = await AsyncStorage.getItem('selectedStoreId');
      const storeSelected = Boolean(selectedStoreId);

      if (!isMounted) {
        return;
      }

      setHasSelectedStore(storeSelected);

      if (!storeSelected && pathname === '/(tabs)/invoices') {
        router.replace('/(tabs)/shop');
      }
    };

    syncSelectedStore();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  if (hasSelectedStore === null) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0A8F08",
        tabBarInactiveTintColor: "#222",
        tabBarLabelStyle: { fontSize: 12 },
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 60 + insets.bottom, // Adjust height dynamically
          paddingBottom: insets.bottom, // Use only insets for bottom
          paddingTop: 10,
          elevation: 8, // Add shadow for Android
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
      }}
    >
      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          href: hasSelectedStore ? '/(tabs)/invoices' : null,
          title: "Invoices",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}