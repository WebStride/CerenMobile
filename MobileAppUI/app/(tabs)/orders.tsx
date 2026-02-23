import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router"; // Import useRouter
import { useFocusEffect } from "@react-navigation/native";
import { getOrders, getOrderItems } from "../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import GuestScreen from "@/components/GuestScreen";
import { isGuestSession } from "@/utils/session";
import { useCart } from "../context/CartContext";

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

type OrderAgainItem = {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  productUnits: number;
  unitsOfMeasurement: string;
  image: string;
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
  const { cart, addToCart } = useCart();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<UiOrder[]>([]);
  const [isGuest, setIsGuest] = useState<boolean | null>(null);
  const [showOrderAgainPopup, setShowOrderAgainPopup] = useState(false);
  const [orderAgainItems, setOrderAgainItems] = useState<OrderAgainItem[]>([]);
  const [isOrderAgainPreviewLoading, setIsOrderAgainPreviewLoading] = useState(false);

  React.useEffect(() => {
    const loadGuestState = async () => {
      const guest = await isGuestSession();
      setIsGuest(guest);
    };

    loadGuestState();
  }, []);

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
    if (isGuest !== false) {
      setOrders([]);
      setError(null);
      return;
    }

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
  }, [isGuest]);

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
    try {
      setIsOrderAgainPreviewLoading(true);
      const orderItemsResponse = await getOrderItems(Number(orderId));
      
      if (!orderItemsResponse || !orderItemsResponse.orderItems || orderItemsResponse.orderItems.length === 0) {
        Alert.alert('Error', 'No products found in this order.');
        return;
      }

      const selectedStoreId = await AsyncStorage.getItem('selectedStoreId');
      if (!selectedStoreId) {
        Alert.alert('Error', 'Please select a store before using Order Again.');
        return;
      }

      const itemsForPreview: OrderAgainItem[] = orderItemsResponse.orderItems
        .map((item: any) => {
          const quantity = Number(item.OrderQty ?? item.SaleQty ?? 0);
          return {
            productId: Number(item.ProductID),
            productName: item.ProductName || `Product ${item.ProductID}`,
            quantity,
            price: Number(item.Price ?? 0),
            image: item.ProductImage || '',
            productUnits: Number(item.ProductUnits ?? 1),
            unitsOfMeasurement: item.UnitsOfMeasurement || 'pcs',
          };
        })
        .filter((item: OrderAgainItem) => item.quantity > 0);

      if (!itemsForPreview.length) {
        Alert.alert('Error', 'No valid products found in this order.');
        return;
      }

      setOrderAgainItems(itemsForPreview);
      setShowOrderAgainPopup(true);
    } catch (error) {
      console.error('Error preparing order again preview:', error);
      Alert.alert(
        'Error',
        'Failed to load ordered products. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsOrderAgainPreviewLoading(false);
    }
  };

  const confirmOrderAgain = () => {
    try {
      let totalAddedQuantity = 0;
      let skippedExistingCount = 0;

      for (const item of orderAgainItems) {
        const alreadyInCart = cart.some((cartItem) => cartItem.productId === item.productId);
        if (alreadyInCart) {
          skippedExistingCount += 1;
          continue;
        }

        addToCart(
          {
            productId: item.productId,
            productName: item.productName,
            price: item.price,
            image: item.image,
            productUnits: item.productUnits,
            unitsOfMeasurement: item.unitsOfMeasurement,
          },
          item.quantity
        );

        totalAddedQuantity += item.quantity;
      }

      setShowOrderAgainPopup(false);
      setOrderAgainItems([]);

      if (totalAddedQuantity > 0) {
        router.push('/(tabs)/cart');
      } else {
        Alert.alert(
          'No New Items Added',
          skippedExistingCount > 0
            ? 'All products from this order already exist in your cart. Existing quantities were not changed.'
            : 'No valid products found to add to cart.'
        );
      }
    } catch (error) {
      console.error('Error adding ordered products to cart:', error);
      Alert.alert(
        'Error',
        'Failed to add products to cart. Please try again.',
        [{ text: 'OK' }]
      );
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

  // Show guest screen if guest or still checking
  if (isGuest === null || isGuest === true) {
    return (
      <GuestScreen
        isGuest={isGuest}
        title="Orders"
        icon="receipt-outline"
        message="Please login to view and manage your orders."
        showBackButton={false}
      />
    );
  }

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

      <Modal
        visible={showOrderAgainPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOrderAgainPopup(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          justifyContent: 'center',
          paddingHorizontal: 20,
        }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            maxHeight: '75%',
            padding: 16,
          }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 }}>
              Order Again
            </Text>
            <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
              The following products will be added to your cart with the same quantities.
            </Text>

            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              {orderAgainItems.map((item) => (
                <View
                  key={`${item.productId}-${item.productName}`}
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: '#F3F4F6',
                    paddingVertical: 10,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }} numberOfLines={2}>
                      {item.productName}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                      ₹{item.price.toFixed(2)}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#15803d' }}>
                    x{item.quantity}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowOrderAgainPopup(false);
                  setOrderAgainItems([]);
                }}
                style={{
                  flex: 1,
                  marginRight: 8,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#374151', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmOrderAgain}
                style={{
                  flex: 1,
                  marginLeft: 8,
                  backgroundColor: '#BCD042',
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {isOrderAgainPreviewLoading && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255,255,255,0.4)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#374151', fontWeight: '600' }}>Loading order items...</Text>
        </View>
      )}
    </View>
  );
}
