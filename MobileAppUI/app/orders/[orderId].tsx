import React, { useState } from "react";
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

// Types
interface OrderItem {
  id: string;
  name: string;
  quantity: string;
  price: number;
  image: any;
}

interface OrderDetails {
  id: string;
  status: string;
  statusIcon: string;
  statusColor: string;
  deliveryDate: string;
  orderDate: string;
  items: OrderItem[];
  orderDetails: {
    orderId: string;
    paymentAmount: number;
    paymentMethod: string;
    orderStatus: string;
    orderDate: string;
    deliveryDate: string;
    deliveryAddress: string;
  };
  billDetails: {
    totalMRP: number;
    discount: number;
    deliveryCharge: number;
    handlingCharges: number;
    tax: number;
    grandTotal: number;
  };
}

// Mock order data based on your Figma design
const mockOrderDetails: Record<string, OrderDetails> = {
  "67237": {
    id: "67237",
    status: "Delivered",
    statusIcon: "checkmark-circle",
    statusColor: "#22C55E",
    deliveryDate: "24th June 2025 at 19:34",
    orderDate: "20th June 2025",
    items: [
      {
        id: "1",
        name: "Banana Indonesia Organic",
        quantity: "45 Kgs",
        price: 20.00,
        image: require("../../assets/images/Banana.png"),
      },
      {
        id: "2", 
        name: "Pepsi Can 10ml",
        quantity: "2 Pcs",
        price: 10.00,
        image: require("../../assets/images/Banana.png"), // Replace with actual Pepsi image
      }
    ],
    orderDetails: {
      orderId: "#67237",
      paymentAmount: 30.00,
      paymentMethod: "Cash on delivery",
      orderStatus: "Delivered",
      orderDate: "20th June 2025",
      deliveryDate: "24th June 2025",
      deliveryAddress: "Shop No. 8, 10th Main Rd. Benson Town 560046"
    },
    billDetails: {
      totalMRP: 400.39,
      discount: 27.6,
      deliveryCharge: 30.00,
      handlingCharges: 10.00,
      tax: 20.00,
      grandTotal: 40.00
    }
  }
};

const OrderDetailScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId } = useLocalSearchParams();
  
  // Get order details from mock data (replace with actual API call)
  const orderDetails = mockOrderDetails[orderId as string];

  if (!orderDetails) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
        <Text className="text-xl font-semibold text-gray-500 mt-4">
          Order not found
        </Text>
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
    <View className="flex-row items-center py-3 border-b border-gray-100">
      <Image 
        source={item.image} 
        className="w-14 h-14 rounded-lg mr-4"
        resizeMode="contain"
      />
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900 mb-1">
          {item.name}
        </Text>
        <Text className="text-sm text-gray-500">
          {item.quantity}
        </Text>
      </View>
      <Text className="text-lg font-bold text-gray-900">
        ₹{item.price.toFixed(2)}
      </Text>
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
            Orders #{orderDetails.id}
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
            Arrived on {orderDetails.deliveryDate}
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
            {orderDetails.items.length} items in this order
          </Text>

          {/* Items List */}
          {orderDetails.items.map((item, index) => (
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
          
          <DetailRow label="Order ID" value={orderDetails.orderDetails.orderId} />
          <DetailRow label="Payment Amount" value={orderDetails.orderDetails.paymentAmount} />
          <DetailRow label="Payment Method" value={orderDetails.orderDetails.paymentMethod} />
          <DetailRow label="Order Status" value={orderDetails.orderDetails.orderStatus} />
          <DetailRow label="Order Date" value={orderDetails.orderDetails.orderDate} />
          <DetailRow label="Delivery Date" value={orderDetails.orderDetails.deliveryDate} />
          <DetailRow 
            label="Delivery Address" 
            value={orderDetails.orderDetails.deliveryAddress}
            isLast={true}
          />
        </View>

        {/* Bill Details Section */}
        <View className="bg-white rounded-xl p-6 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Bill Details
          </Text>
          
          <DetailRow label="Total MRP" value={`$${orderDetails.billDetails.totalMRP.toFixed(2)}`} />
          <DetailRow label="Discount" value={`${orderDetails.billDetails.discount}%`} />
          <DetailRow label="Delivery Charge" value={orderDetails.billDetails.deliveryCharge} />
          <DetailRow label="Handling Charges" value={orderDetails.billDetails.handlingCharges} />
          <DetailRow label="Tax" value={orderDetails.billDetails.tax} />
          
          {/* Grand Total with emphasis */}
          <View className="pt-3 mt-3 border-t border-gray-200">
            <View className="flex-row justify-between items-center">
              <Text className="text-base font-bold text-gray-900">Grand Total</Text>
              <Text className="text-lg font-bold text-green-600">
                ₹{orderDetails.billDetails.grandTotal.toFixed(2)}
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