import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { sendPriceRequestWhatsApp } from "@/services/api";

interface PriceRequestModalProps {
  visible: boolean;
  onClose: () => void;
  productId: number;
  productName: string;
}

export const PriceRequestModal: React.FC<PriceRequestModalProps> = ({
  visible,
  onClose,
  productId,
  productName,
}) => {
  const [storeName, setStoreName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);

  // Load user data when modal opens
  useEffect(() => {
    if (visible) {
      loadUserData();
    }
  }, [visible]);

  const loadUserData = async () => {
    setIsLoadingUserData(true);
    try {
      // Try to get store name
      const selectedStoreName = await AsyncStorage.getItem("selectedStoreName");
      if (selectedStoreName) {
        setStoreName(selectedStoreName);
      }

      // Try to get phone from userData
      const userDataStr = await AsyncStorage.getItem("userData");
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        if (userData.phoneNumber) {
          setPhone(userData.phoneNumber);
        }
      }
    } catch (error) {
      console.error("Error loading user data for price request:", error);
    } finally {
      setIsLoadingUserData(false);
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!storeName.trim()) {
      Alert.alert("Required", "Please enter your store name");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Required", "Please enter your phone number");
      return;
    }

    setIsLoading(true);
    try {
      const currentDateTime = new Date().toISOString().split("T")[0] + " " + 
        new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

      const result = await sendPriceRequestWhatsApp({
        storeName: storeName.trim(),
        phone: phone.trim(),
        productId: String(productId),
        productName: productName,
        dateTime: currentDateTime,
        note: note.trim() || "No additional notes",
      });

      if (result.success) {
        Alert.alert(
          "Request Sent! ✅",
          "Your price request has been submitted successfully. Our team will contact you shortly.",
          [{ text: "OK", onPress: onClose }]
        );
        // Reset form
        setNote("");
      } else {
        Alert.alert(
          "Error",
          result.message || "Failed to send request. Please try again."
        );
      }
    } catch (error) {
      console.error("Error sending price request:", error);
      Alert.alert("Error", "Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNote("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[85%]">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold text-gray-900">
                Request Price
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <Ionicons name="close" size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Product Info Card */}
              <View className="bg-green-50 rounded-xl p-4 mb-6 border border-green-100">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="cube-outline" size={20} color="#15803d" />
                  <Text className="text-green-800 font-semibold ml-2">
                    Product Details
                  </Text>
                </View>
                <Text className="text-gray-700 font-medium">{productName}</Text>
                <Text className="text-gray-500 text-sm">ID: {productId}</Text>
              </View>

              {isLoadingUserData ? (
                <View className="py-8 items-center">
                  <ActivityIndicator size="small" color="#15803d" />
                  <Text className="text-gray-500 mt-2">Loading your info...</Text>
                </View>
              ) : (
                <>
                  {/* Store Name Input */}
                  <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-2">
                      Store Name <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
                      placeholder="Enter your store name"
                      placeholderTextColor="#9CA3AF"
                      value={storeName}
                      onChangeText={setStoreName}
                      editable={!isLoading}
                    />
                  </View>

                  {/* Phone Input */}
                  <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-2">
                      Phone Number <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
                      placeholder="Enter your phone number"
                      placeholderTextColor="#9CA3AF"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      editable={!isLoading}
                    />
                  </View>

                  {/* Note Input */}
                  <View className="mb-6">
                    <Text className="text-gray-700 font-medium mb-2">
                      Additional Notes (Optional)
                    </Text>
                    <TextInput
                      className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
                      placeholder="Any specific requirements..."
                      placeholderTextColor="#9CA3AF"
                      value={note}
                      onChangeText={setNote}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      style={{ minHeight: 80 }}
                      editable={!isLoading}
                    />
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    className={`rounded-xl py-4 items-center justify-center flex-row ${
                      isLoading ? "bg-gray-400" : "bg-green-700"
                    }`}
                    onPress={handleSubmit}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    {isLoading ? (
                      <>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text className="text-white font-semibold text-base ml-2">
                          Sending...
                        </Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="send" size={18} color="#fff" />
                        <Text className="text-white font-semibold text-base ml-2">
                          Send Request
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Info Text */}
                  <Text className="text-gray-500 text-xs text-center mt-4">
                    Our team will reach out to you via WhatsApp with pricing details.
                  </Text>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default PriceRequestModal;
