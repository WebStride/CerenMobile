import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getOrderItems, getDefaultAddress, placeOrder } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Placeholder image for loading state
const placeholderImage = require('../../assets/images/Banana.png');

// Blurhash for smooth placeholder (light gray)
const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

// Types
// Types from API
interface ApiOrderItem {
  OrderItemID: number;
  OrderID: number;
  ProductID: number;
  OrderQty?: number;
  SaleQty?: number;
  Price: number;
  DeliveryLineID?: number;
  OrderItemStatus?: string | null;
  Comments?: string | null;
  ProductName?: string | null;
  ProductImage?: string | null;
}

interface ApiOrderItemsResponse {
  success?: boolean;
  orderItems: ApiOrderItem[];
}

interface OrderItem {
  id: string;
  productId: number;
  quantity: number;
  price: number;
  status?: string | null;
  comments?: string | null;
  productName?: string | null;
  productImage?: string | null;
}

const OrderDetailScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId, orderNumber, orderStatus, orderDate: routeOrderDate, deliveryDate: routeDeliveryDate, amount: routeAmount } = useLocalSearchParams();

  const [loading, setLoading] = useState<boolean>(true);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [defaultAddress, setDefaultAddress] = useState<any>(null);
  const [showOrderAgainModal, setShowOrderAgainModal] = useState(false);
  const [reorderDate, setReorderDate] = useState(new Date());
  const [showReorderDatePicker, setShowReorderDatePicker] = useState(false);
  const [isPlacingReorder, setIsPlacingReorder] = useState(false);

  // Debug: Log route parameters
  console.log('📋 Route Params:', { orderId, orderNumber, orderStatus, routeOrderDate, routeDeliveryDate });

  useEffect(() => {

    let mounted = true;
    const id = Number(orderId);
    if (!id) {
      setError('Invalid order id');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res: ApiOrderItemsResponse = await getOrderItems(id) as ApiOrderItemsResponse;
        console.log("coming as params",routeOrderDate, routeDeliveryDate);
        if (!mounted) return;
        console.log('API response for order items:', res);
        if (res && Array.isArray((res as any).orderItems) && (res as any).orderItems.length > 0) {
          try {
            console.log('Raw first orderItem JSON:', JSON.stringify((res as any).orderItems[0]));
            console.log('Raw orderItem keys:', Object.keys((res as any).orderItems[0]));
          } catch (e) {
            console.warn('Could not stringify orderItems[0]', e);
          }
        }
        if (!res || !res.orderItems) {
          setOrderItems([]);
          setError('No items found for this order');
        } else {
          const mapped: OrderItem[] = res.orderItems.map((ai) => ({
            id: String(ai.OrderItemID),
            productId: ai.ProductID,
            quantity: Number(ai.OrderQty ?? ai.SaleQty ?? 0),
            price: Number(ai.Price ?? 0),
            status: ai.OrderItemStatus ?? null,
            comments: ai.Comments ?? null,
            productName: ai.ProductName ?? null,
            productImage: ai.ProductImage ?? null,
          }));
          setOrderItems(mapped);
          console.log('Mapped order items (UI):', mapped);
          mapped.forEach(mi => {
            console.log(`OrderItem ${mi.id} -> productName: ${mi.productName}, productImage: ${mi.productImage}`);
          });
        }
      } catch (err) {
        console.error('Error loading order items:', err);
        setError('Failed to load order items');
      } finally {
        setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [orderId]);

  // Fetch default delivery address
  useEffect(() => {
    const fetchDefaultAddress = async () => {
      try {
        console.log('📍 Fetching default address...');
        const response = await getDefaultAddress();
        console.log('📍 Default address response:', JSON.stringify(response, null, 2));
        if (response.success && response.address) {
          console.log('✅ Default address fetched:', response.address);
          setDefaultAddress(response.address);
        } else {
          console.log('⚠️ No default address found or API returned unsuccessful');
          setDefaultAddress('not_found');
        }
      } catch (err) {
        console.error('❌ Error fetching default address:', err);
        setDefaultAddress('error');
      }
    };
    fetchDefaultAddress();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Ionicons name="hourglass-outline" size={48} color="#9CA3AF" />
        <Text className="text-lg text-gray-500 mt-3">Loading order items...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-white p-6">
        <Ionicons name="alert-circle" size={48} color="#F87171" />
        <Text className="text-lg text-gray-600 mt-3">{error}</Text>
        <TouchableOpacity 
          onPress={() => router.back()}
          className="mt-4 bg-green-600 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Download invoice removed per UI requirement

  const ItemRow = ({ item }: { item: OrderItem }) => (
    <View className="py-3 border-b border-gray-100">
      <View className="flex-row justify-between items-center">
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image 
            source={item.productImage ? { uri: item.productImage } : placeholderImage}
            placeholder={blurhash}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            style={{ width: 64, height: 64, borderRadius: 8, marginRight: 12, backgroundColor: '#f3f4f6' }} 
          />
          <View>
            <Text className="text-base font-semibold text-gray-900">{item.productName ?? 'Unknown Product'}</Text>
            <Text className="text-sm text-gray-500">Qty: {item.quantity}</Text>
            {item.status ? (
              <Text className="text-sm text-gray-500">Status: {item.status}</Text>
            ) : null}
            {item.comments ? (
              <Text className="text-sm text-gray-400 italic">{item.comments}</Text>
            ) : null}
          </View>
        </View>
        <Text className="text-lg font-bold text-gray-900">₹{item.price.toFixed(2)}</Text>
      </View>
    </View>
  );

  const DetailRow = ({ label, value, isLast = false }: {
    label: string;
    value: string | number;
    isLast?: boolean;
  }) => (
    <View className={`flex-row justify-between py-2 ${!isLast ? 'border-b border-gray-100' : ''}`}>
      <Text className="text-gray-600 text-sm font-medium">{label}</Text>
      <Text className="text-gray-900 text-sm font-semibold">
        {typeof value === 'number' ? `₹${value.toFixed(2)}` : value}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View 
        className="bg-white px-4 pb-4 shadow-sm border-b border-gray-200"
        style={{ paddingTop: insets.top + 16 }}
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="p-2 -ml-2"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          
          <Text className="text-xl font-bold text-gray-900">
            Order {orderNumber || `#${orderId}`}
          </Text>
          
          {/* Placeholder for balance */}
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Summary Section */}
        <View className="bg-white rounded-xl p-6 mb-4 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Order Summary
          </Text>
          
          <Text className="text-gray-600 text-sm mb-1">
            Arrived on —
          </Text>
          


          <Text className="text-base font-semibold text-gray-900 mb-3">
            {orderItems.length} items in this order
          </Text>

          {/* Items List */}
          {orderItems.map((item) => (
            <ItemRow 
              key={item.id}
              item={item}
            />
          ))}
        </View>

        {/* Order Details Section */}
        <View className="bg-white rounded-xl p-6 mb-4 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Order Details
          </Text>
          
          <DetailRow label="Order Number" value={orderNumber || `#${orderId}`} />
          <DetailRow label="Payment Amount" value={routeAmount ? `₹${Number(routeAmount).toFixed(2)}` : '--'} />
          <DetailRow label="Order Status" value={orderStatus ? String(orderStatus).replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'Unknown'} />
          <DetailRow label="Order Date" value={routeOrderDate && String(routeOrderDate).trim() ? new Date(routeOrderDate as string).toLocaleDateString() : '--'} />
          <DetailRow 
            label="Delivery Address" 
            value={
              defaultAddress === null 
                ? 'Loading...' 
                : defaultAddress === 'not_found' || defaultAddress === 'error'
                  ? 'No delivery address set'
                  : (() => {
                      const parts = [];
                      if (defaultAddress.HouseNumber) parts.push(defaultAddress.HouseNumber);
                      if (defaultAddress.BuildingBlock) parts.push(defaultAddress.BuildingBlock);
                      if (defaultAddress.Landmark) parts.push(defaultAddress.Landmark);
                      if (defaultAddress.City) parts.push(defaultAddress.City);
                      return parts.length > 0 ? parts.join(', ') : 'No address available';
                    })()
            }
            isLast={true}
          />
        </View>

        {/* Bill Details Section */}
        <View className="bg-white rounded-xl p-6 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Bill Details
          </Text>
          
          {/* compute totals from orderItems */}
          
          {/* Grand Total with emphasis */}
          <View className="pt-3 mt-3 border-t border-gray-200">
            <View className="flex-row justify-between items-center">
              <Text className="text-base font-bold text-gray-900">Grand Total</Text>
              <Text className="text-lg font-bold text-green-600">
                ₹{routeAmount ? Number(routeAmount).toFixed(2) : '0.00'}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3 mt-6 mb-6">
          <TouchableOpacity 
            className="flex-1 bg-green-600 py-4 rounded-xl items-center shadow-sm"
            activeOpacity={0.8}
            onPress={() => {
              setReorderDate(new Date());
              setShowOrderAgainModal(true);
            }}
          >
            <Text className="text-white font-semibold text-base">
              Order Again
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-1 bg-white border border-green-600 py-4 rounded-xl items-center shadow-sm"
            activeOpacity={0.8}
            onPress={() => {
              // Share or contact support
              console.log("Get help");
            }}
          >
            <Text className="text-green-600 font-semibold text-base">
              Get Help
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Order Again Modal */}
      <Modal
        visible={showOrderAgainModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOrderAgainModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 400,
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#111827',
              marginBottom: 8
            }}>Place Order Again</Text>
            
            <Text style={{
              fontSize: 14,
              color: '#6B7280',
              marginBottom: 20
            }}>Select a date for your new order</Text>

            {/* Date Selection */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#374151',
                marginBottom: 8
              }}>Order Date</Text>
              
              <TouchableOpacity
                onPress={() => setShowReorderDatePicker(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 12,
                  backgroundColor: '#F9FAFB',
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#E5E7EB'
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="calendar-outline" size={20} color="#15803d" />
                  <Text style={{
                    fontSize: 14,
                    color: '#111827',
                    fontWeight: '500',
                    marginLeft: 8
                  }}>
                    {reorderDate.toLocaleDateString('en-IN', { 
                      weekday: 'short',
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {showReorderDatePicker && (
              <DateTimePicker
                value={reorderDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowReorderDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setReorderDate(selectedDate);
                  }
                }}
              />
            )}

            {/* Order Summary */}
            <View style={{
              backgroundColor: '#F9FBEF',
              borderRadius: 8,
              padding: 12,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: '#BCD042'
            }}>
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: '#6B7280',
                marginBottom: 4
              }}>Reordering</Text>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#111827',
                marginBottom: 2
              }}>{orderNumber || `Order #${orderId}`}</Text>
              <Text style={{
                fontSize: 13,
                color: '#374151'
              }}>{orderItems.length} items • ₹{routeAmount ? Number(routeAmount).toFixed(2) : '0.00'}</Text>
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowOrderAgainModal(false);
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#F3F4F6',
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: 'center'
                }}
                disabled={isPlacingReorder}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#374151'
                }}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={async () => {
                  setIsPlacingReorder(true);
                  
                  try {
                    // Get customer info
                    const selectedStoreId = await AsyncStorage.getItem('selectedStoreId');
                    const customerName = await AsyncStorage.getItem('customerName') || 'Customer';
                    
                    if (!selectedStoreId) {
                      Alert.alert('Error', 'No store selected. Please select a store first.');
                      setIsPlacingReorder(false);
                      return;
                    }
                    
                    // Use existing order items
                    const orderItemsForApi = orderItems.map(item => ({
                      productId: item.productId,
                      productName: item.productName || `Product ${item.productId}`,
                      quantity: item.quantity,
                      price: item.price,
                    }));
                    
                    // Format order date as YYYY-MM-DD
                    const formattedOrderDate = reorderDate.toISOString().split('T')[0];
                    
                    // Place the order
                    const result = await placeOrder(
                      Number(selectedStoreId),
                      customerName,
                      orderItemsForApi,
                      formattedOrderDate
                    );
                    
                    if (result.success) {
                      setShowOrderAgainModal(false);
                      
                      Alert.alert(
                        'Success',
                        'Your order has been placed successfully!',
                        [
                          { 
                            text: 'OK', 
                            onPress: () => {
                              router.push('/(tabs)/orders');
                            }
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
                    console.error('Error placing reorder:', error);
                    Alert.alert(
                      'Error',
                      'An unexpected error occurred. Please try again.',
                      [{ text: 'OK' }]
                    );
                  } finally {
                    setIsPlacingReorder(false);
                  }
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#15803d',
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  opacity: isPlacingReorder ? 0.6 : 1
                }}
                disabled={isPlacingReorder}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: 'white'
                }}>{isPlacingReorder ? 'Placing...' : 'Confirm Order'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default OrderDetailScreen;