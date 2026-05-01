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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { images } from "@/constants/images";
import { checkCustomer, sendOtp } from "@/services/api";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import { setGuestSession } from "@/utils/session";
import { goBackOrFallback, resetToRoute } from "@/utils/navigation";
import {
  sanitizeIndianMobileInput,
  validateIndianMobile,
  toIndianE164,
} from "@/utils/phoneNumber";


const countryData = {
  code: "+91",
  flag: images.IndianFlag,
};

export default function LoginNumberScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const isButtonDisabled = !!validateIndianMobile(phoneNumber) || loading;

  const validatePhoneField = () => {
    const error = validateIndianMobile(phoneNumber);
    setPhoneError(error || "");
    return !error;
  };

  const handleSkipLogin = async () => {
    await setGuestSession();
    resetToRoute(router, "/(tabs)/shop");
  };


  const handleNext = async () => {
    const error = validateIndianMobile(phoneNumber);
    if (error) {
      setPhoneError(error);
      Alert.alert("Invalid mobile number", error);
      return;
    }

    try {
      setLoading(true);
      const fullPhoneNumber = toIndianE164(phoneNumber);
      
      // Check customer existence if not already checked
      let userExists = isExistingUser;
      if (userExists === null) {
        console.log('[LoginNumberScreen] Checking customer existence before proceeding...');
        const resp = await checkCustomer(fullPhoneNumber);
        console.log('[LoginNumberScreen] checkCustomer response:', resp);
        userExists = Boolean(resp.success && resp.exists);
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
      if (!phoneNumber) {
        setPhoneError("");
        return;
      }

      if (!validatePhoneField()) {
        return;
      }

      const fullPhoneNumber = toIndianE164(phoneNumber);
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
                top: insets.top + 12,
                left: 18,
                width: 10,
                height: 18,
                justifyContent: "center",
                alignItems: "center",
                zIndex: 10,
              }}
              onPress={() => goBackOrFallback(router, "/OnboardingScreen")}
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
                  placeholder="9876543210"
                  placeholderTextColor="#8F959E"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  maxLength={10}
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(sanitizeIndianMobileInput(text));
                    if (phoneError) {
                      setPhoneError(validateIndianMobile(text) || "");
                    }
                    if (isExistingUser !== null) {
                      setIsExistingUser(null);
                    }
                  }}
                  onBlur={handlePhoneBlur}
                  returnKeyType="done"
                />
              </View>
              {!!phoneError && (
                <Text style={{ color: "#DC2626", fontSize: 12, marginTop: 8 }}>
                  {phoneError}
                </Text>
              )}
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