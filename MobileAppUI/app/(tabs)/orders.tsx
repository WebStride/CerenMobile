import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router"; // Import useRouter

// Mock data for different order types
const mockOrders = [
  {
    id: "67237",
    productName: "Banana",
    productImage: require("../../assets/images/Banana.png"),
    status: "delivered",
    amount: 30.00,
    placedDate: "24th June 2025",
    deliveryDate: "25th June 2025",
    location: "Greenville, Karnataka",
    items: [
      { name: "Fresh Bananas", quantity: 1, price: 30.00 }
    ]
  },
  {
    id: "67243",
    productName: "Pepsi",
    productImage: require("../../assets/images/Banana.png"), // Replace with actual Pepsi image
    status: "delivered",
    amount: 40.00,
    placedDate: "14th June 2025",
    deliveryDate: "15th June 2025",
    location: "Greenville, Karnataka",
    items: [
      { name: "Pepsi Can 330ml", quantity: 2, price: 40.00 }
    ]
  },
  {
    id: "67227",
    productName: "Real Juice",
    productImage: require("../../assets/images/Banana.png"), // Replace with actual juice image
    status: "failed",
    amount: 30.00,
    placedDate: "24th June 2025",
    deliveryDate: null,
    location: "Greenville, Karnataka",
    failureReason: "Payment failed",
    items: [
      { name: "Real Mixed Fruit Juice", quantity: 1, price: 30.00 }
    ]
  },
  {
    id: "67225",
    productName: "Milk",
    productImage: require("../../assets/images/Banana.png"), // Replace with actual milk image
    status: "confirmed",
    amount: 25.00,
    placedDate: "10th September 2025",
    estimatedDelivery: "11th September 2025",
    location: "Greenville, Karnataka",
    items: [
      { name: "Fresh Milk 1L", quantity: 1, price: 25.00 }
    ]
  },
  {
    id: "67220",
    productName: "Bread",
    productImage: require("../../assets/images/Banana.png"), // Replace with actual bread image
    status: "cancelled",
    amount: 35.00,
    placedDate: "8th September 2025",
    cancellationDate: "9th September 2025",
    location: "Greenville, Karnataka",
    cancellationReason: "Cancelled by customer",
    items: [
      { name: "White Bread", quantity: 2, price: 35.00 }
    ]
  }
];

const OrderCard = ({ order, onOrderAgain, onViewDetails }: {
  order: any;
  onOrderAgain: (orderId: string) => void;
  onViewDetails: (orderId: string) => void;
}) => {
  const getStatusConfig = () => {
    switch (order.status) {
      case "delivered":
        return {
          text: "Order Delivered",
          icon: "checkmark-circle",
          iconColor: "#22C55E",
          bgColor: "#F0FDF4"
        };
      case "failed":
        return {
          text: "Order Failed",
          icon: "close-circle",
          iconColor: "#EF4444",
          bgColor: "#FEF2F2"
        };
      case "confirmed":
        return {
          text: "Order Confirmed",
          icon: "time",
          iconColor: "#F59E0B",
          bgColor: "#FFFBEB"
        };
      case "cancelled":
        return {
          text: "Order Cancelled",
          icon: "close-circle",
          iconColor: "#6B7280",
          bgColor: "#F9FAFB"
        };
      default:
        return {
          text: "Unknown Status",
          icon: "help-circle",
          iconColor: "#6B7280",
          bgColor: "#F9FAFB"
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <View className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-semibold text-gray-900">Order #{order.id}</Text>
        <View className={`flex-row items-center px-3 py-1 rounded-full ${statusConfig.bgColor}`}>
          <Ionicons name={statusConfig.icon as any} size={16} color={statusConfig.iconColor} />
          <Text className={`ml-1 text-sm font-medium ${statusConfig.iconColor === '#22C55E' ? 'text-green-700' : statusConfig.iconColor === '#EF4444' ? 'text-red-700' : statusConfig.iconColor === '#F59E0B' ? 'text-yellow-700' : 'text-gray-700'}`}>
            {statusConfig.text}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center mb-3">
        <Image source={order.productImage} className="w-16 h-16 rounded-lg mr-3" />
        <View className="flex-1">
          <Text className="text-base font-medium text-gray-900">{order.productName}</Text>
          <Text className="text-sm text-gray-500">₹{order.amount.toFixed(2)}</Text>
        </View>
      </View>

      <View className="border-t border-gray-200 pt-3">
        <Text className="text-sm text-gray-600 mb-2">
          Placed: {order.placedDate}
          {order.deliveryDate && ` • Delivered: ${order.deliveryDate}`}
          {order.estimatedDelivery && ` • Est. Delivery: ${order.estimatedDelivery}`}
        </Text>
        <Text className="text-sm text-gray-600 mb-3">{order.location}</Text>

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
            onPress={() => onViewDetails(order.id)}
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

  const filterOptions = [
    { key: 'all', label: 'All' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'failed', label: 'Failed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const counts = mockOrders.reduce((acc, order) => {
    acc[order.status as keyof typeof acc] = (acc[order.status as keyof typeof acc] || 0) + 1;
    acc.all = (acc.all || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filteredOrders = selectedFilter === 'all' ? mockOrders : mockOrders.filter(order => order.status === selectedFilter);

  const handleOrderAgain = (orderId: string) => {
    console.log("Order again for:", orderId);
  };

  const handleViewDetails = (orderId: string) => {
    router.push({
      pathname: '/orders/[orderId]',
      params: { orderId }
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
      >
        {filteredOrders.length > 0 ? (
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
              {selectedFilter === "all" 
                ? "You haven't placed any orders yet" 
                : `No ${selectedFilter} orders found`}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
