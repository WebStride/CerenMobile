import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Alert,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import DateTimePicker from '@react-native-community/datetimepicker';
import { getInvoices } from '../../../services/api';

// Local UI invoice shape
type UiInvoice = {
  id: string;
  invoiceNumber?: string;
  itemCount?: number;
  status: string;
  netAmount: number;
  grossAmount?: number;
  discountAmount?: number;
  invoiceDate?: string;
  rawInvoiceDate?: string;
};

const InvoiceCard = ({ invoice, onViewDetails }: {
  invoice: UiInvoice;
  onViewDetails: (invoice: UiInvoice) => void;
}) => {
  const getStatusConfig = () => {
    // Show the actual status from backend
    const raw = (invoice.status ?? '').toString();
    const key = raw.trim().toLowerCase();

    // Format the display text
    const label = raw ? raw.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'Unknown Status';

    // Assign colors and icons based on status
    if (key === 'paid') {
      return { text: label, icon: 'checkmark-circle', iconColor: '#22C55E', bgColor: '#F0FDF4' };
    }
    if (key === 'created') {
      return { text: label, icon: 'time', iconColor: '#3B82F6', bgColor: '#EFF6FF' };
    }
    if (key === 'delivered') {
      return { text: label, icon: 'cube', iconColor: '#8B5CF6', bgColor: '#F5F3FF' };
    }
    if (key === 'cancelled' || key === 'canceled') {
      return { text: label, icon: 'close-circle', iconColor: '#6B7280', bgColor: '#F9FAFB' };
    }

    // Default for any other status
    return { text: label, icon: 'help-circle', iconColor: '#6B7280', bgColor: '#F9FAFB' };
  };

  const statusConfig = getStatusConfig();

  return (
    <View className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-semibold text-gray-900">
          {invoice.invoiceNumber ? `Invoice ${invoice.invoiceNumber}` : `Invoice #${invoice.id}`}
        </Text>
        <View className={`flex-row items-center px-3 py-1 rounded-full`} style={{ backgroundColor: statusConfig.bgColor }}>
          <Ionicons name={statusConfig.icon as any} size={16} color={statusConfig.iconColor} />
          <Text className={`ml-1 text-sm font-medium`} style={{ color: statusConfig.iconColor }}>
            {statusConfig.text}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center mb-3">
        <View className="flex-1">
          <Text className="text-sm text-gray-500">{invoice.itemCount ?? 0} items • {invoice.invoiceDate}</Text>
        </View>
        <View className="items-end ml-4">
          <Text className="text-sm text-gray-600">Net Amount</Text>
          <Text className="text-lg font-bold text-gray-900">₹{Number(invoice.netAmount ?? 0).toFixed(2)}</Text>
        </View>
      </View>

      <View className="border-t border-gray-200 pt-3">
        <Text className="text-sm text-gray-600 mb-2">
          Date: {invoice.invoiceDate}
          {invoice.discountAmount && invoice.discountAmount > 0 && ` • Discount: ₹${Number(invoice.discountAmount).toFixed(2)}`}
        </Text>

        <TouchableOpacity
          style={{
            backgroundColor: '#15803d', // green-700
            borderRadius: 25,
            paddingVertical: 10,
            alignItems: 'center',
            justifyContent: 'center',
            height: 40,
          }}
          onPress={() => onViewDetails(invoice)}
          activeOpacity={0.8}
        >
          <Text style={{
            color: 'white',
            fontWeight: '600',
            fontSize: 14
          }}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const FilterButton = ({ 
  title, 
  isActive, 
  onPress 
}: { 
  title: string; 
  isActive: boolean; 
  onPress: () => void 
}) => (
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

export default function InvoicesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<UiInvoice[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Date range filter state
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const filterOptions = [
    { key: 'all', label: 'All' },
    { key: 'created', label: 'Created' },
    { key: 'paid', label: 'Paid' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  // Build counts from fetched invoices using raw status keys
  const counts = invoices.reduce((acc, invoice) => {
    const s = invoice.status.toLowerCase();
    acc[s as keyof typeof acc] = (acc[s as keyof typeof acc] || 0) + 1;
    acc.all = (acc.all || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filteredInvoices = selectedFilter === 'all' 
    ? invoices 
    : invoices.filter(invoice => invoice.status.toLowerCase() === selectedFilter);

  // Extracted load function as a reusable callback
  const loadInvoices = useCallback(async (isRefresh = false) => {
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
      
      console.log('📄 Fetching invoices for customerId:', customerId);
      
      if (!customerId) {
        setError('No store selected. Please select a store first.');
        setInvoices([]);
        return;
      }
      
      const res = await getInvoices(customerId);
      if (res && Array.isArray(res.invoices)) {
        const mapped = res.invoices.map((inv: any) => {
          // Use raw status from backend
          const rawStatus = (inv.InvoiceStatus ?? inv.invoiceStatus ?? inv.Status ?? inv.status ?? '').toString();

          return {
            id: String(inv.InvoiceID),
            invoiceNumber: inv.InvoiceNumber ?? `Invoice ${inv.InvoiceID}`,
            itemCount: Number(inv.InvoiceItemCount ?? 0),
            status: rawStatus,
            netAmount: Number(inv.NetInvoiceAmount ?? 0),
            grossAmount: Number(inv.GrossInvoiceAmount ?? 0),
            discountAmount: Number(inv.DiscountAmount ?? 0),
            invoiceDate: inv.InvoiceDate ? new Date(inv.InvoiceDate).toLocaleDateString() : undefined,
            rawInvoiceDate: inv.InvoiceDate,
          } as UiInvoice;
        });
        setInvoices(mapped);
      } else {
        setInvoices([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Use useFocusEffect to reload invoices whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadInvoices();
    }, [loadInvoices])
  );

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    loadInvoices(true);
  }, [loadInvoices]);

  const handleViewDetails = (invoice: UiInvoice) => {
    console.log("Navigating to invoice details:", invoice.id);
    router.push({
      pathname: `/(tabs)/invoices/${invoice.id}`,
      params: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceStatus: invoice.status,
        invoiceDate: invoice.rawInvoiceDate || invoice.invoiceDate, // Pass raw date for proper parsing
        netAmount: invoice.netAmount.toString(),
        grossAmount: invoice.grossAmount?.toString() ?? '0',
        discountAmount: invoice.discountAmount?.toString() ?? '0',
      }
    });
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const applyDateFilter = async () => {
    console.log('Applying date filter:', startDate, endDate);
    setShowDateRangePicker(false);
    
    // Client-side filtering of already loaded invoices
    try {
      const selectedStoreId = await AsyncStorage.getItem('selectedStoreId');
      const customerId = selectedStoreId ? Number(selectedStoreId) : undefined;
      
      if (!customerId) {
        Alert.alert('Error', 'No store selected. Please select a store first.');
        return;
      }

      // Reload all invoices first
      setLoading(true);
      const res = await getInvoices(customerId);
      
      if (res && Array.isArray(res.invoices)) {
        const mapped = res.invoices.map((inv: any) => {
          const rawStatus = (inv.InvoiceStatus ?? inv.invoiceStatus ?? inv.Status ?? inv.status ?? '').toString();

          return {
            id: String(inv.InvoiceID),
            invoiceNumber: inv.InvoiceNumber ?? `Invoice ${inv.InvoiceID}`,
            itemCount: Number(inv.InvoiceItemCount ?? 0),
            status: rawStatus,
            netAmount: Number(inv.NetInvoiceAmount ?? 0),
            grossAmount: Number(inv.GrossInvoiceAmount ?? 0),
            discountAmount: Number(inv.DiscountAmount ?? 0),
            invoiceDate: inv.InvoiceDate ? new Date(inv.InvoiceDate).toLocaleDateString() : undefined,
            rawInvoiceDate: inv.InvoiceDate,
          } as UiInvoice;
        });
        
        // Filter by date range
        const filtered = mapped.filter(invoice => {
          if (!invoice.rawInvoiceDate) return false;
          const invoiceDate = new Date(invoice.rawInvoiceDate);
          // Set time to start of day for comparison
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          return invoiceDate >= start && invoiceDate <= end;
        });
        
        setInvoices(filtered);
        Alert.alert('Success', `Found ${filtered.length} invoices in the selected date range`);
      } else {
        setInvoices([]);
        Alert.alert('No Results', 'No invoices found');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to filter invoices');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
        <View className="flex-1 justify-center items-center">
          <Ionicons name="hourglass-outline" size={48} color="#9CA3AF" />
          <Text className="text-lg text-gray-500 mt-3">Loading invoices...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-gray-900">Invoices</Text>
          <TouchableOpacity
            onPress={() => setShowDateRangePicker(true)}
            className="bg-green-600 px-4 py-2 rounded-lg flex-row items-center"
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Filter</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 16 }}
        >
          {filterOptions.map(option => (
            <FilterButton
              key={option.key}
              title={`${option.label}${counts[option.key] !== undefined ? ` (${counts[option.key]})` : ''}`}
              isActive={selectedFilter === option.key}
              onPress={() => setSelectedFilter(option.key)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Invoice List */}
      <ScrollView
        className="flex-1 px-4 py-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#15803d"
            colors={['#15803d']}
          />
        }
      >
        {error ? (
          <View className="bg-white rounded-lg p-6 items-center">
            <Ionicons name="alert-circle" size={48} color="#F87171" />
            <Text className="text-lg text-gray-600 mt-3 text-center">{error}</Text>
            <TouchableOpacity
              onPress={() => loadInvoices()}
              className="mt-4 bg-green-600 px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredInvoices.length === 0 ? (
          <View className="bg-white rounded-lg p-6 items-center">
            <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
            <Text className="text-xl font-semibold text-gray-600 mt-4">
              No {selectedFilter !== 'all' ? selectedFilter : ''} invoices found
            </Text>
            <Text className="text-gray-500 text-center mt-2">
              {selectedFilter !== 'all' 
                ? 'Try selecting a different filter' 
                : 'Your invoices will appear here once they are generated'}
            </Text>
          </View>
        ) : (
          filteredInvoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onViewDetails={handleViewDetails}
            />
          ))
        )}
        <View style={{ height: insets.bottom + 80 }} />
      </ScrollView>

      {/* Date Range Picker Modal */}
      {showDateRangePicker && (
        <View 
          className="absolute inset-0 bg-black/50 justify-center items-center"
          style={{ zIndex: 1000 }}
        >
          <View className="bg-white rounded-2xl p-6 m-4 w-11/12 max-w-md">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">Filter by Date</Text>
              <TouchableOpacity onPress={() => setShowDateRangePicker(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Start Date */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">From Date</Text>
              <TouchableOpacity
                onPress={() => setShowStartDatePicker(true)}
                className="bg-gray-100 px-4 py-3 rounded-lg flex-row items-center justify-between"
              >
                <Text className="text-gray-900">{startDate.toLocaleDateString()}</Text>
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* End Date */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-2">To Date</Text>
              <TouchableOpacity
                onPress={() => setShowEndDatePicker(true)}
                className="bg-gray-100 px-4 py-3 rounded-lg flex-row items-center justify-between"
              >
                <Text className="text-gray-900">{endDate.toLocaleDateString()}</Text>
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => setShowDateRangePicker(false)}
                className="flex-1 bg-gray-200 py-3 rounded-lg items-center"
              >
                <Text className="text-gray-700 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={applyDateFilter}
                className="flex-1 bg-green-600 py-3 rounded-lg items-center"
              >
                <Text className="text-white font-semibold">Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartDateChange}
          maximumDate={endDate}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleEndDateChange}
          minimumDate={startDate}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
}
