import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getOrderItems } from '../../services/api';

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
  const { orderId, orderDate: routeOrderDate, deliveryDate: routeDeliveryDate } = useLocalSearchParams();

  const [loading, setLoading] = useState<boolean>(true);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  const handleDownloadInvoice = async () => {
    try {
      // For demo purposes - replace with actual invoice download logic
      Alert.alert(
        "Download Invoice", 
        "Invoice download feature will be implemented here",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Download", onPress: () => console.log("Download started") }
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Unable to download invoice");
    }
  };

  const ItemRow = ({ item }: { item: OrderItem }) => (
    <View className="py-3 border-b border-gray-100">
      <View className="flex-row justify-between items-center">
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {item.productImage ? (
            <Image source={{ uri: item.productImage }} style={{ width: 64, height: 64, borderRadius: 8, marginRight: 12 }} />
          ) : (
            <View style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: '#F3F4F6', marginRight: 12, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="image-outline" size={28} color="#9CA3AF" />
            </View>
          )}
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
            Orders #{orderId}
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
          
          <TouchableOpacity 
            onPress={handleDownloadInvoice}
            className="flex-row items-center mb-4"
            activeOpacity={0.7}
          >
            <Text className="text-green-600 font-semibold text-sm mr-1">
              Download Invoice
            </Text>
            <Ionicons name="download-outline" size={16} color="#22C55E" />
          </TouchableOpacity>

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
          
          <DetailRow label="Order ID" value={`#${orderId}`} />
          <DetailRow label="Payment Amount" value={orderItems.reduce((s, it) => s + (it.price * it.quantity), 0)} />
          <DetailRow label="Order Status" value={orderItems.length ? (orderItems.every(i => i.status === 'Cancelled') ? 'Cancelled' : 'Processed') : 'Unknown'} />
          <DetailRow label="Order Date" value={routeOrderDate ? new Date(routeOrderDate as string).toLocaleDateString() : '--'} />
          <DetailRow label="Delivery Date" value={routeDeliveryDate ? new Date(routeDeliveryDate as string).toLocaleDateString() : '--'} />
          <DetailRow 
            label="Delivery Address" 
            value={'--'}
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
                ₹{(orderItems.reduce((s, it) => s + (it.price * it.quantity), 0)).toFixed(2)}
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
              // Navigate to shop to reorder
              console.log("Reorder items");
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
    </View>
  );
};

export default OrderDetailScreen;