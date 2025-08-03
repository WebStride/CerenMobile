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
import { verify } from "@/services/api";


export default function VerificationScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const { confirmation } = useAuth();



  const isButtonDisabled = code.length < 4;

    const handleVerifyOTP = async () => {
      try {
        setLoading(true);
        const fullPhoneNumber = params.phoneNumber as string; // Ensure phoneNumber is a string
        const name = params.name as string; // Ensure name is a string
        console.log("Verifying OTP for:", fullPhoneNumber, "with code:", code, "and name:", name);
        const response = await verify(fullPhoneNumber, code, name);
        console.log("Verification response:", response);
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
          router.push({
                pathname: "/login/SelectLocation",
                params: { phoneNumber: fullPhoneNumber, name },
              })
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

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
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
              }}
              onPress={() => {
                // Add resend logic here
              }}
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
                Resend Code
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
    </KeyboardAvoidingView>
  );
}