import React, { useState, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView,
  Alert,
  TextInput
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFavourites } from "../context/FavouritesContext";
import { useCart } from "../context/CartContext";

const defaultImage = require("../../assets/images/Banana.png");

// Blurhash for smooth placeholder (light gray)
const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

export default function FavouritesScreen() {
  const router = useRouter();
  const { favourites, removeFromFavourites } = useFavourites();
  const { cart, addToCart, increaseQuantity, decreaseQuantity } = useCart();

  const handleAddAllToCart = () => {
    if (favourites.length === 0) return;
    
    let addedCount = 0;
    let skippedCount = 0;
    
    favourites.forEach(item => {
      const cartItem = cart.find(x => x.productId === item.productId);
      const minOrder = item.minQuantity || 1;
      
      if (cartItem) {
        // Already in cart, skip
        skippedCount++;
      } else {
        // Add to cart with minimum quantity
        addToCart({
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          image: item.image,
          productUnits: item.productUnits,
          unitsOfMeasurement: item.unitsOfMeasurement,
        }, minOrder);
        addedCount++;
      }
    });
    
    if (addedCount > 0) {
      Alert.alert("Success", `${addedCount} item(s) added to cart!${skippedCount > 0 ? ` (${skippedCount} already in cart)` : ''}`);
    } else {
      Alert.alert("Info", "All items are already in your cart!");
    }
  };

  const FavouriteItem = ({ item }: { item: any }) => {
    const [showControls, setShowControls] = useState(false);
    const [qtyInput, setQtyInput] = useState("");
    const cartItem = cart.find(x => x.productId === item.productId);
    const minOrder = item.minQuantity || 1;
    
    useEffect(() => {
      if (cartItem) {
        setShowControls(true);
        setQtyInput(cartItem.quantity.toString());
      } else {
        setShowControls(false);
        setQtyInput("");
      }
    }, [cartItem]);

    const handleProductPress = useCallback(() => {
      router.push({
        pathname: '/products/[productId]',
        params: {
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          image: typeof item.image === 'string' ? item.image : '',
          productUnits: item.productUnits,
          unitsOfMeasurement: item.unitsOfMeasurement,
          minQuantity: item.minQuantity || 1,
        }
      });
    }, [item, router]);

    const handleAddToCartPress = useCallback(() => {
      if (!cartItem) {
        addToCart({
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          image: item.image,
          productUnits: item.productUnits,
          unitsOfMeasurement: item.unitsOfMeasurement,
        }, minOrder);
      }
    }, [cartItem, item, minOrder, addToCart]);

    const handleIncrease = useCallback(() => {
      if (cartItem) {
        increaseQuantity(item.productId);
      }
    }, [cartItem, item.productId, increaseQuantity]);

    const handleDecrease = useCallback(() => {
      if (cartItem) {
        if (cartItem.quantity > minOrder) {
          decreaseQuantity(item.productId);
        } else {
          Alert.alert(
            "Minimum Order Quantity",
            `This product requires a minimum order of ${minOrder} unit(s). Please remove from cart if you don't want it.`,
            [{ text: "OK" }]
          );
        }
      }
    }, [cartItem, item.productId, minOrder, decreaseQuantity]);

    const handleQtyInputChange = useCallback((text: string) => {
      setQtyInput(text);
    }, []);

    const handleQtyInputBlur = useCallback(() => {
      if (cartItem) {
        const newQty = parseInt(qtyInput, 10);
        if (isNaN(newQty) || newQty < minOrder) {
          Alert.alert(
            "Invalid Quantity",
            `Quantity must be at least ${minOrder}.`,
            [{ text: "OK", onPress: () => setQtyInput(cartItem.quantity.toString()) }]
          );
        } else if (newQty !== cartItem.quantity) {
          const diff = newQty - cartItem.quantity;
          if (diff > 0) {
            for (let i = 0; i < diff; i++) increaseQuantity(item.productId);
          } else {
            for (let i = 0; i < Math.abs(diff); i++) decreaseQuantity(item.productId);
          }
        }
      }
    }, [cartItem, qtyInput, minOrder, item.productId, increaseQuantity, decreaseQuantity]);
    
    return (
      <View className="flex-row py-4 px-4 bg-white border-b border-gray-100">
        {/* Product Image - Clickable */}
        <TouchableOpacity onPress={handleProductPress} activeOpacity={0.7}>
          <Image 
            source={item.image ? (typeof item.image === 'string' ? { uri: item.image } : item.image) : defaultImage}
            placeholder={blurhash}
            contentFit="contain"
            transition={200}
            cachePolicy="memory-disk"
            style={{ width: 80, height: 80, backgroundColor: '#f3f4f6', borderRadius: 8 }}
          />
        </TouchableOpacity>
        
        {/* Product Details - Clickable */}
        <TouchableOpacity 
          onPress={handleProductPress} 
          activeOpacity={0.7}
          className="flex-1 ml-3"
        >
          <Text className="text-base font-semibold text-gray-900" numberOfLines={2}>
            {item.productName}
          </Text>
          <Text className="text-gray-500 text-sm mt-1">
            {item.productUnits}{item.unitsOfMeasurement}
          </Text>
          <Text className="font-bold text-base text-gray-900 mt-1">
            ₹{item.price.toFixed(2)}
          </Text>
          {minOrder > 1 && (
            <Text className="text-xs text-orange-600 mt-1">
              Min order: {minOrder} {item.unitsOfMeasurement}
            </Text>
          )}
        </TouchableOpacity>
        
        {/* Actions Column */}
        <View className="items-end justify-between ml-2">
          {/* Remove from Favourites */}
          <TouchableOpacity
            onPress={() => removeFromFavourites(item.productId)}
            className="p-1"
          >
            <Ionicons name="heart" size={24} color="#EF4444" />
          </TouchableOpacity>
          
          {/* Cart Controls */}
          <View className="mt-2">
            {!showControls ? (
              <TouchableOpacity
                onPress={handleAddToCartPress}
                className="bg-green-700 px-4 py-2 rounded-full"
                activeOpacity={0.8}
              >
                <Text className="text-white font-semibold text-sm">Add</Text>
              </TouchableOpacity>
            ) : (
              <View className="flex-row items-center bg-green-700 rounded-full px-2 py-1">
                <TouchableOpacity onPress={handleDecrease} className="px-2 py-1">
                  <Text className="text-white font-bold text-lg">-</Text>
                </TouchableOpacity>
                <TextInput
                  value={qtyInput}
                  onChangeText={handleQtyInputChange}
                  onBlur={handleQtyInputBlur}
                  keyboardType="number-pad"
                  className="text-white font-semibold text-center mx-1"
                  style={{ minWidth: 30 }}
                />
                <TouchableOpacity onPress={handleIncrease} className="px-2 py-1">
                  <Text className="text-white font-bold text-lg">+</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
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
