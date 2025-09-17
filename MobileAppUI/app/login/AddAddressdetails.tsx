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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { sendAddressDetails } from "@/services/api";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";

const SAVE_AS_OPTIONS = [
  {
    label: "Home",
    value: "home",
    icon: images.HomeIcon, // ![image8](image8)
  },
  {
    label: "Shop",
    value: "shop",
    icon: images.ShopIcon, // ![image9](image9)
  },
  {
    label: "Other",
    value: "other",
    icon: images.OtherIcon, // You should add Other icon if you have, else fallback to a default icon
  },
];

export default function AddAddressDetailsScreen() {
  const router = useRouter();
  const [saveAs, setSaveAs] = useState("home"); // Default to "home"
  const [houseNumber, setHouseNumber] = useState("");
  const [buildingBlock, setBuildingBlock] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [landmark, setLandmark] = useState("");
  const params = useLocalSearchParams(); // Retrieve route parameters
  const {
    phoneNumber: phoneNumberParam,
    name: nameParam,
    location: locationParam,
    city: cityParam,
    district: districtParam,
    address: addressParam,
    fromLocationModal: fromLocationModalParam,
    latitude: latitudeParam,
    longitude: longitudeParam
  } = params;

  // Ensure parameters are strings
  const phoneNumber = Array.isArray(phoneNumberParam) ? phoneNumberParam[0] : phoneNumberParam || "";
  const name = Array.isArray(nameParam) ? nameParam[0] : nameParam || "";
  const location = Array.isArray(locationParam) ? locationParam[0] : locationParam || "";
  const city = Array.isArray(cityParam) ? cityParam[0] : cityParam || "";
  const district = Array.isArray(districtParam) ? districtParam[0] : districtParam || "";
  const address = Array.isArray(addressParam) ? addressParam[0] : addressParam || "";
  const fromLocationModal = Array.isArray(fromLocationModalParam) ? fromLocationModalParam[0] : fromLocationModalParam || "";
  const latitude = Array.isArray(latitudeParam) ? latitudeParam[0] : latitudeParam || "";
  const longitude = Array.isArray(longitudeParam) ? longitudeParam[0] : longitudeParam || "";

  console.log("📍 AddAddressDetails - Received params:", { phoneNumber, name, location, city, district, address, fromLocationModal, latitude, longitude });
  const handleSaveAddress = async () => {
    try {
          console.log("Received params:", params);

      // if (!phoneNumber || !name) {
      //   Alert.alert("Error", "Phone number or name is missing. Please log in again.");
      //   return;
      // }

      const payload = {
        name,
        phoneNumber,
        city, // Use the properly typed city variable
        district, // Use the properly typed district variable
        houseNumber,
        buildingBlock,
        pinCode,
        landmark,
        saveAs: saveAs || "home", // Default to "home" if not selected
        isDefault: false // New addresses are not default by default
      };

      console.log("Sending address details:", payload);

      const response = await sendAddressDetails(payload);

      if (response.success) {
        Alert.alert(
          "Success",
          response.message || "Address saved successfully!",
          [
            {
              text: "OK",
              onPress: () => {
                if (fromLocationModal === "true") {
                  // User came from location modal, navigate back to home screen
                  console.log("🏠 Navigating back to home screen after adding address");
                  router.push("/(tabs)/shop");
                } else {
                  // Normal login flow, navigate to home with user data
                  console.log("🔐 Normal login flow, navigating to home with user data");
                  router.push({
                    pathname: "/(tabs)/shop",
                    params: {
                      city,
                      district,
                      location,
                      address,
                      name,
                      phoneNumber
                    },
                  });
                }
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", response.message || "Failed to send details. Please try again.");
      }
    } catch (error) {
      console.error("Error saving address details:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingAnimatedView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
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
              Add Address Details
            </Text>
            {/* Save Address As */}
            <Text
              style={{
                fontFamily: "Open Sans",
                fontWeight: "700",
                fontSize: 20,
                color: "#030303",
                marginBottom: 8,
              }}
            >
              Save Address as
            </Text>
            <View className="flex-row mb-8">
              {SAVE_AS_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 8,
                    paddingHorizontal: 20,
                    borderRadius: 22,
                    borderWidth: 1.5,
                    borderColor: saveAs === option.value ? "#BCD042" : "#EAEAEA",
                    backgroundColor: saveAs === option.value ? "#F9FBEF" : "#fff",
                    marginRight: 14,
                  }}
                  onPress={() => setSaveAs(option.value)}
                  accessibilityLabel={option.label}
                  activeOpacity={0.85}
                >
                  <Image
                    source={option.icon}
                    style={{
                      width: 16,
                      height: 18,
                      tintColor: saveAs === option.value ? "#BCD042" : "#BDBDBD",
                      marginRight: 8,
                    }}
                    resizeMode="contain"
                  />
                  <Text
                    style={{
                      color: saveAs === option.value ? "#BCD042" : "#7C7C7C",
                      fontFamily: "Open Sans",
                      fontWeight: saveAs === option.value ? "700" : "600",
                      fontSize: 16,
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Address fields (all optional) */}
            <Text
              style={{
                fontFamily: "Open Sans",
                fontWeight: "600",
                fontSize: 15,
                color: "#7C7C7C",
                marginBottom: 6,
              }}
            >
              House/Shop No. *
            </Text>
            <TextInput
              style={{
                fontFamily: "Open Sans",
                fontWeight: "600",
                fontSize: 16,
                color: "#181725",
                borderBottomWidth: 1,
                borderBottomColor: "#EAEAEA",
                marginBottom: 16,
                paddingVertical: 4,
              }}
              value={houseNumber}
              onChangeText={setHouseNumber}
              placeholder="Enter House/Shop No."
              placeholderTextColor="#A3A3A3"
              autoCapitalize="words"
            />

            <Text
              style={{
                fontFamily: "Open Sans",
                fontWeight: "600",
                fontSize: 15,
                color: "#7C7C7C",
                marginBottom: 6,
              }}
            >
              Building & Block No. *
            </Text>
            <TextInput
              style={{
                fontFamily: "Open Sans",
                fontWeight: "600",
                fontSize: 16,
                color: "#181725",
                borderBottomWidth: 1,
                borderBottomColor: "#EAEAEA",
                marginBottom: 16,
                paddingVertical: 4,
              }}
              value={buildingBlock}
              onChangeText={setBuildingBlock}
              placeholder="Enter Building & Block No."
              placeholderTextColor="#A3A3A3"
              autoCapitalize="words"
            />

            <Text
              style={{
                fontFamily: "Open Sans",
                fontWeight: "600",
                fontSize: 15,
                color: "#7C7C7C",
                marginBottom: 6,
              }}
            >
              Pin code *
            </Text>
            <TextInput
              style={{
                fontFamily: "Open Sans",
                fontWeight: "600",
                fontSize: 16,
                color: "#181725",
                borderBottomWidth: 1,
                borderBottomColor: "#EAEAEA",
                marginBottom: 16,
                paddingVertical: 4,
              }}
              value={pinCode}
              onChangeText={setPinCode}
              placeholder="Enter Pin Code"
              placeholderTextColor="#A3A3A3"
              keyboardType="number-pad"
              maxLength={6}
            />

            <Text
              style={{
                fontFamily: "Open Sans",
                fontWeight: "600",
                fontSize: 15,
                color: "#7C7C7C",
                marginBottom: 6,
              }}
            >
              Landmark
            </Text>
            <TextInput
              style={{
                fontFamily: "Open Sans",
                fontWeight: "600",
                fontSize: 16,
                color: "#181725",
                borderBottomWidth: 1,
                borderBottomColor: "#EAEAEA",
                marginBottom: 20,
                paddingVertical: 4,
              }}
              value={landmark}
              onChangeText={setLandmark}
              placeholder="Enter Landmark"
              placeholderTextColor="#A3A3A3"
              autoCapitalize="sentences"
            />

            {/* Agreement */}
            <Text
              style={{
                fontFamily: "Open Sans",
                fontWeight: "600",
                fontSize: 14,
                color: "#7C7C7C",
                marginTop: 10,
                marginBottom: 22,
                lineHeight: 20,
              }}
            >
              By continuing you agree to our{" "}
              <Text
                style={{ color: "#53B175" }}
                onPress={() => Linking.openURL("https://your.terms.url")}
              >
                Terms of Service
              </Text>
              {" and "}
              <Text
                style={{ color: "#53B175" }}
                onPress={() => Linking.openURL("https://your.privacy.url")}
              >
                Privacy Policy.
              </Text>
            </Text>

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
              onPress={handleSaveAddress}
              accessibilityLabel="Save Address"
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
                Save Address
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingAnimatedView>
  );
}