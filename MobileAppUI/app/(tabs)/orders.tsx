import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router"; // Import useRouter
import { useFocusEffect } from "@react-navigation/native";
import { getOrders } from "../../services/api";
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
    // order.status might be a canonical key (delivered/cancelled/confirmed/failed)
    // or an arbitrary string coming from the API. We'll map common variants
    // to canonical keys but if it's an unknown label, show the raw status text.
    const raw = (order.status ?? '').toString();
    const key = raw.trim().toLowerCase();

    // Map known variants to canonical keys
    const canonicalMap: Record<string, string> = {
      'delivered': 'delivered',
      'del': 'delivered',
      'completed': 'delivered',
      'confirmed': 'confirmed',
      'confirmed_by_pos': 'confirmed',
      'failed': 'failed',
      'payment_failed': 'failed',
      'cancelled': 'cancelled',
      'canceled': 'cancelled',
      'cancelled_by_customer': 'cancelled',
      'refunded': 'cancelled',
      'returned': 'cancelled'
    };

    const canonical = canonicalMap[key] ?? null;

    if (canonical === 'delivered') {
      return { text: `Order Delivered`, icon: 'checkmark-circle', iconColor: '#22C55E', bgColor: '#F0FDF4' };
    }
    if (canonical === 'failed') {
      return { text: `Order Failed`, icon: 'close-circle', iconColor: '#EF4444', bgColor: '#FEF2F2' };
    }
    if (canonical === 'confirmed') {
      return { text: `Order Confirmed`, icon: 'time', iconColor: '#F59E0B', bgColor: '#FFFBEB' };
    }
    if (canonical === 'cancelled') {
      return { text: `Order Cancelled`, icon: 'close-circle', iconColor: '#6B7280', bgColor: '#F9FAFB' };
    }

    // Unknown canonical mapping - show the raw status nicely capitalized
    const label = raw ? raw.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'Unknown Status';
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
          <Text className="text-base font-medium text-gray-900">{order.orderNumber}</Text>
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
          {order.status === 'delivered' && (
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

  const filterOptions = [
    { key: 'all', label: 'All' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'delivered', label: 'Delivered' },
  ];

    // Helper to normalize incoming API status strings to canonical keys
    const normalizeStatus = (raw?: string) => {
      const key = (raw ?? '').toString().trim().toLowerCase();
      const canonicalMap: Record<string, string> = {
        'delivered': 'delivered', 'del': 'delivered', 'completed': 'delivered', 'complete': 'delivered',
        'confirmed': 'confirmed', 'confirmed_by_pos': 'confirmed',
        'failed': 'failed', 'payment_failed': 'failed',
        'cancelled': 'cancelled', 'canceled': 'cancelled', 'cancelled_by_customer': 'cancelled', 'refunded': 'cancelled', 'returned': 'cancelled'
      };
      return (canonicalMap[key] ?? key) || 'unknown';
    };

    // Build counts from fetched orders using normalized status keys
    const counts = orders.reduce((acc, order) => {
      const s = normalizeStatus(order.status);
      acc[s as keyof typeof acc] = (acc[s as keyof typeof acc] || 0) + 1;
      acc.all = (acc.all || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const filteredOrders = selectedFilter === 'all' ? orders : orders.filter(order => order.status === selectedFilter);
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
          // try common fields for status and normalize
          const rawStatus = (o.OrderStatus ?? o.orderStatus ?? o.Status ?? o.status ?? o.OrderStatusText ?? '').toString();
          const normalized = normalizeStatus(rawStatus);

          return {
            id: String(o.OrderID),
            orderNumber: o.OrderNumber ?? `Order ${o.OrderID}`,
            itemCount: Number(o.OrderItemCount ?? 0),
            status: normalized,
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

  const handleOrderAgain = (orderId: string) => {
    console.log("Order again for:", orderId);
  };

  const handleViewDetails = (order: UiOrder) => {
    router.push({
      pathname: '/orders/[orderId]',
      params: { 
        orderId: order.id,
        orderDate: order.rawOrderDate ?? '',
        deliveryDate: order.rawDeliveryDate ?? ''
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
    </View>
  );
}
