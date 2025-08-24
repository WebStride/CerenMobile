import React from "react";
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFavourites } from "../context/FavouritesContext";
import { useCart } from "../context/CartContext";

const defaultImage = require("../../assets/images/Banana.png");

export default function FavouritesScreen() {
  const router = useRouter();
  const { favourites, removeFromFavourites } = useFavourites();
  const { cart, addToCart } = useCart();

  const handleAddAllToCart = () => {
    if (favourites.length === 0) return;
    
    favourites.forEach(item => {
      addToCart({
        productId: item.productId,
        productName: item.productName,
        price: item.price,
        image: item.image,
        productUnits: item.productUnits,
        unitsOfMeasurement: item.unitsOfMeasurement,
      });
    });
    
    Alert.alert("Success", `${favourites.length} items added to cart!`);
  };

  const FavouriteItem = ({ item }: { item: any }) => {
    const cartItem = cart.find(x => x.productId === item.productId);
    
    return (
      <View className="flex-row items-center py-4 px-4 bg-white border-b border-gray-100">
        {/* Product Image */}
        <Image 
          source={item.image || defaultImage} 
          className="w-16 h-16 mr-4" 
          resizeMode="contain" 
        />
        
        {/* Product Details */}
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900" numberOfLines={2}>
            {item.productName}
          </Text>
          <Text className="text-gray-500 text-sm mt-1">
            {item.productUnits}{item.unitsOfMeasurement}, Price
          </Text>
        </View>
        
        {/* Price and Actions */}
        <View className="items-end">
          <Text className="font-bold text-base text-gray-900 mb-2">
            ₹{item.price.toFixed(2)}
          </Text>
          <TouchableOpacity
            onPress={() => removeFromFavourites(item.productId)}
            className="p-1"
          >
            <Ionicons name="close" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View className="flex-1 justify-center items-center py-20">
      <Ionicons name="heart-outline" size={64} color="#d1d5db" />
      <Text className="text-gray-500 text-lg mt-4">No favourites yet</Text>
      <Text className="text-gray-400 text-sm mt-1">Add items to see them here</Text>
      <TouchableOpacity
        onPress={() => router.push("/shop")}
        className="bg-green-700 px-6 py-3 rounded-full mt-4"
      >
        <Text className="text-white font-semibold">Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="mr-3"
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900 flex-1 text-center">
          Favourite
        </Text>
        <View className="w-6" />
      </View>

      {/* Favourites List */}
      <View className="flex-1">
        <FlatList
          data={favourites}
          renderItem={({ item }) => <FavouriteItem item={item} />}
          keyExtractor={(item) => `favourite_${item.productId}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ 
            paddingBottom: favourites.length > 0 ? 120 : 0,
            flexGrow: 1 
          }}
          ListEmptyComponent={renderEmpty}
        />
      </View>

      {/* Add All to Cart Button */}
      {favourites.length > 0 && (
        <View className="absolute left-0 right-0 bottom-6 px-4">
          <TouchableOpacity
            onPress={handleAddAllToCart}
            className="bg-green-700 rounded-full py-4 px-6 shadow-lg"
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-center text-base">
              Add All To Cart
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
