import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { images } from "@/constants/images";
import { register } from "@/services/api";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";

export default function LoginNameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const phoneNumber = params.phoneNumber as string;
  
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const isButtonDisabled = name.trim().length === 0;

  const handleNext = async () => {
    try {
      setLoading(true);
      const response = await register(phoneNumber, name);
      
      if (response.success) {
        Alert.alert("Success", "OTP has been sent successfully to your phone number.", [
          { 
            text: "OK", 
            onPress: () => router.push({ 
              pathname: "/login/otp", 
              params: { phoneNumber, name } 
            }) 
          }
        ]);
      } else {
        Alert.alert("Error", response.message || "Failed to send OTP. Please try again.");
      }
    } catch (error) {
      console.error("Error in registration:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingAnimatedView style={{ flex: 1, backgroundColor: "#FFFFFF" }} behavior="padding">
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
              Enter your name
            </Text>

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
                  autoFocus
                />
              </View>
            </View>
          </View>

          {/* Next Button */}
          <View className="items-end pb-10 px-6">
            <TouchableOpacity
              className={`w-14 h-14 rounded-full bg-[#BCD042] items-center justify-center shadow-md ${isButtonDisabled || loading ? "opacity-50" : ""}`}
              disabled={isButtonDisabled || loading}
              onPress={handleNext}
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
