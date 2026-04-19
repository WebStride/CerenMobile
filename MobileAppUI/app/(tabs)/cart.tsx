import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, TextInput, Modal, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useCart } from "../context/CartContext";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { checkCustomerExists, placeOrder } from "../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import GuestScreen from "@/components/GuestScreen";
import { isGuestSession } from "@/utils/session";

const defaultImage = require("../../assets/images/Banana.png");

// Blurhash for smooth placeholder (light gray)
const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';
const CART_FOCUS_REFRESH_COOLDOWN_MS = 60_000;

// ---------------------------------------------------------------------------
// Self-contained quantity editor for each cart row.
// By living in its own component it has truly local state, so there are zero
// stale-closure or controlled-input-race issues when typing freely.
// ---------------------------------------------------------------------------
interface CartItemQuantityInputProps {
  item: { productId: number; productName: string; quantity: number; minOrderQuantity?: number };
  onIncrease: (productId: number) => void;
  onDecrease: (productId: number) => void;
  onSetQuantity: (productId: number, qty: number) => void;
}

function CartItemQuantityInput({ item, onIncrease, onDecrease, onSetQuantity }: CartItemQuantityInputProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editInputVal, setEditInputVal] = useState('');

  const minQty = item.minOrderQuantity || 1;

  const openEdit = () => {
    setEditInputVal(String(item.quantity));
    setShowEditModal(true);
  };

  const handleConfirm = () => {
    const numVal = parseInt(editInputVal, 10);

    if (isNaN(numVal) || numVal === 0) {
      Alert.alert(
        'Invalid Quantity',
        `Please enter a valid quantity. Minimum order quantity for ${item.productName} is ${minQty}. Use the ✕ button to remove the item.`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (numVal < minQty) {
      Alert.alert(
        'Minimum Order Quantity',
        `Minimum order quantity for ${item.productName} is ${minQty}.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setShowEditModal(false);
    if (numVal !== item.quantity) {
      onSetQuantity(item.productId, numVal);
    }
  };

  const handleCancel = () => {
    setShowEditModal(false);
    setEditInputVal('');
  };

  return (
    <>
      <View className="flex-row items-center mt-3 rounded-full bg-green-700 px-1 py-1 self-start">
        {/* Decrease button */}
        <TouchableOpacity
          onPress={() => {
            if (item.quantity <= minQty) {
              Alert.alert(
                'Minimum Order Quantity',
                `Cannot decrease below minimum order quantity of ${minQty}. Use the ✕ button to remove this item.`,
                [{ text: 'OK' }]
              );
              return;
            }
            onDecrease(item.productId);
          }}
          className="w-8 h-8 rounded-full items-center justify-center"
        >
          <Ionicons name="remove" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Quantity — tap to edit */}
        <TouchableOpacity
          onPress={openEdit}
          className="mx-2 min-w-[40px] items-center justify-center"
        >
          <Text style={{ fontSize: 16, color: 'white', fontWeight: 'bold', textAlign: 'center', minWidth: 40 }}>
            {item.quantity}
          </Text>
        </TouchableOpacity>

        {/* Increase button */}
        <TouchableOpacity
          onPress={() => onIncrease(item.productId)}
          className="w-8 h-8 rounded-full items-center justify-center"
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Edit quantity modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={handleCancel}
        >
          {/* Inner card — stop tap propagation */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 24,
              width: 280,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 }}>
              Update Quantity
            </Text>
            <Text style={{ fontSize: 13, color: '#666', marginBottom: 16 }} numberOfLines={2}>
              {item.productName}
            </Text>
            {minQty > 1 && (
              <Text style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                Minimum order: {minQty}
              </Text>
            )}
            <TextInput
              value={editInputVal}
              onChangeText={val => setEditInputVal(val.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={handleConfirm}
              autoFocus
              selectTextOnFocus
              style={{
                borderWidth: 1.5,
                borderColor: '#15803d',
                borderRadius: 8,
                padding: 12,
                fontSize: 22,
                fontWeight: 'bold',
                textAlign: 'center',
                color: '#1a1a1a',
                marginBottom: 20,
              }}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={handleCancel}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 15, color: '#666', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirm}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: '#15803d',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 15, color: '#fff', fontWeight: '700' }}>Update</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
// ---------------------------------------------------------------------------

export default function CartScreen() {
  const router = useRouter();
  const { cart, increaseQuantity, decreaseQuantity, setQuantity, removeFromCart, cartTotal, clearCart, refreshCart } = useCart();
  const insets = useSafeAreaInsets();
  const [isCustomerExists, setIsCustomerExists] = useState<boolean | null>(null);
  const [hasStore, setHasStore] = useState<boolean | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderDate, setOrderDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isGuest, setIsGuest] = useState<boolean | null>(null);
  const lastFocusedStoreIdRef = useRef<string | null>(null);
  const lastCartSyncAtRef = useRef(0);
  
  // Refresh the cart on first entry, when the selected store changes, or after a cooldown.
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const syncCartIfNeeded = async () => {
        if (isGuest !== false) {
          return;
        }

        const selectedStoreId = await AsyncStorage.getItem('selectedStoreId');
        if (!isActive) {
          return;
        }

        const storeChanged = selectedStoreId !== lastFocusedStoreIdRef.current;
        const wasSyncedRecently =
          lastCartSyncAtRef.current > 0 &&
          Date.now() - lastCartSyncAtRef.current < CART_FOCUS_REFRESH_COOLDOWN_MS;

        if (!storeChanged && wasSyncedRecently) {
          return;
        }

        await refreshCart();
        if (!isActive) {
          return;
        }

        lastFocusedStoreIdRef.current = selectedStoreId;
        lastCartSyncAtRef.current = Date.now();
      };

      syncCartIfNeeded().catch((error) => {
        console.error('Error syncing cart on focus:', error);
      });

      return () => {
        isActive = false;
      };
    }, [isGuest, refreshCart])
  );

  // Check customer existence and store registration when component mounts
  useEffect(() => {
    const checkCustomer = async () => {
      try {
        const guest = await isGuestSession();
        setIsGuest(guest);
        if (guest) {
          return;
        }

        // Check if user has a store selected (registered store)
        const storeId = await AsyncStorage.getItem('selectedStoreId');
        setHasStore(!!storeId);

        const response = await checkCustomerExists();
        const isRegistered = response.success ? response.exists : false;
        setIsCustomerExists(isRegistered);
      } catch (error) {
        console.error("Error checking customer existence:", error);
        setIsCustomerExists(false);
        setHasStore(false);
      }
    };
    
    checkCustomer();
  }, [router]);

  // Show guest screen if guest or still checking
  const guestScreen = (
    <GuestScreen
      isGuest={isGuest}
      title="Cart"
      icon="cart-outline"
      message="Please login to access your cart and place orders."
      showBackButton={false}
    />
  );

  if (isGuest === null || isGuest === true) {
    return guestScreen;
  }
  
  // height we'll reserve for the checkout bar (approximate)
  const checkoutBarHeight = 72; // px
  // ensure an extra gap above system navigation / gesture bar
  const bottomOffset = (insets.bottom || 0) + 50;

  // Calculate bill details
  const finalAmount = cartTotal;

  // Don't render cart content if user has no store registered (Price on Request users)
  if (isCustomerExists === false || hasStore === false) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        {/* Header */}
        <View className="px-4 py-3 border-b border-gray-100">
          <Text className="text-xl font-bold text-center text-gray-900">My Cart</Text>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="storefront-outline" size={72} color="#F59E0B" />
          <Text className="text-xl font-bold mt-5 text-gray-900 text-center">
            Store Not Registered
          </Text>
          <Text className="text-gray-500 mt-2 text-center text-base leading-6">
            Please contact Admin / Customer Care to register your store and start placing orders.
          </Text>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/(tabs)/account', params: { openContact: 'true' } })}
            className="bg-[#53B175] px-8 py-3.5 rounded-full mt-6 flex-row items-center"
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubbles-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text className="text-white font-semibold text-base">Contact Customer Care</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading state while checking registration
  if (isCustomerExists === null || hasStore === null) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#15803D" />
          <Text className="text-gray-500 mt-3">Loading Cart</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!cart.length) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
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

  const handleConfirmOrderDate = (selectedDate: Date) => {
    setOrderDate(selectedDate);
    setShowDatePicker(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
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
          {cart.map((item, index) => {
            return (
            <View key={item.productId}>
              <View className="flex-row items-center py-4">
                {/* Product Image */}
                <View className="mr-3">
                  <Image 
                    source={item.image ? (typeof item.image === 'string' ? { uri: item.image } : item.image) : defaultImage}
                    placeholder={blurhash}
                    contentFit="contain"
                    transition={200}
                    cachePolicy="memory-disk"
                    style={{ width: 64, height: 64, backgroundColor: '#f3f4f6' }}
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
                  <CartItemQuantityInput
                    item={item}
                    onIncrease={increaseQuantity}
                    onDecrease={decreaseQuantity}
                    onSetQuantity={setQuantity}
                  />
                  
                  {/* Min Order Quantity hint */}
                  {(item.minOrderQuantity && item.minOrderQuantity > 1) ? (
                    <Text className="text-xs text-gray-400 mt-1 ml-1">Min qty: {item.minOrderQuantity}</Text>
                  ) : null}
                </View>
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
          )})}
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

        {/* Order Date Selection */}
        <View className="mx-4 mb-4 bg-white rounded-lg border border-gray-200 p-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">Select Order Date</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="flex-row items-center justify-between py-3 px-4 bg-gray-50 rounded-lg border border-gray-300"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={20} color="#16a34a" />
              <Text className="text-gray-900 font-semibold ml-3">
                {orderDate.toLocaleDateString('en-IN', { 
                  weekday: 'short',
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          <Text className="text-xs text-gray-500 mt-2 ml-1">Select your preferred order date</Text>
        </View>

        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          date={orderDate}
          minimumDate={new Date()}
          onConfirm={handleConfirmOrderDate}
          onCancel={() => setShowDatePicker(false)}
        />

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

          {/* Subtotal / Final Amount */}
          <View className="flex-row justify-between items-center my-2">
            <View className="flex-row items-center">
              <Ionicons name="receipt-outline" size={16} color="#666" />
              <Text className="text-gray-900 font-semibold text-lg ml-2">Total</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-gray-900 font-bold text-lg">₹{finalAmount.toFixed(2)}</Text>
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
          onPress={async () => {
            if (isPlacingOrder) return;
            
            // Validate minimum order quantities before placing order
            const moqViolations = cart.filter(item => {
              const minQty = item.minOrderQuantity || 1;
              return item.quantity < minQty;
            });
            
            if (moqViolations.length > 0) {
              const violationList = moqViolations
                .map(item => `• ${item.productName}: min ${item.minOrderQuantity || 1}, have ${item.quantity}`)
                .join('\n');
              Alert.alert(
                'Minimum Order Quantity Not Met',
                `The following items don't meet the minimum order quantity:\n\n${violationList}\n\nPlease adjust quantities before placing the order.`,
                [{ text: 'OK' }]
              );
              return;
            }
            
            setIsPlacingOrder(true);
            
            try {
              // Get customer info from AsyncStorage
              const selectedStoreId = await AsyncStorage.getItem('selectedStoreId');
              const customerName = await AsyncStorage.getItem('customerName') || 'Customer';
              
              if (!selectedStoreId) {
                Alert.alert('Error', 'No store selected. Please select a store first.');
                setIsPlacingOrder(false);
                return;
              }

              // Prepare order items from cart
              const orderItems = cart.map(item => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                price: item.price,
              }));

              // Format order date as YYYY-MM-DD
              const formattedOrderDate = orderDate.toISOString().split('T')[0];

              // Place order via external API
              const result = await placeOrder(
                Number(selectedStoreId),
                customerName,
                orderItems,
                formattedOrderDate
              );

              if (result.success) {
                // Clear cart on success
                clearCart();
                
                Alert.alert(
                  'Success',
                  'Your order has been placed successfully!',
                  [
                    { 
                      text: 'OK', 
                      onPress: () => router.push('/(tabs)/shop') 
                    }
                  ]
                );
              } else {
                Alert.alert(
                  'Order Failed',
                  result.message || 'Failed to place order. Please try again.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              console.error('Error placing order:', error);
              Alert.alert(
                'Error',
                'An unexpected error occurred. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsPlacingOrder(false);
            }
          }}
          className="bg-green-700 rounded-full py-4 px-6 flex-row items-center justify-between"
          activeOpacity={0.8}
          disabled={isPlacingOrder}
          style={{ opacity: isPlacingOrder ? 0.6 : 1 }}
        >
          <Text className="text-white font-bold text-base">
            {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
          </Text>
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
