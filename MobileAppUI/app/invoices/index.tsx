import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
// @ts-ignore
import DateTimePickerModal from "react-native-modal-datetime-picker";

const { height } = Dimensions.get('window');

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
  console.log("Invoice Modal - visible:", visible, "transaction:", transaction?.id);

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
              <Text style={{
                fontSize: 14,
                color: '#059669'
              }}>
                Due Date: {formatDate(transaction.details.dueDate)}
              </Text>
            </View>

            {/* Customer Information */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#111827',
                marginBottom: 12
              }}>
                Customer Information
              </Text>
              <View style={{
                backgroundColor: '#F9FAFB',
                borderRadius: 16,
                padding: 16
              }}>
                <Text style={{
                  fontWeight: '600',
                  color: '#111827',
                  fontSize: 16,
                  marginBottom: 8
                }}>
                  {transaction.details.customerInfo.name}
                </Text>
                <Text style={{
                  color: '#6B7280',
                  fontSize: 14,
                  marginBottom: 8,
                  lineHeight: 20
                }}>
                  {transaction.details.customerInfo.address}
                </Text>
                <Text style={{
                  color: '#6B7280',
                  fontSize: 14
                }}>
                  Mobile: {transaction.details.customerInfo.mobile}
                </Text>
              </View>
            </View>

            {/* Items List */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#111827',
                marginBottom: 12
              }}>
                Items
              </Text>
              {transaction.details.items.map((item: any, index: number) => (
                <View 
                  key={index} 
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: index < transaction.details.items.length - 1 ? 1 : 0,
                    borderBottomColor: '#F3F4F6'
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontWeight: '600',
                      color: '#111827',
                      fontSize: 16,
                      marginBottom: 4
                    }}>
                      {item.name}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: '#6B7280'
                    }}>
                      Qty: {item.quantity}
                    </Text>
                  </View>
                  <Text style={{
                    fontWeight: 'bold',
                    color: '#111827',
                    fontSize: 16
                  }}>
                    ₹{item.total.toFixed(2)}
                  </Text>
                </View>
              ))}
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

// Updated Transaction Row with Modal Triggers
const TransactionRow = ({ 
  transaction, 
  runningBalance, 
  onPress 
}: { 
  transaction: any; 
  runningBalance: number; 
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

  return (
    <TouchableOpacity
      onPress={() => {
        console.log("Transaction row pressed:", transaction.id, transaction.type);
        onPress();
      }}
      activeOpacity={0.7}
      className={`${getRowStyle()} p-4 mb-2 mx-4 rounded-lg shadow-sm`}
    >
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-1">
          <Text className={`text-base font-semibold ${
            transaction.type === "balance" ? "text-orange-800" : "text-gray-900"
          }`}>
            {transaction.type === "balance" ? "BF (Before Balance)" : transaction.id}
          </Text>
          <Text className="text-sm text-gray-600 mt-1">
            {formatDate(transaction.date)}
          </Text>
        </View>
        
        <View className="items-end">
          <Text className={`text-lg font-bold ${getAmountColor()}`}>
            {transaction.type === "payment" ? "-" : ""}₹{transaction.amount.toFixed(2)}
          </Text>
          <Text className="text-xs text-gray-500 mt-1">
            {transaction.type === "balance" ? "Opening" : 
             transaction.type === "invoice" ? "Invoice" : "Payment"}
          </Text>
        </View>
      </View>
      
      <View className="flex-row justify-between items-center pt-2 border-t border-gray-100">
        <Text className="text-sm text-gray-600">
          {transaction.description}
        </Text>
        <View className="items-end">
          <Text className="text-xs text-gray-500">Balance</Text>
          <Text className={`text-lg font-bold ${getBalanceColor()}`}>
            ₹{runningBalance.toFixed(2)}
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
  const [selectedFilter, setSelectedFilter] = useState("7days");
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<"start" | "end">("start");
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());
  const [filteredTransactions, setFilteredTransactions] = useState(mockTransactions);
  
  // Modal states
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

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
    let filtered = [...mockTransactions];
    const now = new Date();
    
    switch (selectedFilter) {
      case "7days":
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = mockTransactions.filter(transaction => 
          transaction.type === "balance" || new Date(transaction.date!) >= sevenDaysAgo
        );
        break;
      case "30days":
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = mockTransactions.filter(transaction => 
          transaction.type === "balance" || new Date(transaction.date!) >= thirtyDaysAgo
        );
        break;
      case "3months":
        const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        filtered = mockTransactions.filter(transaction => 
          transaction.type === "balance" || new Date(transaction.date!) >= threeMonthsAgo
        );
        break;
      case "custom":
        filtered = mockTransactions.filter(transaction => {
          if (transaction.type === "balance") return true;
          const transactionDate = new Date(transaction.date!);
          return transactionDate >= startDate && transactionDate <= endDate;
        });
        break;
    }
    
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

  // Calculate running balance for each transaction
  const getTransactionsWithBalance = () => {
    const sorted = [...filteredTransactions].sort((a, b) => {
      if (a.type === "balance") return -1;
      if (b.type === "balance") return 1;
      return new Date(a.date!).getTime() - new Date(b.date!).getTime();
    });

    let runningBalance = 0;
    return sorted.map(transaction => {
      if (transaction.type === "balance") {
        runningBalance = transaction.amount;
      } else if (transaction.type === "invoice") {
        runningBalance += transaction.amount;
      } else if (transaction.type === "payment") {
        runningBalance -= transaction.amount;
      }
      
      return {
        ...transaction,
        runningBalance
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
            Account Statement
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

        {/* Current Balance Summary */}
        <View className={`rounded-lg p-4 ${
          currentBalance > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
        }`}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons 
                name={currentBalance > 0 ? "trending-up" : "trending-down"} 
                size={20} 
                color={currentBalance > 0 ? "#DC2626" : "#059669"} 
              />
              <Text className={`ml-2 font-semibold ${
                currentBalance > 0 ? 'text-red-800' : 'text-green-800'
              }`}>
                Current Balance
              </Text>
            </View>
            <Text className={`text-xl font-bold ${
              currentBalance > 0 ? 'text-red-800' : 'text-green-800'
            }`}>
              ₹{Math.abs(currentBalance).toFixed(2)}
              {currentBalance > 0 ? " (Due)" : " (Credit)"}
            </Text>
          </View>
        </View>
      </View>

      {/* Transactions List */}
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
              onPress={() => handleTransactionPress(transaction)}
            />
          ))
        ) : (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
            <Text className="text-xl font-medium text-gray-500 mt-4 mb-2">
              No transactions found
            </Text>
            <Text className="text-gray-400 text-center px-8">
              No transactions match your selected filter criteria
            </Text>
          </View>
        )}
      </ScrollView>

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