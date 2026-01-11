import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { images } from "@/constants/images";
import { useLocalSearchParams,  } from "expo-router";
import { useAuth } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { verify, sendOtp, register } from "@/services/api";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";


export default function VerificationScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { confirmation } = useAuth();



  const isButtonDisabled = code.length < 4;

    const handleVerifyOTP = async () => {
      try {
        setLoading(true);
        const fullPhoneNumber = params.phoneNumber as string; // Ensure phoneNumber is a string
        const name = params.name as string; // Ensure name is a string
        console.log("Verifying OTP for:", fullPhoneNumber, "with code:", code, "and name:", name);
        const response = await verify(fullPhoneNumber, code, name);
        console.log("📡 Verification response:", response);
        console.log("👤 User data in response:", response.user);
        if (response.success) {
          console.log("Verification successful:", response);
          if (response.accessToken) {
            await AsyncStorage.setItem("accessToken", response.accessToken);
          } else {
            console.warn("accessToken is undefined");
          }

          if (response.refreshToken) {
            await AsyncStorage.setItem("refreshToken", response.refreshToken);
          } else {
            console.warn("refreshToken is undefined");
          }

          // Store user data for later use
          if (response.user) {
            console.log("💾 Storing user data in AsyncStorage:", response.user);
            await AsyncStorage.setItem("userData", JSON.stringify(response.user));
            // Also store customerId for API calls
            if (response.user.id) {
              await AsyncStorage.setItem("customerId", String(response.user.id));
            }
            console.log("✅ User data stored successfully");

            // Verify it was stored correctly
            const storedData = await AsyncStorage.getItem("userData");
            console.log("🔍 Verification - stored data:", storedData ? JSON.parse(storedData) : "Failed to store");
          } else {
            console.log("❌ No user data in response to store");
          }

          // If name param is present it means this was a new user flow
          // and we should continue to SelectLocation to collect address.
          // If no name param (existing user), skip address screens and go to home.
          const isNewUserFlow = !!params.name;
          if (isNewUserFlow) {
            // New user: continue to SelectLocation (address flow -> AddAddressDetails -> SelectStore)
            router.push({
              pathname: "/login/SelectLocation",
              params: { phoneNumber: fullPhoneNumber, name },
            });
          } else {
            // Existing user - route to SelectStore so user can pick store before entering app
            router.push({
              pathname: "/login/SelectStore",
              params: { phoneNumber: fullPhoneNumber, name },
            });
          }
        } else {
          Alert.alert("Error", response.message || "Failed to verify OTP. Please try again.");
        }
      } catch (error) {
        console.error("Error verifying OTP:", error);
        Alert.alert("Error", "An unexpected error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    };

  const handleResendOTP = async () => {
    try {
      setResending(true);
      const fullPhoneNumber = params.phoneNumber as string;
      const name = params.name as string;
      
      // If name param exists, this was a new user registration flow
      // Otherwise it's an existing user login
      let response;
      if (name) {
        // New user - call register again
        response = await register(fullPhoneNumber, name);
      } else {
        // Existing user - call sendOtp
        response = await sendOtp(fullPhoneNumber);
      }
      
      if (response.success) {
        Alert.alert("Success", "OTP has been resent successfully to your phone number.");
        setCode(""); // Clear the OTP input field
      } else {
        Alert.alert("Error", response.message || "Failed to resend OTP. Please try again.");
      }
    } catch (error) {
      console.error("Error resending OTP:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingAnimatedView style={{ flex: 1, backgroundColor : "#FFFFFF" }} behavior="padding">

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1">
          {/* Top background and back arrow */}
          <View className="relative">
            <Image
              source={images.LoginScreenTop}
              className="w-full h-40"
              resizeMode="cover"
            />
            <TouchableOpacity
              style={{
                position: "absolute",
                top: 60,
                left: 18,
                width: 10,
                height: 18,
                justifyContent: "center",
                alignItems: "center",
                zIndex: 10,
              }}
              onPress={() => router.back()}
              accessibilityLabel="Back"
            >
              <Image
                source={images.TopLeftArrow}
                style={{ width: 10, height: 18 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
          {/* Form Section */}
          <View className="flex-1 px-6 pt-6">
            <Text
              style={{
                fontFamily: "Open Sans",
                fontWeight: "600",
                fontSize: 26,
                color: "#181725",
                width: 332,
                height: 29,
              }}
              className="mb-8"
            >
              Enter your 4-digit code
            </Text>
            {/* Code Field */}
            <View className="mb-6">
              <Text
                style={{
                  fontFamily: "Open Sans",
                  fontWeight: "600",
                  fontSize: 16,
                  color: "#7C7C7C",
                  width: 121,
                  height: 29,
                }}
                className="mb-2"
              >
                Code
              </Text>
              <View className="border-b border-[#EAEAEA] pb-2">
                <TextInput
                  className="text-base text-[#24262B] tracking-widest"
                  placeholder="- - - -"
                  placeholderTextColor="#8F959E"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={code}
                  onChangeText={setCode}
                  returnKeyType="done"
                  secureTextEntry={false}
                  textContentType="oneTimeCode"
                />
              </View>
            </View>
            {/* Resend Code */}
            <TouchableOpacity
              style={{
                width: 113,
                height: 29,
                justifyContent: "center",
                alignItems: "flex-start",
                marginBottom: 20,
                opacity: resending ? 0.5 : 1,
              }}
              onPress={handleResendOTP}
              disabled={resending}
              accessibilityLabel="Resend Code"
            >
              <Text
                style={{
                  color: "#53B175",
                  fontFamily: "Open Sans",
                  fontWeight: "600",
                  fontSize: 16,
                }}
              >
                {resending ? "Sending..." : "Resend Code"}
              </Text>
            </TouchableOpacity>
          </View>
          {/* Next Button (at the bottom, not inside inputs) */}
          <View className="items-end pb-10 px-6">
            <TouchableOpacity
              className={`w-14 h-14 rounded-full bg-[#BCD042] items-center justify-center shadow-md ${isButtonDisabled ? "opacity-50" : ""}`}
              disabled={isButtonDisabled}
              onPress={handleVerifyOTP} 
              accessibilityLabel="Next"
            >
              <Image source={images.RightArrow} className="w-6 h-6" resizeMode="contain" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingAnimatedView>
  );
}