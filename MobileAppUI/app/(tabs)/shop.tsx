import React from "react";
import { View, Text, TextInput, Image, ScrollView, TouchableOpacity, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Dummy Data
const exclusiveOffers = [
  {
    id: "1",
    name: "Organic Bananas",
    qty: "7pcs, Priceg",
    price: "₹42.99",
    image: require("../../assets/images/Banana.png"), // image2
  },
  {
    id: "2",
    name: "Red Apple",
    qty: "1kg, Priceg",
    price: "₹49.99",
    image: require("../../assets/images/Banana.png"),
  },
    {
    id: "3",
    name: "Red Apple",
    qty: "1kg, Priceg",
    price: "₹49.99",
    image: require("../../assets/images/Banana.png"),
  },
];

const bestSelling = [
  {
    id: "1",
    name: "Bell Pepper Red",
    qty: "1kg, Priceg",
    price: "₹74.99",
    image: require("../../assets/images/Banana.png"),
  },
  {
    id: "2",
    name: "Ginger",
    qty: "250gm, Priceg",
    price: "₹34.99",
    image: require("../../assets/images/Banana.png"),
  },
    {
    id: "3",
    name: "Ginger",
    qty: "250gm, Priceg",
    price: "₹34.99",
    image: require("../../assets/images/Banana.png"),
  },
];

const groceries = [
  {
    id: "1",
    name: "Pulses",
    image: require("../../assets/images/Banana.png"),
    color: "bg-amber-100",
  },
  {
    id: "2",
    name: "Rice",
    image: require("../../assets/images/Banana.png"),
    color: "bg-green-100",
  },
];

const groceryProducts = [
  {
    id: "1",
    name: "Beef Bone",
    qty: "1kg, Priceg",
    price: "₹40.99",
    image: require("../../assets/images/Banana.png"),
  },
  {
    id: "2",
    name: "Broiler Chicken",
    qty: "1kg, Priceg",
    price: "₹40.99",
    image: require("../../assets/images/Banana.png"),
  },
];

// Card Components
const ProductCard = ({ item }: any) => (
  <View className="bg-white rounded-xl p-3 items-center mr-4 w-36 border border-gray-100">
    <Image source={item.image} className="w-20 h-20 mb-2" resizeMode="contain" />
    <Text className="text-base font-semibold text-gray-900" numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
    <Text className="text-gray-500 text-xs mb-1">{item.qty}</Text>
    <View className="flex-row items-center justify-between w-full">
      <Text className="font-bold text-base text-gray-900">{item.price}</Text>
      <TouchableOpacity className="w-8 h-8 rounded-full bg-green-700 items-center justify-center">
        <Ionicons name="add" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  </View>
);

const GroceryCategoryCard = ({ item }: { item: { name: string; image: any; color: string } }) => (
  <View className={`rounded-xl flex-row items-center justify-start mr-3 px-3 py-2 w-40 h-20 ${item.color}`}>
    <Image source={item.image} className="w-10 h-10 mr-2" resizeMode="contain" />
    <Text className="font-semibold text-sm text-gray-800" numberOfLines={1} // Ensures the text wraps to one line
      ellipsizeMode="tail" >{item.name}</Text>
  </View>
);

const HomeScreen = () => {
  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View className="flex-row items-center justify-between px-5 mt-20">
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={20} color="#222" />
            <Text className="text-base font-medium ml-1 text-gray-900">Kaveri Layout</Text>
          </View>
          <TouchableOpacity>
            <Image source={require("../../assets/images/AccountProfile.png")} className="w-8 h-8 rounded-full bg-gray-200" />
          </TouchableOpacity>
        </View>

        {/* Search Box */}
        <View className="flex-row items-center bg-gray-100 rounded-xl mx-4 mt-4 px-3 h-12">
          <Ionicons name="search" size={20} color="#888" />
          <TextInput className="flex-1 ml-2 text-base" placeholder="Search Store" placeholderTextColor="#888" />
        </View>

        {/* Banner
        <View className="mx-4 my-3 rounded-2xl overflow-hidden bg-green-50 h-24 flex-row items-center">
          <Image source={require("../assets/banner.png")} className="w-28 h-20 ml-2" resizeMode="contain" />
          <View className="ml-4">
            <Text className="text-xl font-bold text-gray-900">Fresh Vegetables</Text>
            <Text className="text-base text-green-700 mt-1">Get Up To 40% OFF</Text>
          </View>
        </View> */}

        {/* Exclusive Offer */}
        <View className="flex-row justify-between items-center mx-4 mt-3 mb-1 space-x-4">
          <Text className="text-lg font-bold text-gray-900">Exclusive Offer</Text>
          <TouchableOpacity>
            <Text className="text-green-700 font-medium text-base">See all</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={exclusiveOffers}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProductCard item={item} />}
          contentContainerStyle={{ paddingLeft: 16, paddingBottom: 8 }}
        />

        {/* Best Selling */}
        <View className="flex-row justify-between items-center mx-4 mt-3 mb-1">
          <Text className="text-lg font-bold text-gray-900">Best Selling</Text>
          <TouchableOpacity>
            <Text className="text-green-700 font-medium text-base">See all</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={bestSelling}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProductCard item={item} />}
          contentContainerStyle={{ paddingLeft: 16, paddingBottom: 8 }}
        />

        {/* Groceries */}
        <View className="flex-row justify-between items-center mx-4 mt-3 mb-1">
          <Text className="text-lg font-bold text-gray-900">Groceries</Text>
          <TouchableOpacity>
            <Text className="text-green-700 font-medium text-base">See all</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={groceries}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <GroceryCategoryCard item={item} />}
          contentContainerStyle={{ paddingLeft: 16, paddingBottom: 8 }}
        />

        {/* Grocery Products */}
        <FlatList
          data={groceryProducts}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProductCard item={item} />}
          contentContainerStyle={{ paddingLeft: 16, paddingBottom: 32 }}
        />


      </ScrollView>
    </View>
  );
};

export default HomeScreen;