import { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
  Linking,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { images } from "@/constants/images";

export default function SelectStore() {
  const router = useRouter();
  const [saveAs, setSaveAs] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [buildingBlock, setBuildingBlock] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [landmark, setLandmark] = useState("");
  const params = useLocalSearchParams(); // Retrieve route parameters
  const { phoneNumber, name } = params; // Destructure phoneNumber and name
  const handleSelectStore = async () => {
    router.replace("/(tabs)/shop");
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
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 }}
          >
            <Text
              style={{
                fontFamily: "Open Sans",
                fontWeight: "700",
                fontSize: 24,
                color: "#181725",
                marginBottom: 24,
              }}
            >
              Select Store
            </Text>
            {/* Save Address As */}




            {/* Save Address Button */}
            <TouchableOpacity
              style={{
                backgroundColor: "#BCD042",
                height: 48,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
              }}
              onPress={handleSelectStore}
              accessibilityLabel="Select Store"
              activeOpacity={0.85}
            >
              <Text
                style={{
                  color: "#fff",
                  fontFamily: "Open Sans",
                  fontWeight: "700",
                  fontSize: 18,
                }}
              >
                Select Store
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}