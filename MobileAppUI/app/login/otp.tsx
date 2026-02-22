import { useState, useEffect, useRef } from "react";
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
import { verify, sendOtp, register, getStoresForUser } from "@/services/api";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import { setAuthenticatedSession } from "@/utils/session";


export default function VerificationScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60); // 60 seconds countdown
  const [canResend, setCanResend] = useState(false);
  const { confirmation } = useAuth();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start timer when component mounts
  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Timer countdown effect
  useEffect(() => {
    if (timer > 0 && !canResend) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timer, canResend]);

  const startTimer = () => {
    setTimer(60);
    setCanResend(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
          await setAuthenticatedSession();
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
            // Existing user - check store count before navigating
            try {
              const storesRes = await getStoresForUser();
              if (storesRes.success && Array.isArray(storesRes.stores)) {
                // Store the hasMultipleStores flag
                await AsyncStorage.setItem('hasMultipleStores', String(storesRes.stores.length > 1));
                
                if (storesRes.stores.length === 1) {
                  // Only one store - auto-select and go directly to shop
                  const singleStore = storesRes.stores[0];
                  await AsyncStorage.setItem('selectedStoreId', String(singleStore.CUSTOMERID));
                  await AsyncStorage.setItem('selectedStoreName', singleStore.CUSTOMERNAME);
                  console.log('🏪 Auto-selected single store:', singleStore.CUSTOMERNAME);
                  router.replace({
                    pathname: '/(tabs)/shop',
                    params: {
                      customerId: String(singleStore.CUSTOMERID),
                      storeName: singleStore.CUSTOMERNAME,
                    }
                  });
                } else if (storesRes.stores.length === 0) {
                  // No stores - go to shop without store (catalog mode)
                  await AsyncStorage.removeItem('selectedStoreId');
                  await AsyncStorage.removeItem('selectedStoreName');
                  router.replace('/(tabs)/shop');
                } else {
                  // Multiple stores - show SelectStore page
                  router.push({
                    pathname: "/login/SelectStore",
                    params: { phoneNumber: fullPhoneNumber, name },
                  });
                }
              } else {
                // Failed to fetch stores, fallback to SelectStore page
                router.push({
                  pathname: "/login/SelectStore",
                  params: { phoneNumber: fullPhoneNumber, name },
                });
              }
            } catch (storeError) {
              console.error('Error checking stores:', storeError);
              // Fallback to SelectStore page on error
              router.push({
                pathname: "/login/SelectStore",
                params: { phoneNumber: fullPhoneNumber, name },
              });
            }
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
    if (!canResend || resending) return;
    
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
        startTimer(); // Restart the timer
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
            {/* Resend Code with Timer */}
            <View className="mb-5">
              <TouchableOpacity
                style={{
                  justifyContent: "center",
                  alignItems: "flex-start",
                  opacity: (!canResend || resending) ? 0.5 : 1,
                }}
                onPress={handleResendOTP}
                disabled={!canResend || resending}
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
                  {resending ? "Sending..." : canResend ? "Resend Code" : `Resend Code in ${formatTime(timer)}`}
                </Text>
              </TouchableOpacity>
              {!canResend && !resending && (
                <Text
                  style={{
                    color: "#7C7C7C",
                    fontFamily: "Open Sans",
                    fontWeight: "400",
                    fontSize: 14,
                    marginTop: 4,
                  }}
                >
                  Please wait {formatTime(timer)} to resend OTP
                </Text>
              )}
            </View>
          </View>
          {/* Next Button (at the bottom, not inside inputs) */}
          <View className="items-end pb-10 px-6">
            <TouchableOpacity
              className={`w-14 h-14 rounded-full bg-[#BCD042] items-center justify-center shadow-md ${isButtonDisabled || loading ? "opacity-50" : ""}`}
              disabled={isButtonDisabled || loading}
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