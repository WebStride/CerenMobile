import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Image, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { getExclusiveOffers, getBestSelling, getCategories, checkCustomerExists, getNewProducts, getBuyAgainProducts } from "@/services/api";

// Types
interface Product {
  productId: number;
  productName: string;
  productUnits: number;
  unitsOfMeasurement: string;
  price: number;
  image: string | null;
}

interface Category {
  categoryId: number;
  categoryName: string;
  categoryImage: string | null;
}

const defaultImage = require("../../assets/images/Banana.png");

// Product Card Component
const ProductCard = ({ item, onAdd, isCustomerExists }: { item: Product, onAdd: () => void, isCustomerExists: boolean }) => (
  <View className="bg-white rounded-xl p-3 mr-4 w-36 border border-gray-100">
    <View className="flex-1 items-center mb-2">
      <Image source={item.image || defaultImage} className="w-20 h-20 mb-2" resizeMode="contain" />
    </View>
    <Text className="text-base font-semibold text-gray-900" numberOfLines={1} ellipsizeMode="tail">
      {item.productName}
    </Text>
    <Text className="text-gray-500 text-xs mb-1">
      {item.productUnits} {item.unitsOfMeasurement}
    </Text>
    <View className="flex-row items-center justify-between w-full">
      {!isCustomerExists ? (
        <Text className="font-bold text-base text-red-500"></Text>
      ) : (
        <Text className="font-bold text-base text-gray-900">₹{item.price}.00</Text>
      )}
      <TouchableOpacity
        className="w-8 h-8 rounded-full bg-green-700 items-center justify-center"
        onPress={onAdd}
      >
        <Ionicons name="add" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  </View>
);

