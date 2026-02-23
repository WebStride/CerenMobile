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
import { useRouter } from "expo-router";
import { images } from "@/constants/images";
import { checkCustomer, sendOtp } from "@/services/api";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import { setGuestSession } from "@/utils/session";


const countryData = {
  code: "+91",
  flag: images.IndianFlag,
};

export default function LoginNumberScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const isButtonDisabled = phoneNumber.length < 10;

  const handleSkipLogin = async () => {
    await setGuestSession();
    router.replace("/(tabs)/shop");
  };


  const handleNext = async () => {
    try {
      setLoading(true);
      const fullPhoneNumber = `${countryData.code}${phoneNumber}`;
      
      // Check customer existence if not already checked
      let userExists = isExistingUser;
      if (userExists === null) {
        console.log('[LoginNumberScreen] Checking customer existence before proceeding...');
        const resp = await checkCustomer(fullPhoneNumber);
        console.log('[LoginNumberScreen] checkCustomer response:', resp);
        userExists = resp.success && resp.exists;
        setIsExistingUser(userExists);
      }
      
      if (userExists) {
        // Existing user: send OTP and go directly to OTP screen
        const resp = await sendOtp(fullPhoneNumber);
        if (resp.success) {
          Alert.alert("Success", "OTP has been sent successfully to your phone number.", [
            { text: "OK", onPress: () => router.push({ pathname: "/login/otp", params: { phoneNumber: fullPhoneNumber } }) }
          ]);
        } else {
          Alert.alert("Error", resp.message || "Failed to send OTP. Please try again.");
        }
      } else {
        // New user: go to name screen
        router.push({ pathname: "/login/name", params: { phoneNumber: fullPhoneNumber } });
      }
    } catch (error) {
      console.error("Error in handleNext:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneBlur = async () => {
    try {
      if (phoneNumber.length < 10) return;
      const fullPhoneNumber = `${countryData.code}${phoneNumber}`;
      console.log('[LoginNumberScreen] Starting checkCustomer for:', fullPhoneNumber);
      const resp = await checkCustomer(fullPhoneNumber);
      console.log('[LoginNumberScreen] checkCustomer response:', resp);
      
      if (resp.success && resp.exists) {
        console.log('[LoginNumberScreen] User exists - will skip name screen');
        setIsExistingUser(true);
      } else {
        console.log('[LoginNumberScreen] New user - will show name screen');
        setIsExistingUser(false);
      }
    } catch (err) {
      console.warn('check customer failed', err);
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

            <View className="flex-row justify-end mb-3">
              <TouchableOpacity
                onPress={handleSkipLogin}
                accessibilityLabel="Skip Login"
                style={{
                  borderWidth: 1,
                  borderColor: "#BCD042",
                  borderRadius: 999,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                }}
              >
                <Text style={{ color: "#6A8D00", fontWeight: "600", fontSize: 13 }}>Skip Login</Text>
              </TouchableOpacity>
            </View>

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
                  onBlur={handlePhoneBlur}
                  returnKeyType="done"
                />
              </View>
            </View>
          </View>
          {/* Next Button (at the bottom, not inside inputs) */}
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