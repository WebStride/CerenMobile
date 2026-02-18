import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Dimensions,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
// @ts-ignore
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { getInvoices, getInvoiceItems, getInvoicesByCustomerAndDateRange } from '../../services/api';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { fetch } from 'expo/fetch';
import { File, Paths } from 'expo-file-system/next';
import { generateInvoicePDF, generatePaymentReceiptPDF } from '../../utils/pdfTemplates';
import { formatDateForFilename } from '../../utils/dateUtils';

const { height } = Dimensions.get('window');

// Transaction interface
interface Transaction {
  id: string;
  amount: number;
  date: string | null;
  type: string;
  description: string;
  details: any;
}

// Mock ledger data with detailed information
const mockTransactions = [
  { 
    id: "BF", 
    amount: 12000, 
    date: null, 
    type: "balance", 
    description: "Before Balance",
    details: {
      openingBalance: 12000,
      note: "Previous month closing balance carried forward"
    }
  },
  { 
    id: "INV-001", 
    amount: 8000, 
    date: "2025-09-10", 
    type: "invoice", 
    description: "Grocery Order #67237",
    details: {
      items: [
        { name: "Fresh Bananas", quantity: "5 kg", price: 150, total: 750 },
        { name: "Organic Rice", quantity: "10 kg", price: 120, total: 1200 },
        { name: "Fresh Vegetables", quantity: "Mixed", price: 0, total: 2500 },
        { name: "Dairy Products", quantity: "Various", price: 0, total: 3550 }
      ],
      subtotal: 8000,
      tax: 0,
      total: 8000,
      dueDate: "2025-09-25",
      customerInfo: {
        name: "Amitav Panda",
        address: "121221, asdf, asdfasdf, Marathahalli, Bengaluru, Karnataka, India",
        mobile: "+917077404655"
      }
    }
  },
  { 
    id: "PMT-001", 
    amount: 5000, 
    date: "2025-09-13", 
    type: "payment", 
    description: "Payment Received",
    details: {
      paymentMethod: "UPI",
      transactionId: "TXN123456789",
      paidBy: "Amitav Panda",
      paymentDate: "2025-09-13 15:30:00",
      bankReference: "UPIREF123456",
      status: "Success"
    }
  },
  { 
    id: "INV-002", 
    amount: 5000, 
    date: "2025-09-15", 
    type: "invoice", 
    description: "Grocery Order #67243",
    details: {
      items: [
        { name: "Fresh Fruits", quantity: "3 kg", price: 200, total: 600 },
        { name: "Pulses & Lentils", quantity: "5 kg", price: 100, total: 500 },
        { name: "Spices", quantity: "Mixed", price: 0, total: 1200 },
        { name: "Household Items", quantity: "Various", price: 0, total: 2700 }
      ],
      subtotal: 5000,
      tax: 0,
      total: 5000,
      dueDate: "2025-09-30",
      customerInfo: {
        name: "Amitav Panda",
        address: "121221, asdf, asdfasdf, Marathahalli, Bengaluru, Karnataka, India",
        mobile: "+917077404655"
      }
    }
  }
];

