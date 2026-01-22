import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getInvoiceItems } from '../../../services/api';

// Placeholder image for loading state
const placeholderImage = require('../../../assets/images/Banana.png');

// Blurhash for smooth placeholder (light gray)
const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

// Types from API
interface ApiInvoiceItem {
  InvoiceItemID: number;
  InvoiceID: number;
  ProductID: number;
  OrderQty?: string;
  SaleQty?: number;
  Price: number;
  TaxableValue?: number;
  CGST?: number;
  SGST?: number;
  IGST?: number;
  NetTotal?: number;
  InvoiceItemStatus?: string | null;
  Discount?: number;
  ProductName?: string | null;
  ProductImage?: string | null;
}

interface ApiInvoiceItemsResponse {
  success?: boolean;
  invoiceItems: ApiInvoiceItem[];
}

interface InvoiceItem {
  id: string;
  productId: number;
  orderQty?: string;
  saleQty?: number;
  price: number;
  taxableValue?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  netTotal?: number;
  status?: string | null;
  discount?: number;
  productName?: string | null;
  productImage?: string | null;
}

const InvoiceDetailScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { 
    invoiceId, 
    invoiceNumber, 
    invoiceStatus, 
    invoiceDate: routeInvoiceDate, 
    netAmount: routeNetAmount,
    grossAmount: routeGrossAmount,
    discountAmount: routeDiscountAmount
  } = useLocalSearchParams();

  const [loading, setLoading] = useState<boolean>(true);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  console.log('📋 Invoice Route Params:', { 
    invoiceId, 
    invoiceNumber, 
    invoiceStatus, 
    routeInvoiceDate, 
    routeNetAmount,
    routeGrossAmount,
    routeDiscountAmount
  });

  useEffect(() => {
    let mounted = true;
    // Handle invoiceId which can be a string or array of strings
    const invoiceIdValue = Array.isArray(invoiceId) ? invoiceId[0] : invoiceId;
    const id = Number(invoiceIdValue);
    
    if (!invoiceIdValue || isNaN(id) || id <= 0) {
      console.error('Invalid invoice ID:', invoiceIdValue, 'parsed as:', id);
      setError('Invalid invoice id');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res: ApiInvoiceItemsResponse = await getInvoiceItems(id) as ApiInvoiceItemsResponse;
        
        if (!mounted) return;
        
        console.log('API response for invoice items:', res);
        
        if (!res || !res.invoiceItems) {
          setInvoiceItems([]);
          setError('No items found for this invoice');
        } else {
          const mapped: InvoiceItem[] = res.invoiceItems.map((ai) => ({
            id: String(ai.InvoiceItemID),
            productId: ai.ProductID,
            orderQty: ai.OrderQty,
            saleQty: Number(ai.SaleQty ?? 0),
            price: Number(ai.Price ?? 0),
            taxableValue: Number(ai.TaxableValue ?? 0),
            cgst: Number(ai.CGST ?? 0),
            sgst: Number(ai.SGST ?? 0),
            igst: Number(ai.IGST ?? 0),
            netTotal: Number(ai.NetTotal ?? 0),
            status: ai.InvoiceItemStatus ?? null,
            discount: Number(ai.Discount ?? 0),
            productName: ai.ProductName ?? null,
            productImage: ai.ProductImage ?? null,
          }));
          setInvoiceItems(mapped);
          console.log('Mapped invoice items (UI):', mapped);
        }
      } catch (err) {
        console.error('Error loading invoice items:', err);
        setError('Failed to load invoice items');
      } finally {
        setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [invoiceId]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Ionicons name="hourglass-outline" size={48} color="#9CA3AF" />
        <Text className="text-lg text-gray-500 mt-3">Loading invoice items...</Text>
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

  const ItemRow = ({ item }: { item: InvoiceItem }) => (
    <View className="py-4 border-b border-gray-100">
      <View className="flex-row justify-between items-start mb-2">
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', flex: 1 }}>
          <Image 
            source={item.productImage ? { uri: item.productImage } : placeholderImage}
            placeholder={blurhash}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            style={{ width: 64, height: 64, borderRadius: 8, marginRight: 12, backgroundColor: '#f3f4f6' }} 
          />
          <View style={{ flex: 1 }}>
            <Text className="text-base font-semibold text-gray-900 mb-1">
              {item.productName ?? 'Unknown Product'}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {item.saleQty ? (
                <Text className="text-sm text-gray-600">Qty: {item.saleQty}</Text>
              ) : null}
              {item.orderQty ? (
                <Text className="text-sm text-gray-600">• Order: {item.orderQty}</Text>
              ) : null}
            </View>
            {item.status ? (
              <View className="mt-1">
                <Text className={`text-xs font-medium ${
                  item.status?.toLowerCase() === 'delivered' ? 'text-green-600' :
                  item.status?.toLowerCase() === 'pending' ? 'text-yellow-600' :
                  item.status?.toLowerCase() === 'cancelled' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {item.status}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
      
      {/* Price breakdown */}
      <View className="ml-20 mt-2 bg-gray-50 p-3 rounded-lg">
        <View className="flex-row justify-between mb-1">
          <Text className="text-sm text-gray-600">Price:</Text>
          <Text className="text-sm font-medium text-gray-900">₹{item.price.toFixed(2)}</Text>
        </View>
        {item.discount > 0 && (
          <View className="flex-row justify-between mb-1">
            <Text className="text-sm text-gray-600">Discount:</Text>
            <Text className="text-sm font-medium text-red-600">-₹{item.discount.toFixed(2)}</Text>
          </View>
        )}
        {(item.cgst > 0 || item.sgst > 0 || item.igst > 0) && (
          <View className="flex-row justify-between mb-1">
            <Text className="text-sm text-gray-600">Tax:</Text>
            <Text className="text-sm font-medium text-gray-900">
              ₹{((item.cgst ?? 0) + (item.sgst ?? 0) + (item.igst ?? 0)).toFixed(2)}
            </Text>
          </View>
        )}
        <View className="flex-row justify-between pt-2 border-t border-gray-200">
          <Text className="text-sm font-bold text-gray-900">Net Total:</Text>
          <Text className="text-sm font-bold text-green-600">₹{item.netTotal?.toFixed(2) ?? '0.00'}</Text>
        </View>
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

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'text-gray-600';
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'paid' || lowerStatus === 'delivered') return 'text-green-600';
    if (lowerStatus === 'created' || lowerStatus === 'pending') return 'text-yellow-600';
    if (lowerStatus === 'cancelled') return 'text-red-600';
    return 'text-gray-600';
  };

  const getStatusBgColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100';
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'paid' || lowerStatus === 'delivered') return 'bg-green-100';
    if (lowerStatus === 'created' || lowerStatus === 'pending') return 'bg-yellow-100';
    if (lowerStatus === 'cancelled') return 'bg-red-100';
    return 'bg-gray-100';
  };

  // Calculate totals
  const subtotal = invoiceItems.reduce((sum, item) => sum + (item.taxableValue ?? item.price * (item.saleQty ?? 0)), 0);
  const totalDiscount = routeDiscountAmount ? Number(routeDiscountAmount) : invoiceItems.reduce((sum, item) => sum + (item.discount ?? 0), 0);
  const totalTax = invoiceItems.reduce((sum, item) => sum + ((item.cgst ?? 0) + (item.sgst ?? 0) + (item.igst ?? 0)), 0);
  const grandTotal = routeNetAmount ? Number(routeNetAmount) : invoiceItems.reduce((sum, item) => sum + (item.netTotal ?? 0), 0);

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
            Invoice {invoiceNumber || `#${invoiceId}`}
          </Text>
          
          <View style={{ width: 40 }} />
        </View>

        {/* Status Badge */}
        {invoiceStatus && (
          <View className="flex-row items-center justify-center mt-3">
            <View className={`px-4 py-2 rounded-full ${getStatusBgColor(String(invoiceStatus))}`}>
              <Text className={`font-semibold text-sm ${getStatusColor(String(invoiceStatus))}`}>
                {String(invoiceStatus).replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
              </Text>
            </View>
          </View>
        )}
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Invoice Summary Section */}
        <View className="bg-white rounded-xl p-6 mb-4 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Invoice Summary
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
            {invoiceItems.length} items in this invoice
          </Text>

          {/* Items List */}
          {invoiceItems.map((item) => (
            <ItemRow 
              key={item.id}
              item={item}
            />
          ))}
        </View>

        {/* Invoice Details Section */}
        <View className="bg-white rounded-xl p-6 mb-4 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Invoice Details
          </Text>
          
          <DetailRow label="Invoice Number" value={invoiceNumber || `#${invoiceId}`} />
          <DetailRow 
            label="Invoice Date" 
            value={routeInvoiceDate && String(routeInvoiceDate).trim() 
              ? new Date(routeInvoiceDate as string).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })
              : '--'
            } 
          />
          <DetailRow 
            label="Invoice Status" 
            value={invoiceStatus 
              ? String(invoiceStatus).replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) 
              : 'Unknown'
            } 
            isLast={true}
          />
        </View>

        {/* Bill Details Section */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Bill Details
          </Text>
          
          <DetailRow label="Subtotal" value={subtotal} />
          {totalDiscount > 0 && (
            <DetailRow label="Discount" value={`-₹${totalDiscount.toFixed(2)}`} />
          )}
          {totalTax > 0 && (
            <DetailRow label="Total Tax" value={totalTax} />
          )}
          
          {/* Grand Total with emphasis */}
          <View className="pt-3 mt-3 border-t border-gray-200">
            <View className="flex-row justify-between items-center">
              <Text className="text-base font-bold text-gray-900">Grand Total</Text>
              <Text className="text-lg font-bold text-green-600">
                ₹{grandTotal.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default InvoiceDetailScreen;
