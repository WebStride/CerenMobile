import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

type GuestScreenProps = {
  /** null = loading, true = guest, false = logged in */
  isGuest: boolean | null;
  /** Page title shown in header */
  title: string;
  /** Icon name for the page (Ionicons) */
  icon: keyof typeof Ionicons.glyphMap;
  /** Message to show guest users */
  message?: string;
  /** Route to go back to (default: /shop) */
  backRoute?: string;
  /** Show back button in header */
  showBackButton?: boolean;
};

/**
 * Reusable guest/loading screen component for protected pages.
 * Returns null if user is logged in (isGuest === false).
 */
export default function GuestScreen({
  isGuest,
  title,
  icon,
  message = "Please login to access this feature.",
  backRoute = "/shop",
  showBackButton = true,
}: GuestScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // User is logged in - don't render anything
  if (isGuest === false) {
    return null;
  }

  const handleBack = () => {
    router.push(backRoute as any);
  };

  const handleLogin = () => {
    router.push("/login");
  };

  // Loading state
  if (isGuest === null) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        {/* Header */}
        <View 
          className="bg-white px-4 pb-4"
          style={{ paddingTop: insets.top + 16, position: 'absolute', top: 0, left: 0, right: 0 }}
        >
          <View className="flex-row items-center">
            {showBackButton && (
              <TouchableOpacity 
                onPress={handleBack}
                className="p-2 -ml-2"
              >
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
            )}
            <Text className="text-xl font-bold text-gray-900 flex-1 text-center mr-8">
              {title}
            </Text>
          </View>
        </View>
        
        {/* Loading indicator */}
        <View className="items-center">
          <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
            <Ionicons name={icon} size={40} color="#9CA3AF" />
          </View>
          <ActivityIndicator size="small" color="#9CA3AF" />
          <Text className="text-gray-500 mt-2">Loading...</Text>
        </View>
      </View>
    );
  }

  // Guest state
  return (
    <View className="flex-1 bg-gray-50 items-center justify-center px-6">
      {/* Header */}
      <View 
        className="bg-white px-4 pb-4"
        style={{ paddingTop: insets.top + 16, position: 'absolute', top: 0, left: 0, right: 0 }}
      >
        <View className="flex-row items-center">
          {showBackButton && (
            <TouchableOpacity 
              onPress={handleBack}
              className="p-2 -ml-2"
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          )}
          <Text className="text-xl font-bold text-gray-900 flex-1 text-center mr-8">
            {title}
          </Text>
        </View>
      </View>
      
      {/* Guest message */}
      <View className="items-center">
        <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
          <Ionicons name={icon} size={40} color="#9CA3AF" />
        </View>
        <Text className="text-lg font-semibold text-gray-900 mb-2">Login Required</Text>
        <Text className="text-gray-500 text-center mb-6">
          {message}
        </Text>
        <TouchableOpacity
          onPress={handleLogin}
          className="bg-[#BCD042] px-8 py-3 rounded-full"
        >
          <Text className="text-white font-semibold text-base">Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
