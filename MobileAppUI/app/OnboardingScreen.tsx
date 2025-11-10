import { View, Text, ImageBackground, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { logos } from "@/constants/logo";
import { images } from "@/constants/images";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { validateTokens } from "@/services/api";
export default function OnboardingScreen() {
  const router = useRouter();



  const handleGetStarted = async () => {
    console.log("handleGetStarted invoked");
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      console.log("Access token retrieved:", accessToken);
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      console.log("Refresh token retrieved:", refreshToken);

      // If there's no stored access token, go to login
      if (!accessToken) {
        console.log("No access token found, navigating to login");
        router.replace("/login");
        return;
      }

      // Validate tokens with backend. validateTokens returns an object { isValid, user, newAccessToken }
      console.log("Validating tokens with backend");
      const validation = await validateTokens(accessToken, refreshToken);
      console.log("Token validation result:", validation);

      if (validation && validation.isValid) {
        // Save any newly issued access token
        if (validation.newAccessToken) {
          await AsyncStorage.setItem('accessToken', validation.newAccessToken);
        }
        console.log("Tokens are valid, navigating to shop");
        router.replace("/(tabs)/shop");
        return;
      }

      console.log("Tokens invalid or expired, navigating to login");
      router.replace("/login");
    } catch (error) {
      console.error("Error checking authentication status:", error);
      console.log("Navigating to login due to error");
      router.replace("/login"); // Fallback to login on error
    }
  };

  return (
    <ImageBackground
      source={images.BackgroundOnboarding}
      className="flex-1 w-full h-full justify-end"
      resizeMode="cover"
    >
      <View className="w-full items-center pb-12 px-6">
        <Image
          source={logos.LogoOnboarding}
          className="w-[90px] h-[85px] mb-6"
          resizeMode="contain"
        />
        <Text
          className="text-white text-[48px] font-[600] text-center mb-2"
          style={{ fontFamily: "Open Sans" }}
        >
          Welcome to{"\n"}Ceren Store
        </Text>
        <Text
          className="text-[#FCFCFCB2] text-[16px] font-[600] text-center mb-8"
          style={{ fontFamily: "Open Sans" }}
        >
          Get products at the best wholesale rates
        </Text>
        <TouchableOpacity
          className="bg-[#BCD042] rounded-lg w-full py-4 mb-2 items-center"
          activeOpacity={0.85}
          onPress={handleGetStarted}
        >
          <Text className="text-white text-lg font-bold">Get Started</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}
// /login