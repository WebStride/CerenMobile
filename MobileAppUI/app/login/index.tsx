import { useState, useRef } from "react";
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
import { useRouter, } from "expo-router";
import { images } from "@/constants/images";
import { register } from "@/services/api";

import { useAuth } from "../context/AuthContext";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";


const countryData = {
  code: "+91",
  flag: images.IndianFlag,
};

export default function LoginNumberScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const recaptchaVerifier = useRef(null);

  const isButtonDisabled = phoneNumber.length < 10;

const { setConfirmation } = useAuth();


  const handleSendOTP = async () => {
    try {
      setLoading(true);
      const fullPhoneNumber = `${countryData.code}${phoneNumber}`; // Add country code
      const response = await register(fullPhoneNumber, name);
      if (response.success) {
        Alert.alert(
          "Success",
          "OTP has been sent successfully to your phone number.",
          [
            {
              text: "OK",
              onPress: () => router.push({
                pathname: "/login/otp",
                params: { phoneNumber: fullPhoneNumber, name },
              }),
            },
          ]
        );
      } else {
        Alert.alert("Error", response.message || "Failed to send OTP. Please try again.");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
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
              onPress={() => router.push("/OnboardingScreen")}
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
              Enter your mobile number
            </Text>
            {/* Mobile Number Field */}
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
                Mobile Number
              </Text>
              <View className="flex-row items-center border-b border-[#EAEAEA] pb-2">
                <Image source={countryData.flag} className="w-6 h-6 mr-2" resizeMode="contain" />
                <Text className="text-base text-[#24262B] tracking-widest mr-2">{countryData.code}</Text>
                <TextInput
                  className="flex-1 text-base text-[#24262B] tracking-widest"
                  placeholder="Enter number"
                  placeholderTextColor="#8F959E"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  returnKeyType="done"
                />
              </View>
            </View>
            {/* Name Field */}
            <View className="mb-10">
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
                Name
              </Text>
              <View className="border-b border-[#EAEAEA] pb-2">
                <TextInput
                  className="text-base text-[#24262B]"
                  placeholder="Enter your name"
                  placeholderTextColor="#8F959E"
                  value={name}
                  onChangeText={setName}
                  returnKeyType="done"
                />
              </View>
            </View>
          </View>
          {/* Next Button (at the bottom, not inside inputs) */}
          <View className="items-end pb-10 px-6">
            <TouchableOpacity
              className={`w-14 h-14 rounded-full bg-[#BCD042] items-center justify-center shadow-md ${isButtonDisabled ? "opacity-50" : ""}`}
              disabled={isButtonDisabled}
              onPress={handleSendOTP}
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