// Category Card Component
const GroceryCategoryCard = ({ item }: { item: Category }) => {
  const getRandomColor = () => {
    const colors = ['bg-amber-100', 'bg-green-100', 'bg-blue-100', 'bg-purple-100', 'bg-pink-100'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <View className={`rounded-xl flex-row items-center justify-start mr-3 px-3 py-2 w-48 h-auto ${getRandomColor()} gap-x-3`}>
      <Image source={item.categoryImage || defaultImage} className="w-12 h-12 mb-2" resizeMode="contain" />
      <Text className="font-semibold text-sm text-gray-800 flex-1">
        {item.categoryName}
      </Text>
    </View>
  );
};

const HomeScreen = () => {
  const router = useRouter();
  const [exclusiveOffers, setExclusiveOffers] = useState<Product[]>([]);
  const [bestSelling, setBestSelling] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isCustomerExists, setIsCustomerExists] = useState<boolean | null>(null);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [buyAgainProducts, setBuyAgainProducts] = useState<Product[]>([]);


  useEffect(() => {
    const checkCustomer = async () => {
      try {
        const response = await checkCustomerExists();
        if (response.success) {
          setIsCustomerExists(response.exists);
        } else {
          console.error("Error in customer existence check:", response.message);
          setIsCustomerExists(false);
        }
      } catch (error) {
        console.error("Error checking customer existence:", error);
        setIsCustomerExists(false);
      }
    };

    checkCustomer();
    fetchData();
  }, []);

  useEffect(() => {
    // Filter products when search query changes
    const filtered = [...exclusiveOffers, ...bestSelling].filter(product =>
      product.productName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchQuery, exclusiveOffers, bestSelling]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [exclusiveRes, bestSellingRes, categoriesRes, newProductsRes, buyAgainProductsRes] = await Promise.all([
        getExclusiveOffers(),
        getBestSelling(50),
        getCategories(),
        getNewProducts(),
        getBuyAgainProducts()
      ]);

      if (exclusiveRes.success) setExclusiveOffers(exclusiveRes.products);
      if (bestSellingRes.success) setBestSelling(bestSellingRes.products);
      if (categoriesRes.success) setCategories(categoriesRes.categories);
      if (newProductsRes.success) setNewProducts(newProductsRes.products);
      if (buyAgainProductsRes.success) setBuyAgainProducts(buyAgainProductsRes.products);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeeAllPress = () => {
    Alert.alert("Feature Coming Soon", "This feature is under development and will be available soon.");
  };

  const handleAddProduct = () => {
    if (isCustomerExists) {
      Alert.alert("Feature Coming Soon", "This feature is under development and will be available soon.");
    } else {
      Alert.alert(
        "Verification Under Approval",
        "Can add only after verification is done. Call admin for approval."
      );
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#BCD042" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {isCustomerExists === null ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#BCD042" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Top Header */}
          <View className="flex-row items-center justify-between px-5 mt-20">
            <View className="flex-row items-center">
              <Ionicons name="location-outline" size={20} color="#222" />
              <Text className="text-base font-medium ml-1 text-gray-900">Kaveri Layout</Text>
            </View>
            <TouchableOpacity onPress={() => {
              Alert.alert(
                "Logout",
                "Are you sure you want to logout?",
                [
                  {
                    text: "Cancel",
                    style: "cancel"
                  },
                  {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        // Remove both access token and refresh token
                        await Promise.all([
                          AsyncStorage.removeItem("accessToken"),
                          AsyncStorage.removeItem("refreshToken")
                        ]);

                        // Redirect to Onboarding screen
                        router.replace("/OnboardingScreen");
                      } catch (error) {
                        console.error("Error during logout:", error);
                        Alert.alert("Error", "Failed to logout. Please try again.");
                      }
                    }
                  }
                ]
              );
            }}>
              <Image source={require("../../assets/images/AccountProfile.png")} className="w-8 h-8 rounded-full bg-gray-200" />
            </TouchableOpacity>
          </View>
          
          {/* Search Box */}
          <View className="flex-row items-center bg-gray-100 rounded-xl mx-4 mt-4 px-3 h-12">
            <Ionicons name="search" size={20} color="#888" />
            <TextInput
              className="flex-1 ml-2 text-base"
              placeholder="Search Store"
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {searchQuery ? (
            // Show search results
            <View className="mt-4">
              <Text className="text-lg font-bold text-gray-900 mx-4 mb-2">Search Results</Text>
              <FlatList
                data={filteredProducts}
                horizontal={false}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                keyExtractor={(item) => item.productId.toString()}
                renderItem={({ item }) => (
                  <View className="flex-1 m-2">
                    <ProductCard item={item} onAdd={handleAddProduct} isCustomerExists={isCustomerExists} />
                  </View>
                )}
                contentContainerStyle={{ paddingHorizontal: 12 }}
                ListEmptyComponent={() => (
                  <Text className="text-center text-gray-500 mt-4">No products found</Text>
                )}
              />
            </View>
          ) : (
            <>
              {/* Exclusive Offer */}
              <View className="flex-row justify-between items-center mx-4 mt-3 mb-1 space-x-4">
                <Text className="text-lg font-bold text-gray-900">Exclusive Offer</Text>
                <TouchableOpacity onPress={handleSeeAllPress}>
                  <Text className="text-green-700 font-medium text-base">See all</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={exclusiveOffers}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.productId.toString()}
                renderItem={({ item }) => <ProductCard item={item} onAdd={handleAddProduct} isCustomerExists={isCustomerExists} />}
                contentContainerStyle={{ paddingLeft: 16, paddingBottom: 8 }}
                ListEmptyComponent={() => (
                  <Text className="text-center text-gray-500 mx-4">No exclusive offers available</Text>
                )}
              />






              {/* Best Selling */}
              <View className="flex-row justify-between items-center mx-4 mt-3 mb-1">
                <Text className="text-lg font-bold text-gray-900">Best Selling</Text>
                <TouchableOpacity onPress={handleSeeAllPress}>
                  <Text className="text-green-700 font-medium text-base">See all</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={bestSelling}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.productId.toString()}
                renderItem={({ item }) => <ProductCard item={item} onAdd={handleAddProduct} isCustomerExists={isCustomerExists} />}
                contentContainerStyle={{ paddingLeft: 16, paddingBottom: 8 }}
                ListEmptyComponent={() => (
                  <Text className="text-center text-gray-500 mx-4">No best selling products available</Text>
                )}
              />

              {/* Categories */}
              <View className="flex-row justify-between items-center mx-4 mt-3 mb-1">
                <Text className="text-lg font-bold text-gray-900">Categories</Text>
                <TouchableOpacity onPress={handleSeeAllPress}>
                  <Text className="text-green-700 font-medium text-base">See all</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={categories}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.categoryId.toString()}
                renderItem={({ item }) => <GroceryCategoryCard item={item} />}
                contentContainerStyle={{ paddingLeft: 16, paddingBottom: 32 }}
                ListEmptyComponent={() => (
                  <Text className="text-center text-gray-500 mx-4">No categories available</Text>
                )}
              />

              {/* New Products */}
              <View className="flex-row justify-between items-center mx-4 mt-3 mb-1">
                <Text className="text-lg font-bold text-gray-900">New Products</Text>
                <TouchableOpacity onPress={handleSeeAllPress}>
                  <Text className="text-green-700 font-medium text-base">See all</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={newProducts}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.productId.toString()}
                renderItem={({ item }) => <ProductCard item={item} onAdd={handleAddProduct} isCustomerExists={isCustomerExists} />}
                contentContainerStyle={{ paddingLeft: 16, paddingBottom: 8 }}
                ListEmptyComponent={() => (
                  <Text className="text-center text-gray-500 mx-4">No new products available</Text>
                )}
              />

              {/* Buy Again Products */}
              <View className="flex-row justify-between items-center mx-4 mt-3 mb-1">
                <Text className="text-lg font-bold text-gray-900">Buy Again Products</Text>
                <TouchableOpacity onPress={handleSeeAllPress}>
                  <Text className="text-green-700 font-medium text-base">See all</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={buyAgainProducts}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.productId.toString()}
                renderItem={({ item }) => <ProductCard item={item} onAdd={handleAddProduct} isCustomerExists={isCustomerExists} />}
                contentContainerStyle={{ paddingLeft: 16, paddingBottom: 8 }}
                ListEmptyComponent={() => (
                  <Text className="text-center text-gray-500 mx-4">No buy again products available</Text>
                )}
              />

            </>
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default HomeScreen;