import { View, Text, ImageBackground, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { logos } from "@/constants/logo";
import { images } from "@/constants/images";
export default function OnboardingScreen() {
  const router = useRouter();

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
          onPress={() => router.replace("/(tabs)/shop")}
        >
          <Text className="text-white text-lg font-bold">Get Started</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}
// /login