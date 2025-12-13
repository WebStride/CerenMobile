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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
// @ts-ignore
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { getInvoices, getInvoiceItems, getInvoicesByCustomerAndDateRange } from '../../services/api';

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
            {/* Invoice Header Info */}
            <View style={{
              backgroundColor: '#F0FDF4',
              borderRadius: 16,
              padding: 20,
              marginBottom: 24
            }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
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
                    {formatDate(transaction.date)}
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
                    backgroundColor: '#BBF7D0',
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 20
                  }}>
                    <Text style={{
                      color: '#15803D',
                      fontSize: 12,
                      fontWeight: '600'
                    }}>
                      INVOICE
                    </Text>
                  </View>
                </View>
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
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 8
                    }}>
                      <Text style={{
                        fontWeight: '600',
                        color: '#111827',
                        fontSize: 14
                      }}>
                        Invoice ID:
                      </Text>
                      <Text style={{
                        color: '#6B7280',
                        fontSize: 14
                      }}>
                        {item.InvoiceID}
                      </Text>
                    </View>
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 8
                    }}>
                      <Text style={{
                        fontWeight: '600',
                        color: '#111827',
                        fontSize: 14
                      }}>
                        Product ID:
                      </Text>
                      <Text style={{
                        color: '#6B7280',
                        fontSize: 14
                      }}>
                        {item.ProductID}
                      </Text>
                    </View>
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8
                    }}>
                      <Text style={{
                        fontWeight: '600',
                        color: '#111827',
                        fontSize: 14
                      }}>
                        Product Name:
                      </Text>
                      <Text style={{
                        color: '#6B7280',
                        fontSize: 14,
                        flex: 1,
                        textAlign: 'right'
                      }}>
                        {item.ProductName || 'Unknown Product'}
                      </Text>
                    </View>
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8
                    }}>
                      <Text style={{
                        fontWeight: '600',
                        color: '#111827',
                        fontSize: 14
                      }}>
                        Product Image:
                      </Text>
                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        {item.ProductImage ? (
                          <Image source={{ uri: item.ProductImage }} style={{ width: 40, height: 40, borderRadius: 8 }} />
                        ) : (
                          <Image source={require('../../assets/images/Banana.png')} style={{ width: 40, height: 40, borderRadius: 8 }} />
                        )}
                      </View>
                    </View>
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 8
                    }}>
                      <Text style={{
                        fontWeight: '600',
                        color: '#111827',
                        fontSize: 14
                      }}>
                        Quantity:
                      </Text>
                      <Text style={{
                        color: '#6B7280',
                        fontSize: 14
                      }}>
                        {item.OrderQty}
                      </Text>
                    </View>
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 8
                    }}>
                      <Text style={{
                        fontWeight: '600',
                        color: '#111827',
                        fontSize: 14
                      }}>
                        Price:
                      </Text>
                      <Text style={{
                        color: '#6B7280',
                        fontSize: 14
                      }}>
                        ₹{item.Price}
                      </Text>
                    </View>
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 8
                    }}>
                      <Text style={{
                        fontWeight: '600',
                        color: '#111827',
                        fontSize: 14
                      }}>
                        Taxable Value:
                      </Text>
                      <Text style={{
                        color: '#6B7280',
                        fontSize: 14
                      }}>
                        ₹{item.TaxableValue}
                      </Text>
                    </View>
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      borderTopWidth: 1,
                      borderTopColor: '#E5E7EB',
                      paddingTop: 8
                    }}>
                      <Text style={{
                        fontWeight: 'bold',
                        color: '#111827',
                        fontSize: 16
                      }}>
                        Net Total:
                      </Text>
                      <Text style={{
                        fontWeight: 'bold',
                        color: '#059669',
                        fontSize: 16
                      }}>
                        ₹{item.NetTotal}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={{ textAlign: 'center', color: '#6B7280', padding: 20 }}>
                  No items found
                </Text>
              )}
            </View>

            {/* Total Summary */}
            <View style={{
              backgroundColor: '#F9FAFB',
              borderRadius: 16,
              padding: 16
            }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 8
              }}>
                <Text style={{ color: '#6B7280', fontSize: 14 }}>Subtotal:</Text>
                <Text style={{ 
                  fontWeight: '600', 
                  color: '#111827',
                  fontSize: 14
                }}>
                  ₹{transaction.details.subtotal.toFixed(2)}
                </Text>
              </View>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 12
              }}>
                <Text style={{ color: '#6B7280', fontSize: 14 }}>Tax:</Text>
                <Text style={{ 
                  fontWeight: '600', 
                  color: '#111827',
                  fontSize: 14
                }}>
                  ₹{transaction.details.tax.toFixed(2)}
                </Text>
              </View>
              <View style={{
                borderTopWidth: 1,
                borderTopColor: '#D1D5DB',
                paddingTop: 12,
                flexDirection: 'row',
                justifyContent: 'space-between'
              }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: '#111827'
                }}>Total:</Text>
                <Text style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: '#059669'
                }}>
                  ₹{transaction.details.total.toFixed(2)}
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
            <TouchableOpacity style={{
              flex: 1,
              backgroundColor: '#059669',
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center'
            }}>
              <Text style={{
                color: 'white',
                fontWeight: '600',
                fontSize: 16
              }}>Download PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{
              flex: 1,
              backgroundColor: '#F3F4F6',
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center'
            }}>
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

            {/* Payment Information */}
            <View>
              <View style={{
                backgroundColor: '#F9FAFB',
                borderRadius: 16,
                padding: 16
              }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: '#111827',
                  marginBottom: 16
                }}>
                  Payment Information
                </Text>
                
                <View style={{ gap: 12 }}>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between'
                  }}>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>Payment Method:</Text>
                    <Text style={{ 
                      fontWeight: '600', 
                      color: '#111827',
                      fontSize: 14
                    }}>
                      {transaction.details.paymentMethod}
                    </Text>
                  </View>
                  
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between'
                  }}>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>Transaction ID:</Text>
                    <Text style={{ 
                      fontWeight: '600', 
                      color: '#111827',
                      fontSize: 14
                    }}>
                      {transaction.details.transactionId}
                    </Text>
                  </View>
                  
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between'
                  }}>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>Paid By:</Text>
                    <Text style={{ 
                      fontWeight: '600', 
                      color: '#111827',
                      fontSize: 14
                    }}>
                      {transaction.details.paidBy}
                    </Text>
                  </View>
                  
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between'
                  }}>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>Bank Reference:</Text>
                    <Text style={{ 
                      fontWeight: '600', 
                      color: '#111827',
                      fontSize: 14
                    }}>
                      {transaction.details.bankReference}
                    </Text>
                  </View>
                  
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between'
                  }}>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>Status:</Text>
                    <Text style={{ 
                      fontWeight: '600', 
                      color: transaction.details.status === 'Success' ? '#059669' : '#DC2626',
                      fontSize: 14
                    }}>
                      {transaction.details.status}
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
            <TouchableOpacity style={{
              flex: 1,
              backgroundColor: '#059669',
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center'
            }}>
              <Text style={{
                color: 'white',
                fontWeight: '600',
                fontSize: 16
              }}>Download Receipt</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{
              flex: 1,
              backgroundColor: '#F3F4F6',
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center'
            }}>
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
          <Text className="text-xs text-gray-500 mt-1">
            {transaction.type === "balance" ? "Opening" : 
             transaction.type === "invoice" ? "Invoice" : "Payment"}
          </Text>
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
      
      {/* Click indicator for non-balance transactions */}
      {transaction.type !== "balance" && (
        <View className="flex-row items-center justify-center mt-2 pt-2 border-t border-gray-200">
          <Text className="text-xs text-gray-500 mr-1">
            Tap for details
          </Text>
          <Ionicons name="chevron-forward" size={12} color="#9CA3AF" />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function InvoicesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // State management
  const [selectedFilter, setSelectedFilter] = useState("3months");
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

  useEffect(() => {
    const loadInvoices = async () => {
      setLoading(true);
      setError(null);
      try {
        // MOCK DATA - Using provided JSON for testing calculations
        console.log('📊 Loading MOCK invoice data for testing...');
        
        const mockInvoices = [{"invoiceID":128511,"invoiceDate":638846260310000000,"invoiceDateString":"2025-06-04 09:27:11","invoiceNo":"M3-INV28232","saleAmount":1925,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":0,"balanceAmount":3620.6,"obAmount":3620.6,"invoiceItems":null},{"invoiceID":128700,"invoiceDate":638847985350000000,"invoiceDateString":"2025-06-06 09:22:15","invoiceNo":"M3-INV28382","saleAmount":2733.5,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":5546,"balanceAmount":-2812.5,"obAmount":808.1,"invoiceItems":null},{"invoiceID":128882,"invoiceDate":638850579420000000,"invoiceDateString":"2025-06-09 09:25:42","invoiceNo":"M3-INV28544","saleAmount":2035,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":2733,"balanceAmount":-698,"obAmount":110.1,"invoiceItems":null},{"invoiceID":129135,"invoiceDate":638852317900000000,"invoiceDateString":"2025-06-11 09:43:10","invoiceNo":"M3-INV28777","saleAmount":1045,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":2035,"balanceAmount":-990,"obAmount":-879.9,"invoiceItems":null},{"invoiceID":129323,"invoiceDate":638854042580000000,"invoiceDateString":"2025-06-13 09:37:38","invoiceNo":"M3-INV28851","saleAmount":1567.5,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":1045,"balanceAmount":522.5,"obAmount":-357.4,"invoiceItems":null},{"invoiceID":129559,"invoiceDate":638856643920000000,"invoiceDateString":"2025-06-16 09:53:12","invoiceNo":"M3-INV29057","saleAmount":1254,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":1567,"balanceAmount":-313,"obAmount":-670.4,"invoiceItems":null},{"invoiceID":129829,"invoiceDate":638858353070000000,"invoiceDateString":"2025-06-18 09:21:47","invoiceNo":"M3-INV29301","saleAmount":1804,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":1254,"balanceAmount":550,"obAmount":-120.4,"invoiceItems":null},{"invoiceID":130030,"invoiceDate":638860089050000000,"invoiceDateString":"2025-06-20 09:35:05","invoiceNo":"M3-INV29480","saleAmount":1886.5,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":1804,"balanceAmount":82.5,"obAmount":-37.9,"invoiceItems":null},{"invoiceID":130242,"invoiceDate":638862694120000000,"invoiceDateString":"2025-06-23 09:56:52","invoiceNo":"M6-INV10372","saleAmount":1683,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":1887,"balanceAmount":-204,"obAmount":-241.9,"invoiceItems":null},{"invoiceID":130485,"invoiceDate":638864444800000000,"invoiceDateString":"2025-06-25 10:34:40","invoiceNo":"M2-INV27020","saleAmount":2651,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":1683,"balanceAmount":968,"obAmount":726.1,"invoiceItems":null},{"invoiceID":130638,"invoiceDate":638866140440000000,"invoiceDateString":"2025-06-27 09:40:44","invoiceNo":"M6-INV10577","saleAmount":1870,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":2651,"balanceAmount":-781,"obAmount":-54.9,"invoiceItems":null},{"invoiceID":130839,"invoiceDate":638868724660000000,"invoiceDateString":"2025-06-30 09:27:46","invoiceNo":"M3-INV29640","saleAmount":1111,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":1870,"balanceAmount":-759,"obAmount":-813.9,"invoiceItems":null},{"invoiceID":131079,"invoiceDate":638870459200000000,"invoiceDateString":"2025-07-02 09:38:40","invoiceNo":"M3-INV29713","saleAmount":3068,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":1111,"balanceAmount":1957,"obAmount":1143.1,"invoiceItems":null},{"invoiceID":131080,"invoiceDate":638870459210000000,"invoiceDateString":"2025-07-02 09:38:41","invoiceNo":"M3-INV29714","saleAmount":0,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":0,"balanceAmount":0,"obAmount":1143.1,"invoiceItems":null},{"invoiceID":131504,"invoiceDate":638873058110000000,"invoiceDateString":"2025-07-05 09:50:11","invoiceNo":"M3-INV30090","saleAmount":2372.9,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":0,"balanceAmount":2372.9,"obAmount":3516,"invoiceItems":null},{"invoiceID":131536,"invoiceDate":638874772200000000,"invoiceDateString":"2025-07-07 09:27:00","invoiceNo":"M3-INV30111","saleAmount":2354.6,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":5441,"balanceAmount":-3086.4,"obAmount":429.6,"invoiceItems":null},{"invoiceID":131808,"invoiceDate":638876516330000000,"invoiceDateString":"2025-07-09 09:53:53","invoiceNo":"M3-INV30348","saleAmount":2196,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":2354,"balanceAmount":-158,"obAmount":271.6,"invoiceItems":null},{"invoiceID":132054,"invoiceDate":638878280870000000,"invoiceDateString":"2025-07-11 10:54:47","invoiceNo":"M3-INV30566","saleAmount":2684.6,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":0,"balanceAmount":2684.6,"obAmount":2956.2,"invoiceItems":null},{"invoiceID":132244,"invoiceDate":638880830950000000,"invoiceDateString":"2025-07-14 09:44:55","invoiceNo":"M3-INV30729","saleAmount":1382.6,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":4881,"balanceAmount":-3498.4,"obAmount":-542.2,"invoiceItems":null},{"invoiceID":132664,"invoiceDate":638884277810000000,"invoiceDateString":"2025-07-18 09:29:41","invoiceNo":"M5-INV03150","saleAmount":2608.2,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":0,"balanceAmount":2608.2,"obAmount":2066,"invoiceItems":null},{"invoiceID":132893,"invoiceDate":638886880630000000,"invoiceDateString":"2025-07-21 09:47:43","invoiceNo":"M2-INV27342","saleAmount":2244,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":3990,"balanceAmount":-1746,"obAmount":320,"invoiceItems":null},{"invoiceID":133152,"invoiceDate":638888615880000000,"invoiceDateString":"2025-07-23 09:59:48","invoiceNo":"M2-INV27573","saleAmount":1485,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":0,"balanceAmount":1485,"obAmount":1805,"invoiceItems":null},{"invoiceID":133311,"invoiceDate":638890334940000000,"invoiceDateString":"2025-07-25 09:44:54","invoiceNo":"M2-INV27697","saleAmount":1375,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":3729,"balanceAmount":-2354,"obAmount":-549,"invoiceItems":null},{"invoiceID":133781,"invoiceDate":638894655210000000,"invoiceDateString":"2025-07-30 09:45:21","invoiceNo":"M3-INV30833","saleAmount":3469.2,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":1375,"balanceAmount":2094.2,"obAmount":1545.2,"invoiceItems":null},{"invoiceID":133990,"invoiceDate":638896381770000000,"invoiceDateString":"2025-08-01 09:42:57","invoiceNo":"M3-INV30992","saleAmount":1616.6,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":3469,"balanceAmount":-1852.4,"obAmount":-307.2,"invoiceItems":null},{"invoiceID":134199,"invoiceDate":638898960710000000,"invoiceDateString":"2025-08-04 09:21:11","invoiceNo":"M3-INV31174","saleAmount":1888,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":1616,"balanceAmount":272,"obAmount":-35.2,"invoiceItems":null},{"invoiceID":134495,"invoiceDate":638900717190000000,"invoiceDateString":"2025-08-06 10:08:39","invoiceNo":"M3-INV31439","saleAmount":1947,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":1888,"balanceAmount":59,"obAmount":23.8,"invoiceItems":null},{"invoiceID":134738,"invoiceDate":638902415740000000,"invoiceDateString":"2025-08-08 09:19:34","invoiceNo":"M3-INV31639","saleAmount":0,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":0,"balanceAmount":0,"obAmount":23.8,"invoiceItems":null},{"invoiceID":134921,"invoiceDate":638905036080000000,"invoiceDateString":"2025-08-11 10:06:48","invoiceNo":"M3-INV31797","saleAmount":3266.4,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":0,"balanceAmount":3266.4,"obAmount":3290.2,"invoiceItems":null},{"invoiceID":0,"invoiceDate":638905872220000000,"invoiceDateString":"2025-08-12 09:20:22","invoiceNo":"","saleAmount":0,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":1947,"balanceAmount":-1947,"obAmount":1343.2,"invoiceItems":null},{"invoiceID":135382,"invoiceDate":638908506100000000,"invoiceDateString":"2025-08-15 10:30:10","invoiceNo":"M3-INV32183","saleAmount":3186,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":0,"balanceAmount":3186,"obAmount":4529.2,"invoiceItems":null},{"invoiceID":0,"invoiceDate":638909334430000000,"invoiceDateString":"2025-08-16 09:30:43","invoiceNo":"","saleAmount":0,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":3266,"balanceAmount":-3266,"obAmount":1263.2,"invoiceItems":null},{"invoiceID":135628,"invoiceDate":638911066810000000,"invoiceDateString":"2025-08-18 09:38:01","invoiceNo":"M3-INV32398","saleAmount":2690.4,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":3188,"balanceAmount":-497.6,"obAmount":765.6,"invoiceItems":null},{"invoiceID":136102,"invoiceDate":638914522590000000,"invoiceDateString":"2025-08-22 09:37:39","invoiceNo":"M3-INV32803","saleAmount":3469.2,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":2690,"balanceAmount":779.2,"obAmount":1544.8,"invoiceItems":null},{"invoiceID":136340,"invoiceDate":638917122680000000,"invoiceDateString":"2025-08-25 09:51:08","invoiceNo":"M3-INV33002","saleAmount":2006,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":3469,"balanceAmount":-1463,"obAmount":81.8,"invoiceItems":null},{"invoiceID":136627,"invoiceDate":638918888800000000,"invoiceDateString":"2025-08-27 10:54:40","invoiceNo":"M5-INV03463","saleAmount":1705.1,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":0,"balanceAmount":1705.1,"obAmount":1786.9,"invoiceItems":null},{"invoiceID":136850,"invoiceDate":638920608980000000,"invoiceDateString":"2025-08-29 10:41:38","invoiceNo":"M3-INV33411","saleAmount":1792,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":0,"balanceAmount":1792,"obAmount":3578.9,"invoiceItems":null},{"invoiceID":137501,"invoiceDate":638924903270000000,"invoiceDateString":"2025-09-03 09:58:47","invoiceNo":"M3-INV33954","saleAmount":2632,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":5503,"balanceAmount":-2871,"obAmount":707.9,"invoiceItems":null},{"invoiceID":137829,"invoiceDate":638929231220000000,"invoiceDateString":"2025-09-08 10:12:02","invoiceNo":"M2-INV28136","saleAmount":3057.6,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":0,"balanceAmount":3057.6,"obAmount":3765.5,"invoiceItems":null},{"invoiceID":138076,"invoiceDate":638930965790000000,"invoiceDateString":"2025-09-10 10:22:59","invoiceNo":"M3-INV34182","saleAmount":2784,"cancelAmount":0,"returnAmount":0,"discountAmount":0,"cashAmount":0,"chequeAmount":0,"upiAmount":0,"balanceAmount":2784,"obAmount":6549.5,"invoiceItems":null}];
        
        console.log('✅ Using', mockInvoices.length, 'mock invoices');
        
        // Calculate the actual Before Balance (BF)
        // BF = obAmount (opening balance before this invoice) - saleAmount (current invoice)
        // This gives us the balance before any transactions in this list
        const firstInvoice = mockInvoices[0];
        const openingBalance = firstInvoice 
          ? (firstInvoice.obAmount - firstInvoice.saleAmount) 
          : 0;
        
        console.log('💰 Before Balance (BF) Calculation:', {
          obAmount: firstInvoice?.obAmount,
          saleAmount: firstInvoice?.saleAmount,
          calculatedBF: openingBalance
        });
          
          // Create all transactions (invoices + payments)
          const allTransactions: Transaction[] = [];
          
          // Add opening balance (BF - Before Balance)
          allTransactions.push({
            id: "BF",
            amount: openingBalance,
            date: null,
            type: "balance",
            description: "Before Balance",
            details: {
              openingBalance: openingBalance,
              note: "Outstanding balance brought forward"
            }
          });
          
          // Process each invoice with transaction index
          mockInvoices.forEach((inv: any, index: number) => {
            const transactionIndex = index + 1; // 1-based index for display
            
            // Add invoice (skip if sale amount is 0)
            if (inv.saleAmount > 0) {
              allTransactions.push({
              id: inv.invoiceNo || `INV-${inv.invoiceID}`,
              amount: Number(inv.saleAmount || 0),
              date: inv.invoiceDateString || null,
              type: "invoice",
              description: `Grocery Order #${(inv.invoiceNo || '').split('-').pop() || inv.invoiceID}`,
              details: {
                transactionIndex: transactionIndex,
                invoiceId: inv.invoiceID,
                invoiceNo: inv.invoiceNo,
                saleAmount: Number(inv.saleAmount || 0),
                balanceAmount: Number(inv.balanceAmount || 0),
                obAmount: Number(inv.obAmount || 0),
                upiAmount: Number(inv.upiAmount || 0),
                cashAmount: Number(inv.cashAmount || 0),
                chequeAmount: Number(inv.chequeAmount || 0),
                items: [],
                subtotal: Number(inv.saleAmount || 0),
                tax: 0,
                total: Number(inv.saleAmount || 0),
                customerInfo: {
                  name: "Customer",
                  address: "",
                  mobile: ""
                }
              }
              });
            }
            
            // Add payment if exists
            const totalPayment = Number(inv.upiAmount || 0) + Number(inv.cashAmount || 0) + Number(inv.chequeAmount || 0);
            if (totalPayment > 0) {
              const paymentMethod = inv.upiAmount > 0 ? "UPI" : inv.cashAmount > 0 ? "Cash" : "Cheque";
              allTransactions.push({
                id: `PMT-${String(transactionIndex).padStart(3, '0')}`,
                amount: totalPayment,
                date: inv.invoiceDateString || null,
                type: "payment",
                description: "Payment Received",
                details: {
                  transactionIndex: transactionIndex,
                  paymentMethod: paymentMethod,
                  transactionId: `TXN${inv.invoiceID}`,
                  paidBy: "Customer",
                  paymentDate: inv.invoiceDateString,
                  bankReference: `REF${inv.invoiceID}`,
                  status: "Success",
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
        
        /* COMMENTED - Real API call for when endpoint has data
        const toDate = new Date();
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 90);
        const fromDateTime = fromDate.getTime().toString();
        const toDateTime = toDate.getTime().toString();
        const res = await getInvoicesByCustomerAndDateRange(fromDateTime, toDateTime);
        if (res && res.success && Array.isArray(res.invoices)) {
          // Process real API data...
        }
        */
      } catch (err: any) {
        console.error('❌ Error loading invoices:', err);
        setError(err?.message || 'Failed to load invoices');
        setTransactions([]);
        setFilteredTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, []);

  const filterOptions = [
    { key: "7days", label: "Last 7 Days" },
    { key: "30days", label: "Last 30 Days" },
    { key: "3months", label: "Last 3 Months" },
    { key: "custom", label: "Custom Range" },
  ];

  useEffect(() => {
    filterTransactions();
  }, [selectedFilter, startDate, endDate]);

  const filterTransactions = () => {
    let filtered = [...transactions];
    const now = new Date();
    
    console.log('🔍 Filtering transactions:', {
      total: transactions.length,
      filter: selectedFilter,
      currentDate: now.toISOString()
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
          const transactionDate = new Date(transaction.date!);
          return transactionDate >= startDate && transactionDate <= endDate;
        });
        break;
    }
    
    console.log('✅ Filtered to', filtered.length, 'transactions');
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

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View 
        className="bg-white px-4 pb-4 shadow-sm"
        style={{ paddingTop: insets.top + 16 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="p-2 -ml-2"
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 flex-1 text-center">
            Invoice Statement
          </Text>
          <TouchableOpacity className="p-2">
            <Ionicons name="download-outline" size={24} color="#6B7280" />
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