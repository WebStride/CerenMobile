import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, Alert, SafeAreaView, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCart } from "../context/CartContext";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { checkCustomerExists } from "../../services/api";

const defaultImage = require("../../assets/images/Banana.png");

export default function CartScreen() {
  const router = useRouter();
  const { cart, increase, decrease, removeFromCart, cartTotal, clearCart } = useCart();
  const insets = useSafeAreaInsets();
  const [isCustomerExists, setIsCustomerExists] = useState<boolean | null>(null);
  
  // Check customer existence when component mounts
  useEffect(() => {
    const checkCustomer = async () => {
      try {
        const response = await checkCustomerExists();
        const isRegistered = response.success ? response.exists : false;
        setIsCustomerExists(isRegistered);
        
        // Show popup if user is not registered
        if (!isRegistered) {
          Alert.alert(
            'Registration Required',
            'Please register yourself to access add to cart.',
            [
              { text: 'OK', onPress: () => router.back() }
            ]
          );
        }
      } catch (error) {
        console.error("Error checking customer existence:", error);
        setIsCustomerExists(false);
        Alert.alert(
          'Registration Required',
          'Please register yourself to access add to cart.',
          [
            { text: 'OK', onPress: () => router.back() }
          ]
        );
      }
    };
    
    checkCustomer();
  }, [router]);
  
  // height we'll reserve for the checkout bar (approximate)
  const checkoutBarHeight = 72; // px
  // ensure an extra gap above system navigation / gesture bar
  const bottomOffset = (insets.bottom || 0) + 50;

  const handleQuantityChange = (productId: number, newQuantity: string) => {
    const numVal = Number(newQuantity.replace(/[^0-9]/g, ""));
    const currentItem = cart.find(item => item.productId === productId);
    
    if (!currentItem) return;
    
    if (numVal === 0 || newQuantity === "") {
      removeFromCart(productId);
      return;
    }
    
    const diff = numVal - currentItem.quantity;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) increase(productId);
    } else if (diff < 0) {
      for (let i = 0; i < Math.abs(diff); i++) decrease(productId);
    }
  };

  // Calculate bill details
  const itemsSubtotal = cartTotal;
  const discountPercent = 13.6;
  const discountAmount = (itemsSubtotal * discountPercent) / 100;
  const itemsTotalAfterDiscount = itemsSubtotal - discountAmount;
  const deliveryCharge = 100;
  const handlingCharge = 20;
  const isDeliveryFree = itemsTotalAfterDiscount > 500; // Free delivery above ₹500
  const isHandlingFree = itemsTotalAfterDiscount > 500; // Free handling above ₹500
  const totalSavings = discountAmount + (isDeliveryFree ? deliveryCharge : 0) + (isHandlingFree ? handlingCharge : 0);
  const finalAmount = itemsTotalAfterDiscount + (isDeliveryFree ? 0 : deliveryCharge) + (isHandlingFree ? 0 : handlingCharge);
  const totalSavingsPercent = ((totalSavings / itemsSubtotal) * 100).toFixed(1);

  // Don't render cart content if user is not registered
  if (isCustomerExists === false) {
    return null; // Return null since popup is already shown and user will be navigated back
  }

  // Show loading state while checking registration
  if (isCustomerExists === null) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Checking access...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!cart.length) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <Ionicons name="cart-outline" size={64} color="#CCC" />
          <Text className="text-xl font-semibold mt-4 text-gray-700">
            Your cart is empty
          </Text>
          <Text className="text-gray-500 mt-1">Add items to see them here.</Text>
          <TouchableOpacity
            onPress={() => router.push("/shop")}
            className="bg-green-700 px-6 py-3 rounded-full mt-4"
          >
            <Text className="text-white font-semibold">Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-100">
        <Text className="text-xl font-bold text-center text-gray-900">My Cart</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        className="flex-1" 
  // ensure content is fully visible above bottom checkout bar + safe area
  contentContainerStyle={{ paddingBottom: checkoutBarHeight + bottomOffset + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cart Items */}
        <View className="px-4">
          {cart.map((item, index) => (
            <View key={item.productId}>
              <View className="flex-row items-center py-4">
                {/* Product Image */}
                <View className="mr-3">
                  <Image 
                    source={item.image || defaultImage} 
                    className="w-16 h-16" 
                    resizeMode="contain" 
                  />
                </View>

                {/* Product Details */}
                <View className="flex-1 mr-3">
                  <Text className="text-base font-semibold text-gray-900" numberOfLines={2}>
                    {item.productName}
                  </Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    {item.productUnits}{item.unitsOfMeasurement}, Price
                  </Text>
                  
                  {/* Quantity Controls */}
                  <View className="flex-row items-center mt-3 rounded-full bg-green-700 px-1 py-1 self-start">
                    <TouchableOpacity
                      onPress={() => decrease(item.productId)}
                      className="w-8 h-8 rounded-full items-center justify-center"
                    >
                      <Ionicons name="remove" size={20} color="#fff" />
                    </TouchableOpacity>
                    <View className="mx-2 min-w-[40px] items-center justify-center">
                      <TextInput
                        className="text-center text-white font-bold text-base"
                        value={String(item.quantity)}
                        onChangeText={(val) => handleQuantityChange(item.productId, val)}
                        keyboardType="number-pad"
                        maxLength={3}
                        style={{
                          borderWidth: 0,
                          backgroundColor: "transparent",
                          fontSize: 16,
                          color: "white",
                          fontWeight: "bold",
                          textAlign: "center",
                          minWidth: 40,
                        }}
                        selectionColor="#fff"
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => increase(item.productId)}
                      className="w-8 h-8 rounded-full items-center justify-center"
                    >
                      <Ionicons name="add" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Price and Remove */}
                <View className="items-end">
                  <TouchableOpacity 
                    onPress={() => removeFromCart(item.productId)}
                    className="mb-2"
                  >
                    <Ionicons name="close" size={20} color="#666" />
                  </TouchableOpacity>
                  <Text className="font-bold text-base text-gray-900">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              </View>
              
              {/* Separator line */}
              {index < cart.length - 1 && (
                <View className="h-px bg-gray-200" />
              )}
            </View>
          ))}
        </View>

        {/* Add More Items Button */}
        <View className="px-4 py-4">
          <TouchableOpacity
            onPress={() => router.push("/shop")}
            className="flex-row items-center justify-center py-3 border border-green-700 rounded-lg"
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={20} color="#16a34a" />
            <Text className="text-green-700 font-semibold ml-2">Add more item</Text>
          </TouchableOpacity>
        </View>

        {/* Bill Details */}
        <View className="mx-4 mb-4 bg-gray-50 rounded-lg p-4">
          <Text className="text-lg font-bold text-gray-900 mb-4">Bill Details</Text>
          
          {/* Items breakdown */}
          {cart.map((item) => (
            <View key={item.productId} className="flex-row justify-between mb-2">
              <Text className="text-gray-700 flex-1" numberOfLines={1}>
                {item.quantity} x {item.productName} (₹{item.price})
              </Text>
              <Text className="text-gray-700 ml-2">₹{(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}

          {/* Separator */}
          <View className="h-px bg-gray-300 my-3" />

          {/* Subtotal */}
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-row items-center">
              <Ionicons name="receipt-outline" size={16} color="#666" />
              <Text className="text-gray-900 font-semibold ml-2">Total</Text>
            </View>
            <Text className="text-gray-900 font-semibold">₹{itemsSubtotal.toFixed(2)}</Text>
          </View>

          {/* Separator */}
          <View className="h-px bg-gray-300 my-3" />

          {/* Items Discount */}
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-row items-center">
              <Ionicons name="pricetag-outline" size={16} color="#16a34a" />
              <Text className="text-gray-700 ml-2">Items Discount ({discountPercent}%)</Text>
            </View>
            <Text className="text-green-600 font-semibold">- ₹{discountAmount.toFixed(2)}</Text>
          </View>

          {/* Items Total Price */}
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-row items-center">
              <Ionicons name="calculator-outline" size={16} color="#666" />
              <Text className="text-gray-700 ml-2">Items Total Price</Text>
            </View>
            <Text className="text-gray-900">₹{itemsTotalAfterDiscount.toFixed(2)}</Text>
          </View>

          {/* Delivery Charge */}
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-row items-center">
              <Ionicons name="car-outline" size={16} color="#666" />
              <Text className="text-gray-700 ml-2">Delivery Charge</Text>
            </View>
            <View className="flex-row items-center">
              {isDeliveryFree && <Text className="text-gray-400 line-through mr-2">₹{deliveryCharge}</Text>}
              <Text className={isDeliveryFree ? "text-green-600 font-semibold" : "text-gray-900"}>
                {isDeliveryFree ? "Free" : `₹${deliveryCharge}`}
              </Text>
            </View>
          </View>

          {/* Handling Charge */}
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-row items-center">
              <Ionicons name="hand-left-outline" size={16} color="#666" />
              <Text className="text-gray-700 ml-2">Handling Charge</Text>
            </View>
            <View className="flex-row items-center">
              {isHandlingFree && <Text className="text-gray-400 line-through mr-2">₹{handlingCharge}</Text>}
              <Text className={isHandlingFree ? "text-green-600 font-semibold" : "text-gray-900"}>
                {isHandlingFree ? "Free" : `₹${handlingCharge}`}
              </Text>
            </View>
          </View>

          {/* Separator */}
          <View className="h-px bg-gray-300 my-3" />

          {/* Total Savings */}
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center">
              <Ionicons name="pricetag" size={16} color="#16a34a" />
              <Text className="text-green-600 font-semibold ml-2">Total Savings ({totalSavingsPercent}%)</Text>
            </View>
            <Text className="text-green-600 font-bold">- ₹{totalSavings.toFixed(2)}</Text>
          </View>

          {/* Separator */}
          <View className="h-px bg-gray-400 my-3" />

          {/* Final Amount */}
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <Ionicons name="card" size={16} color="#666" />
              <Text className="text-gray-900 font-bold text-base ml-2">To Pay ({cart.length})</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-gray-400 line-through mr-2 text-sm">₹{itemsSubtotal.toFixed(2)}</Text>
              <Text className="text-gray-900 font-bold text-base">₹{finalAmount.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Checkout Bar */}
      <View style={{
        position: 'absolute',
        left: 0,
        right: 0,
        // place the bar above the device bottom inset + extra spacing
        bottom: bottomOffset,
      }} className="bg-white border-t border-gray-200 px-4 py-4">
        <TouchableOpacity
          onPress={() => {
            // clear local cart and trigger server clear in background
            clearCart();
            Alert.alert("Order placed", "Your order has been placed and the cart is cleared.", [
              { text: 'OK', onPress: () => router.push('/shop') }
            ]);
          }}
          className="bg-green-700 rounded-full py-4 px-6 flex-row items-center justify-between"
          activeOpacity={0.8}
        >
          <Text className="text-white font-bold text-base">Place Order</Text>
          <View className="flex-row items-center">
            <Text className="text-white font-bold text-base mr-2">
              ₹{finalAmount.toFixed(2)}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
