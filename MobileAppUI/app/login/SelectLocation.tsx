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
  Modal,
  FlatList,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { images } from "@/constants/images";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";

const cityOptions = [
  { label: "Bengaluru", value: "Bengaluru" },
  { label: "Pune", value: "Pune" },
  { label: "Hyderabad", value: "Hyderabad" },
];

// Replace these with your actual data.
const cityDistricts: Record<string, string[]> = {
  Bengaluru: ["Bangalore Urban", "Bangalore Rural", "Yelahanka", "Electronic City", "Whitefield"],
  Pune: ["Haveli", "Shirur", "Mulshi", "Baramati", "Junnar"],
  Hyderabad: ["Secunderabad", "Shamshabad", "Gachibowli", "Malkajgiri", "LB Nagar"],
};

export default function SelectRegionScreen() {
  const router = useRouter();
  const [city, setCity] = useState(cityOptions[0].value);
  const [district, setDistrict] = useState("");
  const [cityDropdownVisible, setCityDropdownVisible] = useState(false);
  const [districtDropdownVisible, setDistrictDropdownVisible] = useState(false);
  const params = useLocalSearchParams(); // Retrieve route parameters

  const {name, phoneNumber, fromLocationModal} = params; // Get all parameters including the flag

  console.log("📍 SelectLocation - Received params:", { name, phoneNumber, fromLocationModal });

  const districts = cityDistricts[city] || [];

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
          {/* Illustration */}
          <View className="items-center mt-6">
            <Image
              // Make sure to add this illustration to your images constants
              source={images.LocationIllustration}
              style={{ width: 172, height: 126 }}
              resizeMode="contain"
            />
          </View>
          {/* Title and Subtitle */}
          <View className="items-center mt-6 px-6 mb-20">
            <Text
              style={{
                fontFamily: "Open Sans",
                fontWeight: "600",
                fontSize: 26,
                color: "#181725",
                marginBottom: 8,
              }}
            >
              Select Your Region
            </Text>
            <Text
              style={{
                fontFamily: "Open Sans",
                fontWeight: "600",
                fontSize: 16,
                color: "#7C7C7C",
                textAlign: "center",
              }}
            >
              Select your business region to view
              accurate wholesale rates and ensure
              timely delivery to your doorstep
            </Text>
          </View>
          {/* City Dropdown */}
          <View className="mt-8 px-6">
            <Text
              style={{
                fontFamily: "Open Sans",
                fontWeight: "600",
                fontSize: 16,
                color: "#7C7C7C",
                marginBottom: 4,
              }}
            >
              Your City
            </Text>
            <TouchableOpacity
              className="flex-row justify-between items-center border-b border-[#EAEAEA] py-3"
              onPress={() => setCityDropdownVisible(true)}
              style={{ minHeight: 40 }}
              accessibilityLabel="Select Your City"
            >
              <Text
                className="text-base"
                style={{
                  color: "#24262B",
                  fontFamily: "Open Sans",
                  fontWeight: "600",
                  fontSize: 16,
                }}
              >
                {city}
              </Text>
              <Image
                source={images.DropdownArrow}
                style={{ width: 16, height: 16 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
          {/* District Dropdown */}
          <View className="mt-8 px-6">
            <Text
              style={{
                fontFamily: "Open Sans",
                fontWeight: "600",
                fontSize: 16,
                color: "#7C7C7C",
                marginBottom: 4,
              }}
            >
              Your District
            </Text>
            <TouchableOpacity
              className="flex-row justify-between items-center border-b border-[#EAEAEA] py-3"
              onPress={() => setDistrictDropdownVisible(true)}
              style={{ minHeight: 40 }}
              accessibilityLabel="Select Your District"
            >
              <Text
                className="text-base"
                style={{
                  color: district ? "#24262B" : "#A3A3A3",
                  fontFamily: "Open Sans",
                  fontWeight: district ? "600" : "400",
                  fontSize: 16,
                }}
              >
                {district ? district : "Select Your District"}
              </Text>
              <Image
                source={images.DropdownArrow}
                style={{ width: 16, height: 16 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
          {/* City Dropdown Modal */}
          <Modal
            visible={cityDropdownVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setCityDropdownVisible(false)}
          >
            <TouchableOpacity
              className="flex-1 justify-center bg-black/30"
              activeOpacity={1}
              onPressOut={() => setCityDropdownVisible(false)}
            >
              <View className="bg-white mx-8 p-4 rounded-lg shadow-lg">
                <FlatList
                  data={cityOptions}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => (
                    <Pressable
                      className="py-3"
                      onPress={() => {
                        setCity(item.value);
                        setDistrict("");
                        setCityDropdownVisible(false);
                      }}
                    >
                      <Text
                        style={{
                          color: "#24262B",
                          fontFamily: "Open Sans",
                          fontWeight: city === item.value ? "700" : "400",
                          fontSize: 16,
                        }}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  )}
                />
              </View>
            </TouchableOpacity>
          </Modal>
          {/* District Dropdown Modal */}
          <Modal
            visible={districtDropdownVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setDistrictDropdownVisible(false)}
          >
            <TouchableOpacity
              className="flex-1 justify-center bg-black/30"
              activeOpacity={1}
              onPressOut={() => setDistrictDropdownVisible(false)}
            >
              <View className="bg-white mx-8 p-4 rounded-lg shadow-lg">
                <FlatList
                  data={districts}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <Pressable
                      className="py-3"
                      onPress={() => {
                        setDistrict(item);
                        setDistrictDropdownVisible(false);
                      }}
                    >
                      <Text
                        style={{
                          color: "#24262B",
                          fontFamily: "Open Sans",
                          fontWeight: district === item ? "700" : "400",
                          fontSize: 16,
                        }}
                      >
                        {item}
                      </Text>
                    </Pressable>
                  )}
                  ListEmptyComponent={
                    <Text
                      style={{
                        color: "#A3A3A3",
                        fontFamily: "Open Sans",
                        fontWeight: "400",
                        fontSize: 16,
                        textAlign: "center",
                        padding: 10,
                      }}
                    >
                      No districts available.
                    </Text>
                  }
                />
              </View>
            </TouchableOpacity>
          </Modal>
          {/* Add Address Button */}
          <View className="px-6 mt-8">
            <TouchableOpacity
              className="h-12 rounded-xl bg-[#BCD042] items-center justify-center"
              onPress={() => {
                console.log("🏙️ Navigating to PinLocation with:", { city, district, name, phoneNumber, fromLocationModal });
                router.push({
                  pathname: "/login/PinLocation",
                  params: { city, district, name, phoneNumber, fromLocationModal },
                });
              }}
              accessibilityLabel="Add Address"
            >
              <Text
                style={{
                  color: "#fff",
                  fontFamily: "Open Sans",
                  fontWeight: "700",
                  fontSize: 18,
                }}
              >
                Add Address
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingAnimatedView>
  );
}