const FilterButton = ({
  title,
  isActive,
  onPress,
}: {
  title: string;
  isActive: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className={`px-4 py-2 rounded-full mr-3 ${
      isActive ? 'bg-green-600' : 'bg-gray-100'
    }`}
    activeOpacity={0.7}
  >
    <Text className={`font-medium text-sm ${
      isActive ? 'text-white' : 'text-gray-700'
    }`}>
      {title}
    </Text>
  </TouchableOpacity>
);

// Invoice Detail Modal Component
const InvoiceDetailModal = ({ 
  visible, 
  onClose, 
  transaction 
}: {
  visible: boolean;
  onClose: () => void;
  transaction: any;
}) => {
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [downloading, setDownloading] = useState(false);

  console.log("Invoice Modal - visible:", visible, "transaction:", transaction?.id);

  useEffect(() => {
    if (visible && transaction && transaction.type === 'invoice') {
      fetchInvoiceItems();
    }
  }, [visible, transaction]);

  const fetchInvoiceItems = async () => {
    if (!transaction || !transaction.id) return;
    setLoadingItems(true);
    try {
      // Prefer numeric invoice id stored in details.invoiceId (set when mapping invoices)
      const invoiceId = Number(transaction.details?.invoiceId ?? transaction.id);
      const res = await getInvoiceItems(invoiceId);
      if (res && Array.isArray(res.invoiceItems)) {
        // optionally filter by InvoiceID field in case API returns items for multiple invoices
        const filtered = res.invoiceItems.filter((it: any) => Number(it.InvoiceID) === invoiceId);
        setInvoiceItems(filtered);
      } else {
        setInvoiceItems([]);
      }
    } catch (error) {
      console.error('Error fetching invoice items:', error);
      setInvoiceItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  if (!transaction || !visible) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleDownloadPDF = async () => {
    if (downloading) return;
    
    try {
      setDownloading(true);
      console.log('📄 Starting PDF download for transaction:', transaction.id);

      // Validate transaction has required data
      if (!transaction) {
        throw new Error('Transaction data is missing');
      }

      if (!transaction.date) {
        throw new Error('Transaction date is required for PDF generation');
      }

      // Get store name from AsyncStorage
      const storeName = await AsyncStorage.getItem('selectedStoreName') || 'Customer';
      const dateStr = formatDateForFilename(transaction.date);
      const fileName = `${storeName.replace(/\s+/g, '')}_Invoice_${dateStr}.pdf`;

      console.log('📄 Generating PDF with filename:', fileName);
      console.log('📄 Invoice items count:', invoiceItems.length);
      console.log('📄 Store name:', storeName);

      const html = generateInvoicePDF(
        transaction,
        invoiceItems,
        transaction.details?.customerInfo || {},
        storeName
      );

      console.log('📄 HTML generated, creating PDF...');
      const { uri } = await Print.printToFileAsync({ html });
      console.log('📄 PDF created at temp location:', uri);

      // Persist using new FileSystem API
      const file = new File(Paths.document, fileName);
      let shareTarget = uri;
      
      try {
        const response = await fetch(uri);
        await file.write(await response.bytes());
        console.log('📄 PDF persisted to:', file.uri);
        shareTarget = file.uri;
      } catch (moveErr) {
        // If persist fails, fall back to sharing the temp uri
        console.warn('⚠️ Failed to persist PDF, using temp uri:', moveErr);
      }

      const canShare = await Sharing.isAvailableAsync();
      console.log('📄 Sharing available:', canShare);
      
      if (canShare) {
        await Sharing.shareAsync(shareTarget, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: 'Share Invoice PDF'
        });
        console.log('✅ PDF shared successfully');
      } else {
        Alert.alert('Success', `PDF generated successfully!\nSaved to: ${fileName}`);
      }
    } catch (error: any) {
      console.error('❌ Error generating PDF:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      Alert.alert(
        'Download Failed', 
        error.message || 'Unable to generate PDF. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={{ 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        justifyContent: 'flex-end' 
      }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        
        <View style={{ 
          backgroundColor: 'white',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: height * 0.85,
          minHeight: height * 0.6
        }}>
          {/* Modal Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 24,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB'
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#111827'
            }}>
              Invoice Details
            </Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={28} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={{ flex: 1 }} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 24 }}
          >
            {/* Invoice Information Section */}
            <View style={{
              backgroundColor: '#EFF6FF',
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              borderLeftWidth: 4,
              borderLeftColor: '#3B82F6'
            }}>
              <Text style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: '#111827',
                marginBottom: 12
              }}>Invoice Information</Text>
              
              {/* Invoice Number */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 8
              }}>
                <Text style={{ color: '#6B7280', fontSize: 14 }}>Invoice Number:</Text>
                <Text style={{ 
                  fontWeight: '600', 
                  color: '#111827',
                  fontSize: 14
                }}>
                  {transaction.details.invoiceNo || transaction.id}
                </Text>
              </View>

              {/* Invoice Status */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 8
              }}>
                <Text style={{ color: '#6B7280', fontSize: 14 }}>Invoice Status:</Text>
                <View style={{
                  backgroundColor: transaction.details.invoiceStatus === 'Paid' ? '#D1FAE5' : '#FEF3C7',
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 12
                }}>
                  <Text style={{ 
                    fontWeight: '600', 
                    color: transaction.details.invoiceStatus === 'Paid' ? '#059669' : '#D97706',
                    fontSize: 13
                  }}>
                    {transaction.details.invoiceStatus || 'Pending'}
                  </Text>
                </View>
              </View>

              {/* Net Invoice Amount */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between'
              }}>
                <Text style={{ color: '#6B7280', fontSize: 14 }}>Net Invoice Amount:</Text>
                <Text style={{ 
                  fontWeight: '700', 
                  color: '#059669',
                  fontSize: 15
                }}>
                  ₹{(transaction.details.netInvoiceAmount || transaction.details.total || 0).toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Items List (fetched from API) */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#111827',
                marginBottom: 12
              }}>
                Items
              </Text>
              {loadingItems ? (
                <Text style={{ textAlign: 'center', color: '#6B7280', padding: 20 }}>
                  Loading items...
                </Text>
              ) : invoiceItems.length > 0 ? (
                invoiceItems.map((item: any, index: number) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: '#F9FAFB',
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      {/* Left: Image */}
                      <View style={{ width: 84, marginRight: 12 }}>
                        {item.ProductImage ? (
                          <Image source={{ uri: item.ProductImage }} style={{ width: 72, height: 72, borderRadius: 8 }} />
                        ) : (
                          <Image source={require('../../assets/images/Banana.png')} style={{ width: 72, height: 72, borderRadius: 8 }} />
                        )}
                      </View>

                      {/* Right: stacked rows (labels left, values right) */}
                      <View style={{ flex: 1 }}>
                        {/* Product Name (full width) */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text style={{ fontWeight: '600', color: '#111827', fontSize: 14 }}>Product Name</Text>
                          <Text style={{ color: '#6B7280', fontSize: 14 }}>{item.ProductName || 'Unknown Product'}</Text>
                        </View>

                        {/* Sales Qty */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                          <Text style={{ color: '#111827', fontSize: 13 }}>Sales Qty</Text>
                          <Text style={{ color: '#6B7280', fontSize: 13 }}>{item.SaleQty ?? 0}</Text>
                        </View>

                        {/* Price */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                          <Text style={{ color: '#111827', fontSize: 13 }}>Price</Text>
                          <Text style={{ color: '#6B7280', fontSize: 13 }}>₹{typeof item.Price === 'number' ? item.Price.toFixed(2) : (item.Price ?? '-')}</Text>
                        </View>

                        {/* Taxable Value */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                          <Text style={{ color: '#111827', fontSize: 13 }}>Taxable Value</Text>
                          <Text style={{ color: '#6B7280', fontSize: 13 }}>₹{typeof item.TaxableValue === 'number' ? item.TaxableValue.toFixed(2) : (item.TaxableValue ?? 0)}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={{ textAlign: 'center', color: '#6B7280', padding: 20 }}>
                  No items found
                </Text>
              )}
            </View>

            {/* Net Total Summary */}
            <View style={{
              backgroundColor: '#F0FDF4',
              borderRadius: 16,
              padding: 16,
              borderWidth: 2,
              borderColor: '#059669'
            }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: '#059669'
                }}>Net Total:</Text>
                <Text style={{
                  fontSize: 22,
                  fontWeight: 'bold',
                  color: '#059669'
                }}>
                  ₹{(transaction.details.netInvoiceAmount || transaction.details.total || 0).toFixed(2)}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={{
            padding: 24,
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            flexDirection: 'row',
            gap: 12
          }}>
            <TouchableOpacity 
              style={{
                flex: 1,
                backgroundColor: downloading ? '#9CA3AF' : '#059669',
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center'
              }}
              onPress={handleDownloadPDF}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator color="white" size="small" style={{ marginRight: 8 }} />
              ) : null}
              <Text style={{
                color: 'white',
                fontWeight: '600',
                fontSize: 16
              }}>{downloading ? 'Generating...' : 'Download PDF'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={{
                flex: 1,
                backgroundColor: '#F3F4F6',
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center'
              }}
              onPress={handleDownloadPDF}
            >
              <Text style={{
                color: '#374151',
                fontWeight: '600',
                fontSize: 16
              }}>Share Invoice</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Payment Detail Modal Component
const PaymentDetailModal = ({ 
  visible, 
  onClose, 
  transaction 
}: {
  visible: boolean;
  onClose: () => void;
  transaction: any;
}) => {
  const [downloading, setDownloading] = useState(false);
  console.log("Payment Modal - visible:", visible, "transaction:", transaction?.id);

  if (!transaction || !visible) return null;

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadReceipt = async () => {
    if (downloading) return;

    setDownloading(true);
    try {
      const customerName = transaction.details?.paidBy || 'Customer';
      const dateStr = formatDateForFilename(transaction.date);
      const filename = `${customerName.replace(/\s+/g, '')}_Receipt_${dateStr}.pdf`;

      const html = generatePaymentReceiptPDF(
        transaction,
        {
          name: customerName,
          address: '',
          mobile: ''
        },
        customerName
      );

      const { uri } = await Print.printToFileAsync({ html });

      // Persist using new FileSystem API
      let shareTarget = uri;
      try {
        const file = new File(Paths.document, filename);
        const response = await fetch(uri);
        await file.write(await response.bytes());
        shareTarget = file.uri;
      } catch (moveErr) {
        console.warn('Failed to persist receipt PDF, sharing temp uri:', moveErr);
      }
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(shareTarget, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: 'Share Payment Receipt'
        });
      } else {
        Alert.alert('Success', 'Receipt generated successfully!');
      }

      console.log('✅ Receipt PDF generated successfully');
    } catch (error) {
      console.error('❌ Error generating receipt PDF:', error);
      Alert.alert(
        'Download Failed',
        'Unable to generate payment receipt. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={{ 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        justifyContent: 'flex-end' 
      }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        
        <View style={{ 
          backgroundColor: 'white',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: height * 0.75,
          minHeight: height * 0.5
        }}>
          {/* Modal Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 24,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB'
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#111827'
            }}>
              Payment Details
            </Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={28} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={{ flex: 1 }} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 24 }}
          >
            {/* Payment Header */}
            <View style={{
              backgroundColor: '#F0FDF4',
              borderRadius: 16,
              padding: 20,
              marginBottom: 24
            }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12
              }}>
                <View>
                  <Text style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: '#15803D',
                    marginBottom: 4
                  }}>
                    {transaction.id}
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: '#16A34A'
                  }}>
                    {formatDateTime(transaction.details.paymentDate)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: '#15803D',
                    marginBottom: 4
                  }}>
                    ₹{transaction.amount.toFixed(2)}
                  </Text>
                  <View style={{
                    backgroundColor: transaction.details.status === 'Success' ? '#BBF7D0' : '#FECACA',
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 20
                  }}>
                    <Text style={{
                      color: transaction.details.status === 'Success' ? '#15803D' : '#DC2626',
                      fontSize: 12,
                      fontWeight: '600'
                    }}>
                      {transaction.details.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={{
            padding: 24,
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            flexDirection: 'row',
            gap: 12
          }}>
            <TouchableOpacity 
              style={{
                flex: 1,
                backgroundColor: downloading ? '#9CA3AF' : '#059669',
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center'
              }}
              onPress={handleDownloadReceipt}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator color="white" size="small" style={{ marginRight: 8 }} />
              ) : null}
              <Text style={{
                color: 'white',
                fontWeight: '600',
                fontSize: 16
              }}>{downloading ? 'Generating...' : 'Download Receipt'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={{
                flex: 1,
                backgroundColor: '#F3F4F6',
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center'
              }}
              onPress={handleDownloadReceipt}
            >
              <Text style={{
                color: '#374151',
                fontWeight: '600',
                fontSize: 16
              }}>Share Receipt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Updated Transaction Row with Modal Triggers and Calculation Display
const TransactionRow = ({ 
  transaction, 
  runningBalance,
  previousBalance,
  onPress 
}: { 
  transaction: any; 
  runningBalance: number;
  previousBalance: number;
  onPress: () => void;
}) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getRowStyle = () => {
    if (transaction.type === "balance") {
      return "bg-orange-50 border-l-4 border-orange-400";
    }
    return "bg-white border-l-4 border-transparent";
  };

  const getAmountColor = () => {
    switch (transaction.type) {
      case "balance":
        return "text-orange-800";
      case "invoice":
        return "text-red-600";
      case "payment":
        return "text-green-600";
      default:
        return "text-gray-900";
    }
  };

  const getBalanceColor = () => {
    return runningBalance > 0 ? "text-red-600" : "text-green-600";
  };

  const transactionIndex = transaction.details?.transactionIndex;

  return (
    <TouchableOpacity
      onPress={() => {
        console.log("Transaction row pressed:", transaction.id, transaction.type);
        onPress();
      }}
      activeOpacity={0.7}
      className={`${getRowStyle()} p-4 mb-2 mx-4 rounded-lg shadow-sm`}
    >
      {/* Header with Index */}
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            {transactionIndex && (
              <View className="bg-blue-100 px-2 py-1 rounded">
                <Text className="text-xs font-bold text-blue-700">#{transactionIndex}</Text>
              </View>
            )}
            <Text className={`text-base font-semibold ${
              transaction.type === "balance" ? "text-orange-800" : "text-gray-900"
            }`}>
              {transaction.type === "balance" ? "BF (Before Balance)" : transaction.id}
            </Text>
          </View>
          <Text className="text-sm text-gray-600 mt-1">
            {formatDate(transaction.date)}
          </Text>
        </View>
        
        <View className="items-end">
          <Text className={`text-lg font-bold ${getAmountColor()}`}>
            {transaction.type === "payment" ? "-" : transaction.type === "invoice" ? "+" : ""}₹{transaction.amount.toFixed(2)}
          </Text>
          {transaction.type === "payment" ? (
            <View className="mt-1">
              <Text className="text-xs font-medium" style={{ color: '#059669' }}>
                {transaction.details?.upiAmount > 0 && 'UPI'}
                {transaction.details?.cashAmount > 0 && 'Cash'}
                {transaction.details?.chequeAmount > 0 && 'Cheque'}
                {!transaction.details?.upiAmount && !transaction.details?.cashAmount && !transaction.details?.chequeAmount && 'Payment'}
              </Text>
            </View>
          ) : (
            <Text className="text-xs text-gray-500 mt-1">
              {transaction.type === "balance" ? "Opening" : 
               transaction.type === "invoice" ? "Invoice" : "Payment"}
            </Text>
          )}
        </View>
      </View>
      
      {/* Calculation Steps */}
      {transaction.type !== "balance" && (
        <View className="bg-gray-50 rounded-lg p-3 mb-2">
          <Text className="text-xs font-semibold text-gray-600 mb-2">📊 Calculation:</Text>
          <View className="space-y-1">
            <Text className="text-xs text-gray-700">
              Previous Balance: ₹{Math.abs(previousBalance).toFixed(2)} {previousBalance >= 0 ? "(Dr)" : "(Cr)"}
            </Text>
            <Text className={`text-xs font-medium ${
              transaction.type === "invoice" ? "text-red-600" : "text-green-600"
            }`}>
              {transaction.type === "invoice" ? "+" : "-"} {transaction.type === "invoice" ? "Invoice Amount" : "Payment Received"}: ₹{transaction.amount.toFixed(2)}
            </Text>
            <View className="border-t border-gray-300 pt-1 mt-1">
              <Text className="text-xs font-bold text-gray-800">
                = New Balance: ₹{Math.abs(runningBalance).toFixed(2)} {runningBalance >= 0 ? "(Dr)" : "(Cr)"}
              </Text>
            </View>
          </View>
        </View>
      )}
      
      {/* Description and Balance */}
      <View className="flex-row justify-between items-center pt-2 border-t border-gray-200">
        <Text className="text-sm text-gray-600 flex-1">
          {transaction.description}
        </Text>
        <View className="items-end ml-2">
          <Text className="text-xs text-gray-500">{transaction.type === "balance" ? "Opening" : "Current"} Balance</Text>
          <Text className={`text-lg font-bold ${getBalanceColor()}`}>
            ₹{Math.abs(runningBalance).toFixed(2)}{runningBalance < 0 ? " (Cr)" : " (Dr)"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function InvoicesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // State management
  const [selectedFilter, setSelectedFilter] = useState("3months");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<"start" | "end">("start");
  const [startDate, setStartDate] = useState(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Modal states
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [downloadingStatement, setDownloadingStatement] = useState(false);

  // Load invoices helper: accepts optional custom date range (Date objects)
  const loadInvoices = async (fromDate?: Date, toDate?: Date) => {
    setLoading(true);
    setError(null);
    try {
      console.log('📊 Loading invoices from API...');

      const toDt = toDate || new Date();
      const fromDt = fromDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      const fromDateTime = fromDt.getTime().toString();
      const toDateTime = toDt.getTime().toString();

      const res = await getInvoicesByCustomerAndDateRange(fromDateTime, toDateTime);

      if (!res || !res.success || !Array.isArray(res.invoices)) {
        throw new Error('Invalid response from API');
      }

      const apiInvoices = res.invoices;
      console.log('✅ Loaded', apiInvoices.length, 'invoices from API');

      // Log the first invoice structure to see actual field names
      if (apiInvoices.length > 0) {
        console.log('📋 First invoice fields:', Object.keys(apiInvoices[0]));
        console.log('📋 Sample invoice data:', JSON.stringify(apiInvoices[0], null, 2));
      }

      const firstInvoice = apiInvoices[0];
      const openingBalance = firstInvoice ? (firstInvoice.obAmount - firstInvoice.saleAmount) : 0;

      console.log('💰 Before Balance (BF) Calculation:', {
        obAmount: firstInvoice?.obAmount,
        saleAmount: firstInvoice?.saleAmount,
        calculatedBF: openingBalance
      });

      const allTransactions: Transaction[] = [];
      allTransactions.push({
        id: 'BF',
        amount: openingBalance,
        date: null,
        type: 'balance',
        description: 'Before Balance',
        details: { openingBalance: openingBalance, note: 'Outstanding balance brought forward' }
      });

      apiInvoices.forEach((inv: any, index: number) => {
        const transactionIndex = index + 1;

        // Always include invoices in the ledger, even when saleAmount is zero
        allTransactions.push({
          id: inv.invoiceNo || `INV-${inv.invoiceID}`,
          amount: Number(inv.saleAmount ?? 0),
          date: inv.invoiceDateString || null,
          type: 'invoice',
          description: `Grocery Order #${(inv.invoiceNo || '').split('-').pop() || inv.invoiceID}`,
          details: {
            transactionIndex,
            invoiceId: inv.invoiceID,
            invoiceNo: inv.invoiceNo,
            // Normalize various possible fields for invoice status
            invoiceStatus: (inv.InvoiceStatus ?? inv.invoiceStatus ?? inv.Status ?? inv.status ?? '').toString(),
            netInvoiceAmount: Number(inv.NetInvoiceAmount ?? inv.netInvoiceAmount ?? inv.saleAmount ?? 0),
            saleAmount: Number(inv.saleAmount ?? 0),
            balanceAmount: Number(inv.balanceAmount ?? 0),
            obAmount: Number(inv.obAmount ?? 0),
            upiAmount: Number(inv.upiAmount ?? 0),
            cashAmount: Number(inv.cashAmount ?? 0),
            chequeAmount: Number(inv.chequeAmount ?? 0),
            items: [],
            subtotal: Number(inv.saleAmount ?? 0),
            tax: 0,
            total: Number(inv.saleAmount ?? 0),
            customerInfo: { name: 'Customer', address: '', mobile: '' }
          }
        });

        const totalPayment = Number(inv.upiAmount || 0) + Number(inv.cashAmount || 0) + Number(inv.chequeAmount || 0);
        if (totalPayment > 0) {
          const paymentMethod = inv.upiAmount > 0 ? 'UPI' : inv.cashAmount > 0 ? 'Cash' : 'Cheque';
          allTransactions.push({
            id: `PMT-${String(transactionIndex).padStart(3, '0')}`,
            amount: totalPayment,
            date: inv.invoiceDateString || null,
            type: 'payment',
            description: 'Payment Received',
            details: {
              transactionIndex,
              paymentMethod,
              transactionId: `TXN${inv.invoiceID}`,
              paidBy: 'Customer',
              paymentDate: inv.invoiceDateString,
              bankReference: `REF${inv.invoiceID}`,
              status: 'Success',
              upiAmount: Number(inv.upiAmount || 0),
              cashAmount: Number(inv.cashAmount || 0),
              chequeAmount: Number(inv.chequeAmount || 0)
            }
          });
        }
      });

      console.log('✅ Total transactions:', allTransactions.length);
      setTransactions(allTransactions);
      setFilteredTransactions(allTransactions);
    } catch (err: any) {
      console.error('❌ Error loading invoices:', err);
      setError(err?.message || 'Failed to load invoices');
      setTransactions([]);
      setFilteredTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Run on mount with default last-90-days
  useEffect(() => {
    loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch invoices when custom date range is selected
  useEffect(() => {
    if (selectedFilter === 'custom') {
      console.log('🔁 Custom date range selected - re-fetching invoices for range:', startDate, endDate);
      loadInvoices(startDate, endDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilter, startDate, endDate]);

  const filterOptions = [
    { key: "7days", label: "Last 7 Days" },
    { key: "30days", label: "Last 30 Days" },
    { key: "3months", label: "Last 3 Months" },
    { key: "custom", label: "Custom Range" },
  ];

  const statusFilterOptions = [
    { key: "all", label: "All Status" },
    { key: "created", label: "Created" },
    { key: "paid", label: "Paid" },
    { key: "delivered", label: "Delivered" },
    { key: "cancelled", label: "Cancelled" },
  ];

  useEffect(() => {
    if (transactions.length > 0) {
      filterTransactions();
    }
  }, [selectedFilter, selectedStatus, startDate, endDate, transactions]);

  const filterTransactions = () => {
    let filtered = [...transactions];
    const now = new Date();
    
    console.log('🔍 Filtering transactions:', {
      total: transactions.length,
      filter: selectedFilter,
      currentDate: now.toISOString(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    
    switch (selectedFilter) {
      case "7days":
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = transactions.filter(transaction => 
          transaction.type === "balance" || new Date(transaction.date!) >= sevenDaysAgo
        );
        break;
      case "30days":
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = transactions.filter(transaction => 
          transaction.type === "balance" || new Date(transaction.date!) >= thirtyDaysAgo
        );
        break;
      case "3months":
        // For mock data testing, show all transactions (6 months back)
        const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        filtered = transactions.filter(transaction => 
          transaction.type === "balance" || new Date(transaction.date!) >= sixMonthsAgo
        );
        break;
      case "custom":
        filtered = transactions.filter(transaction => {
          if (transaction.type === "balance") return true;
          if (!transaction.date) return false;
          const transactionDate = new Date(transaction.date);
          // Normalize dates to compare only date parts (ignore time)
          const txDate = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate());
          const fromDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          const toDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          return txDate >= fromDate && txDate <= toDate;
        });
        break;
    }
    
    // Apply status filter
    if (selectedStatus && selectedStatus !== 'all') {
      filtered = filtered.filter(transaction => {
        if (transaction.type === 'invoice') {
          const invoiceStatus = (transaction.details?.invoiceStatus || '').toString().trim().toLowerCase();
          return invoiceStatus === selectedStatus;
        }
        return transaction.type === 'balance' || transaction.type === 'payment';
      });
    }
    
    console.log('✅ Filtered to', filtered.length, 'transactions (status:', selectedStatus || 'all', ')');
    setFilteredTransactions(filtered);
  };

  const handleDatePicker = (mode: "start" | "end") => {
    setDatePickerMode(mode);
    setDatePickerVisible(true);
  };

  const onDateConfirm = (date: Date) => {
    if (datePickerMode === "start") {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
    setDatePickerVisible(false);
  };

  const handleTransactionPress = (transaction: any) => {
    console.log("handleTransactionPress called with:", transaction.id, transaction.type);
    
    if (transaction.type === "balance") {
      console.log("Balance row clicked - no modal");
      return;
    }
    
    setSelectedTransaction(transaction);
    
    if (transaction.type === "invoice") {
      console.log("Setting invoice modal visible");
      setInvoiceModalVisible(true);
    } else if (transaction.type === "payment") {
      console.log("Setting payment modal visible");
      setPaymentModalVisible(true);
    }
  };

  // Calculate running balance for each transaction with previous balance tracking
  // Balance calculation: Opening Balance + Invoices - Payments
  // Positive balance = Customer owes us (Debit)
  // Negative balance = We owe customer / Customer has credit
  const getTransactionsWithBalance = () => {
    const sorted = [...filteredTransactions].sort((a, b) => {
      if (a.type === "balance") return -1;
      if (b.type === "balance") return 1;
      return new Date(a.date!).getTime() - new Date(b.date!).getTime();
    });

    let runningBalance = 0;
    return sorted.map((transaction, idx) => {
      const previousBalance = runningBalance;
      
      if (transaction.type === "balance") {
        // Opening balance - what customer already owes
        runningBalance = transaction.amount;
      } else if (transaction.type === "invoice") {
        // Invoice increases what customer owes
        runningBalance = runningBalance + transaction.amount;
      } else if (transaction.type === "payment") {
        // Payment reduces what customer owes
        runningBalance = runningBalance - transaction.amount;
      }
      
      console.log(`Transaction ${idx + 1}:`, {
        type: transaction.type,
        id: transaction.id,
        amount: transaction.amount,
        previousBalance,
        newBalance: runningBalance
      });
      
      return {
        ...transaction,
        runningBalance,
        previousBalance
      };
    });
  };

  const transactionsWithBalance = getTransactionsWithBalance();
  const currentBalance = transactionsWithBalance.length > 0 
    ? transactionsWithBalance[transactionsWithBalance.length - 1].runningBalance 
    : 0;

  const handleDownloadStatement = async () => {
    try {
      setDownloadingStatement(true);
      console.log('📄 Starting statement PDF generation...');
      console.log('📊 Transactions count:', filteredTransactions.length);

      if (filteredTransactions.length === 0) {
        Alert.alert('No Data', 'No transactions available for the selected period');
        return;
      }

      // Calculate summary totals
      const totalInvoices = filteredTransactions.filter(t => t.type === 'invoice').length;
      const totalPayments = filteredTransactions.filter(t => t.type === 'payment').length;
      const totalInvoiceAmount = filteredTransactions
        .filter(t => t.type === 'invoice')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalPaymentAmount = filteredTransactions
        .filter(t => t.type === 'payment')
        .reduce((sum, t) => sum + t.amount, 0);

      // Format date range for filename and display
      const formatDateForDisplay = (date: Date) => {
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
      };

      const dateRangeText = `${formatDateForDisplay(startDate)} to ${formatDateForDisplay(endDate)}`;
      const filenameDate = formatDateForFilename(endDate.toISOString());

      // Get customer name from AsyncStorage (store name)
      console.log('📝 DEBUG: Retrieving store name from AsyncStorage...');
      const selectedStoreName = await AsyncStorage.getItem('selectedStoreName');
      console.log('🏪 Store name from AsyncStorage:', selectedStoreName);
      
      const statementCustomerName = selectedStoreName || 'Customer';
      
      console.log('✅ Customer name for statement:', statementCustomerName);

      // Generate HTML content
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
              line-height: 1.6;
              color: #111827;
              padding: 40px;
              background: white;
            }
            .container { max-width: 900px; margin: 0 auto; }
            .header {
              border-bottom: 3px solid #15803D;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .company-name {
              font-size: 28px;
              font-weight: bold;
              color: #15803D;
              margin-bottom: 8px;
            }
            .statement-title {
              text-align: center;
              font-size: 24px;
              font-weight: bold;
              color: #111827;
              margin: 20px 0;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .date-range {
              text-align: center;
              font-size: 14px;
              color: #6b7280;
              margin-bottom: 30px;
            }
            .summary-boxes {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin-bottom: 30px;
            }
            .summary-box {
              padding: 20px;
              background: #f9fafb;
              border-radius: 8px;
              border-left: 4px solid #15803D;
            }
            .summary-label {
              font-size: 12px;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
            }
            .summary-value {
              font-size: 24px;
              font-weight: bold;
              color: #111827;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              background: white;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .table th {
              background: #15803D;
              color: white;
              padding: 12px;
              text-align: left;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .table td {
              padding: 12px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 13px;
            }
            .table tr:last-child td { border-bottom: none; }
            .invoice-row { background: #fef3c7; }
            .payment-row { background: #d1fae5; }
            .balance-row { background: #e0e7ff; }
            .amount-debit { color: #dc2626; font-weight: 600; }
            .amount-credit { color: #15803D; font-weight: 600; }
            .balance-col { font-weight: bold; }
            .footer {
              padding: 20px;
              background: #f3f4f6;
              text-align: center;
              font-size: 11px;
              color: #6b7280;
              border-radius: 8px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="company-name">Ceren Production Company</div>
              <div style="font-size: 12px; color: #6b7280;">Industrial Area, Phase 2, Bengaluru, Karnataka 560001</div>
            </div>

            <div class="statement-title">Account Statement - ${statementCustomerName}</div>
            <div class="date-range">${dateRangeText}</div>

            <div class="summary-boxes">
              <div class="summary-box">
                <div class="summary-label">Total Invoices</div>
                <div class="summary-value">${totalInvoices}</div>
                <div style="font-size: 14px; color: #6b7280; margin-top: 5px;">₹${totalInvoiceAmount.toFixed(2)}</div>
              </div>
              <div class="summary-box">
                <div class="summary-label">Total Payments</div>
                <div class="summary-value">${totalPayments}</div>
                <div style="font-size: 14px; color: #6b7280; margin-top: 5px;">₹${totalPaymentAmount.toFixed(2)}</div>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th style="width: 100px;">Date</th>
                  <th style="width: 150px;">Reference</th>
                  <th>Description</th>
                  <th style="width: 100px; text-align: right;">Debit</th>
                  <th style="width: 100px; text-align: right;">Credit</th>
                  <th style="width: 120px; text-align: right;">Balance</th>
                </tr>
              </thead>
              <tbody>
                ${transactionsWithBalance.map(transaction => {
                  const isInvoice = transaction.type === 'invoice';
                  const isBalance = transaction.type === 'balance';
                  const isPayment = transaction.type === 'payment';
                  
                  // For BF (balance) - blank date and description
                  const date = isBalance ? '' : new Date(transaction.date || new Date()).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  });
                  
                  // For payments - show payment mode instead of payment ID
                  let reference = transaction.id;
                  if (isPayment) {
                    const upi = transaction.details?.upiAmount > 0;
                    const cash = transaction.details?.cashAmount > 0;
                    const cheque = transaction.details?.chequeAmount > 0;
                    reference = upi ? 'UPI' : cash ? 'Cash' : cheque ? 'Cheque' : 'Payment';
                  }
                  
                  // Description - blank for BF
                  const description = isBalance ? '' : (isInvoice ? 'Invoice' : 'Payment Received');
                  
                  // Row styling
                  const rowClass = isBalance ? 'balance-row' : (isInvoice ? 'invoice-row' : 'payment-row');
                  
                  const debitAmount = isInvoice || isBalance ? '₹' + transaction.amount.toFixed(2) : '-';
                  const creditAmount = isPayment ? '₹' + transaction.amount.toFixed(2) : '-';
                  const balanceAmount = '₹' + transaction.runningBalance.toFixed(2);
                  
                  return '<tr class="' + rowClass + '">' +
                    '<td>' + date + '</td>' +
                    '<td>' + reference + '</td>' +
                    '<td>' + description + '</td>' +
                    '<td class="amount-debit" style="text-align: right;">' + debitAmount + '</td>' +
                    '<td class="amount-credit" style="text-align: right;">' + creditAmount + '</td>' +
                    '<td class="balance-col" style="text-align: right;">' + balanceAmount + '</td>' +
                  '</tr>';
                }).join('')}
              </tbody>
            </table>

            <!-- Total Amount Summary -->
            <div style="margin-top: 20px; padding: 20px; background: #f0fdf4; border-radius: 8px; border: 2px solid #15803D;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 18px; font-weight: bold; color: #15803D;">Total Amount =</span>
                <span style="font-size: 24px; font-weight: bold; color: #15803D;">₹${currentBalance.toFixed(2)}</span>
              </div>
            </div>

            <div class="footer">
              <p style="margin-top: 10px;">Generated on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      console.log('📄 HTML generated, creating PDF...');

      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html });
      console.log('✅ PDF created at:', uri);

      // Persist using new FileSystem API
      const filename = `Statement_${filenameDate}.pdf`;
      console.log('💾 Creating file:', filename);

      // Create file in document directory using new API
      const file = new File(Paths.document, filename);
      
      // Read the temp PDF content and write to permanent location
      const response = await fetch(uri);
      await file.write(await response.bytes());

      console.log('✅ File persisted successfully:', file.uri);

      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Statement',
          UTI: 'com.adobe.pdf'
        });
        console.log('✅ Statement shared successfully');
        Alert.alert('Success', 'Statement PDF downloaded successfully!');
      } else {
        console.log('❌ Sharing not available');
        Alert.alert('Success', `Statement saved to: ${filename}`);
      }
    } catch (error) {
      console.error('❌ Error generating statement:', error);
      Alert.alert(
        'Error',
        'Failed to generate statement PDF. Please try again.'
      );
    } finally {
      setDownloadingStatement(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View 
        className="bg-white px-4 pb-4 shadow-sm"
        style={{ paddingTop: insets.top + 16 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity 
            onPress={() => router.push('/shop')}
            className="p-2 -ml-2"
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 flex-1 text-center">
            Invoice Statement
          </Text>
          <TouchableOpacity 
            className="p-2"
            onPress={handleDownloadStatement}
            disabled={downloadingStatement}
          >
            {downloadingStatement ? (
              <ActivityIndicator size="small" color="#15803D" />
            ) : (
              <Ionicons name="download-outline" size={24} color="#6B7280" />
            )}
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        >
          {filterOptions.map((option) => (
            <FilterButton
              key={option.key}
              title={option.label}
              isActive={selectedFilter === option.key}
              onPress={() => setSelectedFilter(option.key)}
            />
          ))}
        </ScrollView>

        {/* Custom Date Range */}
        {selectedFilter === "custom" && (
          <View className="flex-row gap-3 mb-4">
            <TouchableOpacity 
              onPress={() => handleDatePicker("start")}
              className="flex-1 bg-gray-100 rounded-lg p-3"
            >
              <Text className="text-xs text-gray-600 mb-1">From</Text>
              <Text className="font-medium">
                {startDate.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => handleDatePicker("end")}
              className="flex-1 bg-gray-100 rounded-lg p-3"
            >
              <Text className="text-xs text-gray-600 mb-1">To</Text>
              <Text className="font-medium">
                {endDate.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Status Filter */}
        <View className="mb-2">
          <Text className="text-xs text-gray-600 mb-2 ml-1">Filter by Status</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
          >
            {statusFilterOptions.map((option) => (
              <FilterButton
                key={option.key}
                title={option.label}
                isActive={selectedStatus === option.key || (option.key === 'all' && !selectedStatus)}
                onPress={() => setSelectedStatus(option.key === 'all' ? null : option.key)}
              />
            ))}
          </ScrollView>
        </View>

      </View>

      {/* Current Balance Card */}
      {!loading && !error && (
        <View className="mx-4 mt-4 bg-red-50 rounded-2xl p-4 border border-red-100">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="trending-up" size={20} color="#DC2626" />
              <Text className="text-sm font-medium text-gray-700 ml-2">Current Balance</Text>
            </View>
            <View className="items-end">
              <Text className={`text-2xl font-bold ${currentBalance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₹{Math.abs(currentBalance).toFixed(2)}
              </Text>
              <Text className="text-xs text-gray-600 mt-1">
                {currentBalance >= 0 ? '(Due)' : '(Credit)'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Transactions List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <Ionicons name="hourglass-outline" size={48} color="#9CA3AF" />
          <Text className="text-lg text-gray-500 mt-3">Loading invoices...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-6">
          <Ionicons name="alert-circle" size={48} color="#F87171" />
          <Text className="text-lg text-gray-600 mt-3">{error}</Text>
        </View>
      ) : (
        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 16 }}
        >
          {transactionsWithBalance.length > 0 ? (
            transactionsWithBalance.map((transaction, index) => (
              <TransactionRow 
                key={`${transaction.id}-${index}`}
                transaction={transaction}
                runningBalance={transaction.runningBalance}
                previousBalance={transaction.previousBalance}
                onPress={() => handleTransactionPress(transaction)}
              />
            ))
          ) : (
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
              <Text className="text-xl font-medium text-gray-500 mt-4 mb-2">
                No invoices found
              </Text>
              <Text className="text-gray-400 text-center px-8">
                No invoices match your selected filter criteria
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Date Picker Modal */}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={onDateConfirm}
        onCancel={() => setDatePickerVisible(false)}
        date={datePickerMode === "start" ? startDate : endDate}
      />

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        visible={invoiceModalVisible}
        onClose={() => {
          console.log("Closing invoice modal");
          setInvoiceModalVisible(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
      />

      {/* Payment Detail Modal */}
      <PaymentDetailModal
        visible={paymentModalVisible}
        onClose={() => {
          console.log("Closing payment modal");
          setPaymentModalVisible(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
      />
    </View>
  );
}