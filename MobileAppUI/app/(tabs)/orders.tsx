import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router"; // Import useRouter
import { useFocusEffect } from "@react-navigation/native";
import { getOrders, getOrderItems, placeOrder } from "../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Local UI order shape
type UiOrder = {
  id: string;
  orderNumber?: string;
  itemCount?: number;
  status: string;
  amount: number;
  orderDate?: string;
  deliveryDate?: string | null;
  rawOrderDate?: string;
  rawDeliveryDate?: string | null;
};

// We'll fetch orders from API and map them to UiOrder
const OrderCard = ({ order, onOrderAgain, onViewDetails }: {
  order: UiOrder;
  onOrderAgain: (orderId: string) => void;
  onViewDetails: (order: UiOrder) => void;
}) => {
  const getStatusConfig = () => {
    // Show the actual status from backend
    const raw = (order.status ?? '').toString();
    const key = raw.trim().toLowerCase();

    // Format the display text
    const label = raw ? raw.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'Unknown Status';

    // Assign colors and icons based on status
    if (key === 'completed') {
      return { text: label, icon: 'checkmark-circle', iconColor: '#22C55E', bgColor: '#F0FDF4' };
    }
    if (key === 'created') {
      return { text: label, icon: 'time', iconColor: '#3B82F6', bgColor: '#EFF6FF' };
    }
    if (key === 'cancelled' || key === 'canceled') {
      return { text: label, icon: 'close-circle', iconColor: '#6B7280', bgColor: '#F9FAFB' };
    }
    if (key === 'failed') {
      return { text: label, icon: 'close-circle', iconColor: '#EF4444', bgColor: '#FEF2F2' };
    }

    // Default for any other status
    return { text: label, icon: 'help-circle', iconColor: '#6B7280', bgColor: '#F9FAFB' };
  };

  const statusConfig = getStatusConfig();

  return (
    <View className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-semibold text-gray-900">{order.orderNumber ? `Order ${order.orderNumber}` : `Order #${order.id}`}</Text>
        <View className={`flex-row items-center px-3 py-1 rounded-full ${statusConfig.bgColor}`}>
          <Ionicons name={statusConfig.icon as any} size={16} color={statusConfig.iconColor} />
          <Text className={`ml-1 text-sm font-medium ${statusConfig.iconColor === '#22C55E' ? 'text-green-700' : statusConfig.iconColor === '#EF4444' ? 'text-red-700' : statusConfig.iconColor === '#F59E0B' ? 'text-yellow-700' : 'text-gray-700'}`}>
            {statusConfig.text}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center mb-3">
        <View className="flex-1">
          <Text className="text-sm text-gray-500">{order.itemCount ?? 0} items • {order.orderDate}</Text>
        </View>
        <View className="items-end ml-4">
          <Text className="text-sm text-gray-600">Total</Text>
          <Text className="text-lg font-bold text-gray-900">₹{Number(order.amount ?? 0).toFixed(2)}</Text>
        </View>
      </View>

      <View className="border-t border-gray-200 pt-3">
        <Text className="text-sm text-gray-600 mb-2">
          Placed: {order.orderDate}
          {order.deliveryDate && ` • Delivered: ${order.deliveryDate}`}
        </Text>

        <View className="flex-row space-x-2">
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: '#15803d', // green-700
              borderRadius: 25,
              paddingVertical: 10,
              alignItems: 'center',
              justifyContent: 'center',
              height: 40,
              marginRight: 8,
            }}
            onPress={() => onViewDetails(order)}
            activeOpacity={0.8}
          >
            <Text style={{
              color: 'white',
              fontWeight: '600',
              fontSize: 14
            }}>View Details</Text>
          </TouchableOpacity>
          {order.status.toLowerCase() === 'completed' && (
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#15803d', // green-700
                borderRadius: 25,
                paddingVertical: 10,
                alignItems: 'center',
                justifyContent: 'center',
                height: 40,
              }}
              onPress={() => onOrderAgain(order.id)}
              activeOpacity={0.8}
            >
              <Text style={{
                color: 'white',
                fontWeight: '600',
                fontSize: 14
              }}>Order Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const FilterButton = ({ title, isActive, onPress }: { title: string; isActive: boolean; onPress: () => void }) => (
  <TouchableOpacity
    style={{
      backgroundColor: isActive ? '#15803d' : '#f3f4f6', // green-700 or gray-100
      borderRadius: 25,
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginRight: 8,
      alignItems: 'center',
      justifyContent: 'center',
    }}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={{
      color: isActive ? 'white' : '#374151', // white or gray-700
      fontWeight: '500',
      fontSize: 14
    }}>
      {title}
    </Text>
  </TouchableOpacity>
);

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<UiOrder[]>([]);
  const [showOrderAgainModal, setShowOrderAgainModal] = useState(false);
  const [selectedOrderForReorder, setSelectedOrderForReorder] = useState<UiOrder | null>(null);
  const [reorderDate, setReorderDate] = useState(new Date());
  const [showReorderDatePicker, setShowReorderDatePicker] = useState(false);
  const [isPlacingReorder, setIsPlacingReorder] = useState(false);

  const filterOptions = [
    { key: 'all', label: 'All' },
    { key: 'created', label: 'Created' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'completed', label: 'Completed' },
  ];

    // Build counts from fetched orders using raw status keys
    const counts = orders.reduce((acc, order) => {
      const s = order.status.toLowerCase();
      acc[s as keyof typeof acc] = (acc[s as keyof typeof acc] || 0) + 1;
      acc.all = (acc.all || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const filteredOrders = selectedFilter === 'all' ? orders : orders.filter(order => order.status.toLowerCase() === selectedFilter);
  const [refreshing, setRefreshing] = useState(false);

  // Extracted load function as a reusable callback
  const loadOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      // Get the selected store's customerId from AsyncStorage
      const selectedStoreId = await AsyncStorage.getItem('selectedStoreId');
      const customerId = selectedStoreId ? Number(selectedStoreId) : undefined;
      
      console.log('📦 Fetching orders for customerId:', customerId);
      
      if (!customerId) {
        setError('No store selected. Please select a store first.');
        setOrders([]);
        return;
      }
      
      const res = await getOrders(customerId);
      if (res && Array.isArray(res.orders)) {
        const mapped = res.orders.map((o: any) => {
          // Use raw status from backend
          const rawStatus = (o.OrderStatus ?? o.orderStatus ?? o.Status ?? o.status ?? o.OrderStatusText ?? '').toString();

          return {
            id: String(o.OrderID),
            orderNumber: o.OrderNumber ?? `Order ${o.OrderID}`,
            itemCount: Number(o.OrderItemCount ?? 0),
            status: rawStatus,
            amount: Number(o.EstimateOrderAmount ?? 0),
            orderDate: o.OrderDate ? new Date(o.OrderDate).toLocaleDateString() : undefined,
            deliveryDate: o.DateDelivered ?? null,
            rawOrderDate: o.OrderDate,
            rawDeliveryDate: o.DateDelivered,
          } as UiOrder;
        });
        setOrders(mapped);
      } else {
        setOrders([]);
      }
    } catch (err:any) {
      setError(err?.message || 'Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Use useFocusEffect to reload orders whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    loadOrders(true);
  }, [loadOrders]);

  const handleOrderAgain = async (orderId: string) => {
    console.log("Order again for:", orderId);
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrderForReorder(order);
      setReorderDate(new Date());
      setShowOrderAgainModal(true);
    }
  };

  const confirmReorder = async () => {
    if (!selectedOrderForReorder) return;
    
    setIsPlacingReorder(true);
    
    try {
      // Fetch order items for the selected order
      const orderItemsResponse = await getOrderItems(Number(selectedOrderForReorder.id));
      
      if (!orderItemsResponse || !orderItemsResponse.orderItems || orderItemsResponse.orderItems.length === 0) {
        Alert.alert('Error', 'Failed to fetch order items. Please try again.');
        setIsPlacingReorder(false);
        return;
      }
      
      // Get customer info
      const selectedStoreId = await AsyncStorage.getItem('selectedStoreId');
      const customerName = await AsyncStorage.getItem('customerName') || 'Customer';
      
      if (!selectedStoreId) {
        Alert.alert('Error', 'No store selected. Please select a store first.');
        setIsPlacingReorder(false);
        return;
      }
      
      // Map order items to the format expected by placeOrder API
      const orderItems = orderItemsResponse.orderItems.map((item: any) => ({
        productId: item.ProductID,
        productName: item.ProductName || `Product ${item.ProductID}`,
        quantity: Number(item.OrderQty ?? item.SaleQty ?? 0),
        price: Number(item.Price ?? 0),
      }));
      
      // Format order date as YYYY-MM-DD
      const formattedOrderDate = reorderDate.toISOString().split('T')[0];
      
      // Place the order
      const result = await placeOrder(
        Number(selectedStoreId),
        customerName,
        orderItems,
        formattedOrderDate
      );
      
      if (result.success) {
        setShowOrderAgainModal(false);
        setSelectedOrderForReorder(null);
        
        Alert.alert(
          'Success',
          'Your order has been placed successfully!',
          [
            { 
              text: 'OK', 
              onPress: () => {
                // Refresh orders list
                loadOrders();
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
  };

  const handleViewDetails = (order: UiOrder) => {
    console.log('🔍 Navigating to order details with params:', { 
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      orderDate: order.rawOrderDate,
      deliveryDate: order.rawDeliveryDate,
      amount: order.amount
    });
    router.push({
      pathname: '/orders/[orderId]',
      params: { 
        orderId: order.id,
        orderNumber: order.orderNumber ?? '',
        orderStatus: order.status ?? '',
        orderDate: order.rawOrderDate ?? '',
        deliveryDate: order.rawDeliveryDate ?? '',
        amount: String(order.amount ?? 0)
      }
    });
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View 
        className="bg-white px-4 pb-4 shadow-sm"
        style={{ paddingTop: insets.top + 16 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-gray-900">
            My Orders
          </Text>
          <TouchableOpacity className="p-2">
            <Ionicons name="search-outline" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="flex-row"
        >
          {filterOptions.map((option) => (
            <FilterButton
              key={option.key}
              title={`${option.label} (${counts[option.key as keyof typeof counts] || 0})`}
              isActive={selectedFilter === option.key}
              onPress={() => setSelectedFilter(option.key)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Orders List */}
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#10B981']}
            tintColor="#10B981"
          />
        }
      >
        {loading ? (
          <View className="py-20 items-center">
            <Text className="text-gray-500">Loading orders...</Text>
          </View>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onOrderAgain={handleOrderAgain}
              onViewDetails={handleViewDetails}
            />
          ))
        ) : (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
            <Text className="text-xl font-medium text-gray-500 mt-4 mb-2">
              No orders found
            </Text>
            <Text className="text-gray-400 text-center px-8">
              {error ? error : (selectedFilter === "all" 
                ? "You haven't placed any orders yet" 
                : `No ${selectedFilter} orders found`)}
            </Text>
          </View>
        )}
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
            {selectedOrderForReorder && (
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
                }}>Original Order</Text>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: 2
                }}>{selectedOrderForReorder.orderNumber}</Text>
                <Text style={{
                  fontSize: 13,
                  color: '#374151'
                }}>{selectedOrderForReorder.itemCount} items • ₹{Number(selectedOrderForReorder.amount ?? 0).toFixed(2)}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowOrderAgainModal(false);
                  setSelectedOrderForReorder(null);
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
                onPress={confirmReorder}
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
}
