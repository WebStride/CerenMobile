import React from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AboutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleEmailPress = () => {
    Linking.openURL("mailto:info@nativeroot.in");
  };

  const handlePhonePress = () => {
    Linking.openURL("tel:+919606998203");
  };

  const handleWhatsAppPress = () => {
    Linking.openURL("https://wa.me/919606998203");
  };

  const handleMapPress = () => {
    const address = "No.53, Kaveri Layout, Hebbal, Kempapura, Bangalore North, Bangalore - 560024, Karnataka";
    const encodedAddress = encodeURIComponent(address);
    Linking.openURL(`https://maps.google.com/?q=${encodedAddress}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 -ml-2"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 ml-2">About Us</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Company Logo/Brand Section */}
        <View className="bg-[#1a1a1a] px-6 py-8 items-center">
          <View className="w-20 h-20 bg-green-600 rounded-full items-center justify-center mb-4">
            <Ionicons name="leaf" size={40} color="white" />
          </View>
          <Text className="text-2xl font-bold text-white text-center">
            NATIVE ROOTS RETAIL
          </Text>
          <Text className="text-lg text-white text-center">
            PRIVATE LIMITED
          </Text>
        </View>

        {/* Contact Information */}
        <View className="bg-white mt-4 mx-4 rounded-2xl overflow-hidden shadow-sm">
          {/* Email */}
          <TouchableOpacity
            onPress={handleEmailPress}
            className="flex-row items-center px-5 py-4 border-b border-gray-100"
            activeOpacity={0.7}
          >
            <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center">
              <Ionicons name="mail" size={24} color="#16a34a" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-sm text-gray-500 mb-1">Email</Text>
              <Text className="text-base font-medium text-gray-900">
                info@nativeroot.in
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Phone */}
          <TouchableOpacity
            onPress={handlePhonePress}
            className="flex-row items-center px-5 py-4 border-b border-gray-100"
            activeOpacity={0.7}
          >
            <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center">
              <Ionicons name="call" size={24} color="#16a34a" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-sm text-gray-500 mb-1">Contact</Text>
              <Text className="text-base font-medium text-gray-900">
                +91 9606998203
              </Text>
              <Text className="text-xs text-gray-400 mt-0.5">10AM to 5PM</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* WhatsApp */}
          <TouchableOpacity
            onPress={handleWhatsAppPress}
            className="flex-row items-center px-5 py-4"
            activeOpacity={0.7}
          >
            <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center">
              <Ionicons name="logo-whatsapp" size={24} color="#16a34a" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-sm text-gray-500 mb-1">WhatsApp</Text>
              <Text className="text-base font-medium text-gray-900">
                +91 9606998203
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Address */}
        <View className="bg-white mt-4 mx-4 rounded-2xl overflow-hidden shadow-sm">
          <TouchableOpacity
            onPress={handleMapPress}
            className="flex-row px-5 py-4"
            activeOpacity={0.7}
          >
            <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center">
              <Ionicons name="location" size={24} color="#16a34a" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-sm text-gray-500 mb-1">Address</Text>
              <Text className="text-base font-medium text-gray-900 leading-6">
                No.53, Kaveri Layout, Hebbal, Kempapura
              </Text>
              <Text className="text-sm text-gray-600 leading-5 mt-1">
                Hebbal Kempapura, Bangalore North
              </Text>
              <Text className="text-sm text-gray-600 leading-5">
                Bangalore - 560024, Karnataka
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={{ marginTop: 12 }} />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View className="mt-8 items-center px-6">
          <Text className="text-gray-400 text-sm">Version 1.0.0</Text>
          <Text className="text-gray-400 text-xs mt-2 text-center">
            © 2025 Native Roots Retail Private Limited
          </Text>
          <Text className="text-gray-400 text-xs mt-1 text-center">
            All rights reserved
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
