import React, { useState } from "react";
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  Modal,
  Pressable,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AccountScreen() {
  const router = useRouter();
  
  // ONLY ADDITION: State for modal
  const [modalVisible, setModalVisible] = useState(false);

  // Mock user data - replace with actual user data from your auth context
  const userData = {
    name: "Amitav Panda",
    email: "pandaamitav01@gmail.com",
    mobile: "+917077404655",
    gender: "Male",
    customerType: "General",
    address: "121221, asdf, asdfasdf, Marathahalli, Bengaluru, Karnataka, India",
    profileImage: require("../../assets/images/AccountProfile.png")
  };

  const handleLogout = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              // Remove tokens
              await Promise.all([
                AsyncStorage.removeItem("accessToken"),
                AsyncStorage.removeItem("refreshToken")
              ]);
              
              // Navigate to onboarding
              router.replace("/OnboardingScreen");
            } catch (error) {
              console.error("Error during logout:", error);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          }
        }
      ]
    );
  };

  const menuItems = [
    {
      id: 'favourites',
      title: 'Favourites',
      icon: 'heart-outline',
      onPress: () => router.push("/favourites/Favourites")
    },
    {
      id: 'details',
      title: 'My Details',
      icon: 'card-outline',
      onPress: () => setModalVisible(true) // ONLY CHANGE: Open modal instead of alert
    },
    {
      id: 'address',
      title: 'Delivery Address',
      icon: 'location-outline',
      onPress: () => Alert.alert("Coming Soon", "Delivery Address feature is under development.")
    },
    {
      id: 'accounts',
      title: 'Accounts',
      icon: 'wallet-outline',
      onPress: () => Alert.alert("Coming Soon", "Accounts feature is under development.")
    },
    {
      id: 'promo',
      title: 'Promo Card',
      icon: 'card-outline',
      onPress: () => Alert.alert("Coming Soon", "Promo Card feature is under development.")
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'notifications-outline',
      onPress: () => Alert.alert("Coming Soon", "Notifications feature is under development.")
    },
    {
      id: 'help',
      title: 'Help',
      icon: 'help-circle-outline',
      onPress: () => Alert.alert("Coming Soon", "Help feature is under development.")
    },
    {
      id: 'about',
      title: 'About',
      icon: 'information-circle-outline',
      onPress: () => Alert.alert("Coming Soon", "About feature is under development.")
    }
  ];

  const MenuItemComponent = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={item.onPress}
      className="flex-row items-center justify-between py-4 px-4 bg-white border-b border-gray-100"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center flex-1">
        <View className="w-10 h-10 items-center justify-center mr-4">
          <Ionicons name={item.icon as any} size={24} color="#374151" />
        </View>
        <Text className="text-base font-medium text-gray-900 flex-1">
          {item.title}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Profile Header - UNCHANGED */}
        <View className="bg-white px-4 py-6 border-b border-gray-100">
          <View className="flex-row items-center">
            {/* Profile Image */}
            <View className="relative">
              <Image
                source={userData.profileImage}
                className="w-20 h-20 rounded-full"
                resizeMode="cover"
              />
              {/* Edit Icon */}
              <TouchableOpacity 
                className="absolute -top-1 -right-1 bg-green-600 rounded-full p-1.5"
                onPress={() => Alert.alert("Coming Soon", "Edit profile feature is under development.")}
              >
                <Ionicons name="create" size={14} color="white" />
              </TouchableOpacity>
            </View>
            
            {/* User Info */}
            <View className="flex-1 ml-4">
              <View className="flex-row items-center">
                <Text className="text-xl font-bold text-gray-900 flex-1">
                  {userData.name}
                </Text>
                <TouchableOpacity 
                  onPress={() => Alert.alert("Coming Soon", "Edit name feature is under development.")}
                  className="ml-2"
                >
                  <Ionicons name="create-outline" size={20} color="#10B981" />
                </TouchableOpacity>
              </View>
              <Text className="text-gray-500 text-base mt-1">
                {userData.email}
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Items - UNCHANGED */}
        <View className="mt-4 bg-white">
          {menuItems.map((item, index) => (
            <MenuItemComponent key={item.id} item={item} />
          ))}
        </View>

        {/* Logout Button - UNCHANGED */}
        <View className="mt-8 mx-4">
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-white rounded-lg py-4 px-4 border border-gray-200 shadow-sm"
            activeOpacity={0.8}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="log-out-outline" size={24} color="#10B981" />
              <Text className="text-lg font-semibold text-green-600 ml-3">
                Log Out
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* App Version - UNCHANGED */}
        <View className="mt-8 items-center pb-4">
          <Text className="text-gray-400 text-sm">
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* ONLY ADDITION: Personal Information Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            className="bg-white rounded-t-3xl px-6 py-4"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal drag indicator */}
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />
            
            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">Personal Information</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#16a34a" />
              </TouchableOpacity>
            </View>

            {/* User Details Card */}
            <View className="bg-green-100 rounded-2xl p-4 mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xl font-bold text-gray-900">{userData.name}</Text>
                <TouchableOpacity>
                  <Ionicons name="create-outline" size={24} color="#16a34a" />
                </TouchableOpacity>
              </View>
              <Text className="text-gray-700 mb-1">Customer Type : {userData.customerType}</Text>
              <Text className="text-gray-700 mb-1">Mobile Number : {userData.mobile}</Text>
              <Text className="text-gray-700 mb-1">Email : {userData.email}</Text>
              <Text className="text-gray-700">Gender : {userData.gender}</Text>
            </View>

            {/* Address Section */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-3">Active Address (Home)</Text>
              <View className="bg-green-100 rounded-2xl p-4 flex-row items-start">
                <Ionicons name="location" size={24} color="#16a34a" className="mr-3 mt-1" />
                <Text className="text-gray-700 flex-1 leading-5">
                  {userData.address}
                </Text>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
