import React, { useState } from "react";
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  Modal,
  Pressable,
  Alert,
  TextInput,
  ActivityIndicator,
  Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getUserAddresses,
  deleteUserAddress,
  updateUserAddress
} from "@/services/api";

const { height, width } = Dimensions.get('window');

interface Address {
  DeliveryAddressID: number;
  UserID: number;
  HouseNumber?: string;
  BuildingBlock?: string;
  PinCode?: string;
  Landmark?: string;
  City: string;
  District: string;
  SaveAs?: string;
  IsDefault: boolean;
  Active: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  CurrentLocation?: string;
  CurrentAddress?: string;
  Name?: string;
  PhoneNumber?: string;
}

// ---------- Location Selection Modal ----------
const LocationModal = ({
  visible,
  onClose,
  onSelectAddress,
  onAddNewAddress
}: {
  visible: boolean;
  onClose: () => void;
  onSelectAddress: (address: any) => void;
  onAddNewAddress?: () => void;
}) => {
  const [searchText, setSearchText] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState<number | null>(null);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phoneNumber: '',
    houseNumber: '',
    buildingBlock: '',
    landmark: '',
    city: '',
    district: '',
    pinCode: '',
    saveAs: 'home'
  });
  const insets = useSafeAreaInsets();

  // Fetch user addresses when modal opens
  React.useEffect(() => {
    if (visible) {
      fetchUserAddresses();
    }
  }, [visible]);

  const fetchUserAddresses = async () => {
    try {
      setAddressesLoading(true);
      const addresses = await getUserAddresses();
      setSavedAddresses(addresses.addresses || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      Alert.alert('Error', 'Failed to load addresses');
    } finally {
      setAddressesLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    onSelectAddress({
      id: 'current',
      label: 'Current Location',
      address: 'Greenville'
    });
    onClose();
  };

  const handleMenuToggle = (addressId: number) => {
    setMenuVisible(menuVisible === addressId ? null : addressId);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setEditForm({
      name: address.Name || '',
      phoneNumber: address.PhoneNumber || '',
      houseNumber: address.HouseNumber || '',
      buildingBlock: address.BuildingBlock || '',
      landmark: address.Landmark || '',
      city: address.City,
      district: address.District,
      pinCode: address.PinCode || '',
      saveAs: address.SaveAs || 'home'
    });
    setMenuVisible(null);
  };

  const handleDeleteAddress = (addressId: number) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteUserAddress(addressId);
              if (result.success) {
                await fetchUserAddresses();
                Alert.alert('Success', 'Address deleted successfully');
              } else {
                Alert.alert('Error', result.message || 'Failed to delete address');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete address');
            }
          }
        }
      ]
    );
    setMenuVisible(null);
  };

  const handleSaveEdit = async () => {
    if (!editingAddress) return;

    try {
      const result = await updateUserAddress(editingAddress.DeliveryAddressID, editForm);
      if (result.success) {
        await fetchUserAddresses();
        setEditingAddress(null);
        Alert.alert('Success', 'Address updated successfully');
      } else {
        Alert.alert('Error', result.message || 'Failed to update address');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update address');
    }
  };

  const handleCancelEdit = () => {
    setEditingAddress(null);
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={false}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end'
      }}>
        {/* Background touchable to close modal */}
        <Pressable 
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }} 
          onPress={() => {
            onClose();
            setMenuVisible(null);
            setEditingAddress(null);
          }}
        />
        {/* Modal content */}
        <View style={{
          backgroundColor: 'white',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          height: height * 0.75,
          paddingBottom: 100 + insets.bottom,
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 24,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB'
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#111827'
            }}>Select delivery location</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F3F4F6',
            borderRadius: 12,
            marginHorizontal: 24,
            marginVertical: 16,
            paddingHorizontal: 16,
            height: 48
          }}>
            <Ionicons name="search" size={20} color="#888" />
            <TextInput
              style={{
                flex: 1,
                marginLeft: 8,
                fontSize: 16,
                color: '#111827'
              }}
              placeholder="Search for area, street name..."
              placeholderTextColor="#888"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 20
            }}
          >
            {/* Use Current Location */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 24,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#F3F4F6'
              }}
              onPress={handleUseCurrentLocation}
              activeOpacity={0.7}
            >
              <View style={{
                backgroundColor: '#DCFCE7',
                padding: 12,
                borderRadius: 50,
                marginRight: 16
              }}>
                <Ionicons name="location" size={20} color="#16a34a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: '#16a34a',
                  fontSize: 16,
                  fontWeight: '600',
                  marginBottom: 4
                }}>Use your current location</Text>
                <Text style={{
                  color: '#6B7280',
                  fontSize: 14
                }}>Greenville</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#888" />
            </TouchableOpacity>

            {/* Add New Address */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 24,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#F3F4F6'
              }}
              onPress={() => {
                if (onAddNewAddress) {
                  onAddNewAddress();
                } else {
                  console.log("Add new address");
                }
                onClose();
              }}
              activeOpacity={0.7}
            >
              <View style={{
                backgroundColor: '#DCFCE7',
                padding: 12,
                borderRadius: 50,
                marginRight: 16
              }}>
                <Ionicons name="add" size={20} color="#16a34a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: '#16a34a',
                  fontSize: 16,
                  fontWeight: '600'
                }}>Add new address</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#888" />
            </TouchableOpacity>

            {/* Saved Addresses Section Header */}
            <Text style={{
              color: '#9CA3AF',
              fontSize: 12,
              fontWeight: '500',
              textTransform: 'uppercase',
              paddingHorizontal: 24,
              paddingTop: 24,
              paddingBottom: 12,
              letterSpacing: 0.5
            }}>
              YOUR SAVED ADDRESSES
            </Text>

            {/* Saved Addresses */}
            {addressesLoading ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#BCD042" />
                <Text style={{ marginTop: 8, color: '#6B7280', fontSize: 14 }}>
                  Loading addresses...
                </Text>
              </View>
            ) : savedAddresses.length > 0 ? (
              savedAddresses.map((address) => (
                editingAddress?.DeliveryAddressID === address.DeliveryAddressID ? (
                  // Edit Form
                  <View key={address.DeliveryAddressID} style={{
                    paddingHorizontal: 24,
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: '#F3F4F6'
                  }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: 16
                    }}>
                      Edit Address
                    </Text>

                    <View style={{ marginBottom: 12 }}>
                      <Text style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>Save As</Text>
                      <TextInput
                        style={{
                          borderWidth: 1,
                          borderColor: '#D1D5DB',
                          borderRadius: 8,
                          padding: 12,
                          fontSize: 16
                        }}
                        value={editForm.saveAs}
                        onChangeText={(text) => setEditForm(prev => ({ ...prev, saveAs: text }))}
                        placeholder="e.g., Home, Work, Shop"
                      />
                    </View>

                    <View style={{ marginBottom: 12 }}>
                      <Text style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>Name</Text>
                      <TextInput
                        style={{
                          borderWidth: 1,
                          borderColor: '#D1D5DB',
                          borderRadius: 8,
                          padding: 12,
                          fontSize: 16
                        }}
                        value={editForm.name}
                        onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                        placeholder="Contact person name"
                      />
                    </View>

                    <View style={{ marginBottom: 12 }}>
                      <Text style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>Phone Number</Text>
                      <TextInput
                        style={{
                          borderWidth: 1,
                          borderColor: '#D1D5DB',
                          borderRadius: 8,
                          padding: 12,
                          fontSize: 16
                        }}
                        value={editForm.phoneNumber}
                        onChangeText={(text) => setEditForm(prev => ({ ...prev, phoneNumber: text }))}
                        placeholder="Phone number"
                        keyboardType="phone-pad"
                      />
                    </View>

                    <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <TextInput
                          style={{
                            borderWidth: 1,
                            borderColor: '#D1D5DB',
                            borderRadius: 8,
                            padding: 12,
                            fontSize: 16
                          }}
                          value={editForm.houseNumber}
                          onChangeText={(text) => setEditForm(prev => ({ ...prev, houseNumber: text }))}
                          placeholder="House/Flat No."
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <TextInput
                          style={{
                            borderWidth: 1,
                            borderColor: '#D1D5DB',
                            borderRadius: 8,
                            padding: 12,
                            fontSize: 16
                          }}
                          value={editForm.buildingBlock}
                          onChangeText={(text) => setEditForm(prev => ({ ...prev, buildingBlock: text }))}
                          placeholder="Building/Block"
                        />
                      </View>
                    </View>

                    <View style={{ marginBottom: 12 }}>
                      <Text style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>Landmark</Text>
                      <TextInput
                        style={{
                          borderWidth: 1,
                          borderColor: '#D1D5DB',
                          borderRadius: 8,
                          padding: 12,
                          fontSize: 16
                        }}
                        value={editForm.landmark}
                        onChangeText={(text) => setEditForm(prev => ({ ...prev, landmark: text }))}
                        placeholder="Landmark (optional)"
                      />
                    </View>

                    <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <TextInput
                          style={{
                            borderWidth: 1,
                            borderColor: '#D1D5DB',
                            borderRadius: 8,
                            padding: 12,
                            fontSize: 16
                          }}
                          value={editForm.city}
                          onChangeText={(text) => setEditForm(prev => ({ ...prev, city: text }))}
                          placeholder="City"
                        />
                      </View>
                    </View>

                    <View style={{ marginBottom: 16 }}>
                      <TextInput
                        style={{
                          borderWidth: 1,
                          borderColor: '#D1D5DB',
                          borderRadius: 8,
                          padding: 12,
                          fontSize: 16
                        }}
                        value={editForm.pinCode}
                        onChangeText={(text) => setEditForm(prev => ({ ...prev, pinCode: text }))}
                        placeholder="Pin Code"
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          backgroundColor: '#F3F4F6',
                          padding: 12,
                          borderRadius: 8,
                          marginRight: 8,
                          alignItems: 'center'
                        }}
                        onPress={handleCancelEdit}
                      >
                        <Text style={{ color: '#374151', fontWeight: '600' }}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          backgroundColor: '#16a34a',
                          padding: 12,
                          borderRadius: 8,
                          marginLeft: 8,
                          alignItems: 'center'
                        }}
                        onPress={handleSaveEdit}
                      >
                        <Text style={{ color: 'white', fontWeight: '600' }}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  // Address Display
                  <View key={address.DeliveryAddressID} style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    paddingHorizontal: 24,
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: '#F3F4F6'
                  }}>
                    <TouchableOpacity
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start' }}
                      onPress={() => {
                        onSelectAddress(address);
                        onClose();
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={{
                        backgroundColor: address.IsDefault ? '#DCFCE7' : '#F3F4F6',
                        padding: 12,
                        borderRadius: 50,
                        marginRight: 16,
                        marginTop: 2
                      }}>
                        <Ionicons 
                          name="location" 
                          size={20} 
                          color={address.IsDefault ? "#16a34a" : "#6B7280"} 
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <Text style={{
                            color: '#111827',
                            fontSize: 16,
                            fontWeight: '600',
                            marginRight: 8
                          }}>
                            {address.SaveAs || 'Address'}
                          </Text>
                          {address.IsDefault && (
                            <View style={{
                              backgroundColor: '#DCFCE7',
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 12
                            }}>
                              <Text style={{
                                color: '#16a34a',
                                fontSize: 12,
                                fontWeight: '600'
                              }}>
                                Default
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={{
                          color: '#6B7280',
                          fontSize: 14,
                          lineHeight: 20
                        }}>
                          {[
                            address.HouseNumber,
                            address.BuildingBlock,
                            address.Landmark,
                            `${address.City}, ${address.District}`,
                            address.PinCode
                          ].filter(Boolean).join(', ')}
                        </Text>
                        {(address.Name || address.PhoneNumber) && (
                          <Text style={{
                            color: '#9CA3AF',
                            fontSize: 12,
                            marginTop: 4
                          }}>
                            {[address.Name, address.PhoneNumber].filter(Boolean).join(' • ')}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>

                    {/* Three dots menu */}
                    <TouchableOpacity
                      style={{
                        padding: 8,
                        marginLeft: 8
                      }}
                      onPress={() => handleMenuToggle(address.DeliveryAddressID)}
                    >
                      <Ionicons name="ellipsis-vertical" size={20} color="#9CA3AF" />
                    </TouchableOpacity>

                    {/* Menu options */}
                    {menuVisible === address.DeliveryAddressID && (
                      <View style={{
                        position: 'absolute',
                        right: 24,
                        top: 50,
                        backgroundColor: 'white',
                        borderRadius: 8,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 4,
                        elevation: 5,
                        minWidth: 120,
                        zIndex: 1000
                      }}>
                        <TouchableOpacity
                          style={{
                            padding: 12,
                            borderBottomWidth: 1,
                            borderBottomColor: '#F3F4F6'
                          }}
                          onPress={() => handleEditAddress(address)}
                        >
                          <Text style={{ color: '#374151', fontSize: 14 }}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{
                            padding: 12
                          }}
                          onPress={() => handleDeleteAddress(address.DeliveryAddressID)}
                        >
                          <Text style={{ color: '#EF4444', fontSize: 14 }}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )
              ))
            ) : (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Ionicons name="location-outline" size={48} color="#D1D5DB" />
                <Text style={{
                  marginTop: 12,
                  fontSize: 16,
                  color: '#6B7280',
                  textAlign: 'center'
                }}>
                  No saved addresses found
                </Text>
                <Text style={{
                  marginTop: 4,
                  fontSize: 14,
                  color: '#9CA3AF',
                  textAlign: 'center'
                }}>
                  Add your first address to get started
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default function AccountScreen() {
  const router = useRouter();
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);

  // Mock user data - replace with actual user data from your auth context
  const userData = {
    name: "Amitav Panda",
    email: "pandaamitav01@gmail.com",
    mobile: "+917077404655",
    gender: "Male",
    customerType: "General",
    address: "121221, asdf, asdfasdf, Marathahalli, Bengaluru, Karnataka, India",
    profileImage: require("../../assets/images/ProfileImageHomeScreen.png")
  };

  const handleSelectAddress = (address: any) => {
    console.log("Selected address:", address);
    // Handle address selection if needed
  };

  const handleAddNewAddress = async () => {
    console.log("🖱️ Add new address button clicked from account");
    console.log("👤 Current userData state:", userData);

    let currentUserData = userData;

    // If userData is not available, try to load it from AsyncStorage
    if (!currentUserData || !currentUserData.name || !currentUserData.mobile) {
      console.log("🔄 User data not available or incomplete, trying to load from AsyncStorage...");
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData) {
          currentUserData = JSON.parse(storedUserData);
          console.log("✅ Loaded user data from AsyncStorage:", currentUserData);
        } else {
          // Check if user is logged in at all
          const accessToken = await AsyncStorage.getItem('accessToken');
          if (!accessToken) {
            console.log("❌ User not logged in, redirecting to login");
            Alert.alert(
              "Session Expired",
              "Please log in again to continue.",
              [
                {
                  text: "Login",
                  onPress: () => router.push("/OnboardingScreen")
                }
              ]
            );
            return;
          }
        }
      } catch (error) {
        console.error("❌ Failed to load user data from AsyncStorage:", error);
      }
    }

    if (!currentUserData || !currentUserData.name || !currentUserData.mobile) {
      console.log("❌ User data still not available, cannot add address");
      Alert.alert(
        "Session Error",
        "Unable to load user information. This might be due to corrupted data.",
        [
          {
            text: "Retry",
            onPress: () => {
              handleAddNewAddress(); // Try to reload user data
            }
          },
          {
            text: "Clear & Re-login",
            style: "destructive",
            onPress: async () => {
              console.log("🧹 Clearing stored data and redirecting to login...");
              await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userData']);
              router.push("/OnboardingScreen");
            }
          },
          {
            text: "Debug",
            onPress: async () => {
              // Debug AsyncStorage contents
              const accessToken = await AsyncStorage.getItem('accessToken');
              const refreshToken = await AsyncStorage.getItem('refreshToken');
              const userDataStored = await AsyncStorage.getItem('userData');
              console.log("🔍 Debug Info:");
              console.log("- Access Token:", accessToken ? "Present" : "Missing");
              console.log("- Refresh Token:", refreshToken ? "Present" : "Missing");
              console.log("- User Data:", userDataStored ? JSON.parse(userDataStored) : "Missing");

              const debugInfo = `Access Token: ${accessToken ? "Present" : "Missing"}\nRefresh Token: ${refreshToken ? "Present" : "Missing"}\nUser Data: ${userDataStored ? "Present" : "Missing"}`;
              Alert.alert("Debug Info", debugInfo);
            }
          }
        ]
      );
      return;
    }

    console.log("✅ User data available, navigating to select location...");
    console.log("📋 Navigation params:", {
      name: currentUserData.name || "",
      phoneNumber: currentUserData.mobile || "",
      fromLocationModal: "true"
    });

    // Navigate to SelectLocation screen first to choose city/district
    router.push({
      pathname: "/login/SelectLocation",
      params: {
        name: currentUserData.name || "",
        phoneNumber: currentUserData.mobile || "",
        fromLocationModal: "true" // Flag to indicate navigation from location modal
      },
    });
  };

  const handleCloseAddressModal = () => {
    setAddressModalVisible(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              // Remove tokens
              await Promise.all([
                AsyncStorage.removeItem("accessToken"),
                AsyncStorage.removeItem("refreshToken")
              ]);
              
              // Navigate to onboarding
              router.replace("/OnboardingScreen");
            } catch (error) {
              console.error("Error during logout:", error);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          }
        }
      ]
    );
  };

  const menuItems = [
    {
      id: 'favourites',
      title: 'Favourites',
      icon: 'heart-outline',
      onPress: () => router.push("/favourites/Favourites")
    },
   
    {
      id: 'details',
      title: 'My Details',
      icon: 'card-outline',
      onPress: () => setModalVisible(true) // ONLY CHANGE: Open modal instead of alert
    },
    {
      id: 'address',
      title: 'Delivery Address',
      icon: 'location-outline',
      onPress: () => setAddressModalVisible(true) // Open address modal
    },
    {
      id: 'accounts',
      title: 'Accounts',
      icon: 'wallet-outline',
      onPress: () =>  router.push('/invoices')
    },
     {
      id: 'invoices',
      title: 'Invoices',
      icon: 'document-text-outline',
      onPress: () => router.push('/invoices')
    },
    {
      id: 'promo',
      title: 'Promo Card',
      icon: 'card-outline',
      onPress: () => Alert.alert("Coming Soon", "Promo Card feature is under development.")
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'notifications-outline',
      onPress: () => Alert.alert("Coming Soon", "Notifications feature is under development.")
    },
    {
      id: 'help',
      title: 'Help',
      icon: 'help-circle-outline',
      onPress: () => Alert.alert("Coming Soon", "Help feature is under development.")
    },
    {
      id: 'about',
      title: 'About',
      icon: 'information-circle-outline',
      onPress: () => Alert.alert("Coming Soon", "About feature is under development.")
    }
  ];

  // Insert privacy & terms items after menuItems are defined
  // We'll add them to the rendered menu below so they appear in the Account screen

  const MenuItemComponent = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={item.onPress}
      className="flex-row items-center justify-between py-4 px-4 bg-white border-b border-gray-100"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center flex-1">
        <View className="w-10 h-10 items-center justify-center mr-4">
          <Ionicons name={item.icon as any} size={24} color="#374151" />
        </View>
        <Text className="text-base font-medium text-gray-900 flex-1">
          {item.title}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Profile Header - UNCHANGED */}
        <View className="bg-white px-4 py-6 border-b border-gray-100">
          <View className="flex-row items-center">
            {/* Profile Image */}
            <View className="relative">
              <Image
                source={userData.profileImage}
                className="w-20 h-20 rounded-full"
                resizeMode="cover"
              />
              {/* Edit Icon */}
              <TouchableOpacity 
                className="absolute -top-1 -right-1 bg-green-600 rounded-full p-1.5"
                onPress={() => Alert.alert("Coming Soon", "Edit profile feature is under development.")}
              >
                <Ionicons name="create" size={14} color="white" />
              </TouchableOpacity>
            </View>
            
            {/* User Info */}
            <View className="flex-1 ml-4">
              <View className="flex-row items-center">
                <Text className="text-xl font-bold text-gray-900 flex-1">
                  {userData.name}
                </Text>
                <TouchableOpacity 
                  onPress={() => Alert.alert("Coming Soon", "Edit name feature is under development.")}
                  className="ml-2"
                >
                  <Ionicons name="create-outline" size={20} color="#10B981" />
                </TouchableOpacity>
              </View>
              <Text className="text-gray-500 text-base mt-1">
                {userData.email}
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Items - UNCHANGED */}
        <View className="mt-4 bg-white">
          {menuItems.map((item, index) => (
            <MenuItemComponent key={item.id} item={item} />
          ))}

          {/* Privacy Policy */}
          <TouchableOpacity
            onPress={() => router.push('/account/privacy')}
            className="flex-row items-center justify-between py-4 px-4 bg-white border-b border-gray-100"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 items-center justify-center mr-4">
                <Ionicons name={'document-text-outline' as any} size={24} color="#374151" />
              </View>
              <Text className="text-base font-medium text-gray-900 flex-1">Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Terms & Conditions */}
          <TouchableOpacity
            onPress={() => router.push('/account/terms')}
            className="flex-row items-center justify-between py-4 px-4 bg-white border-b border-gray-100"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 items-center justify-center mr-4">
                <Ionicons name={'document-text-outline' as any} size={24} color="#374151" />
              </View>
              <Text className="text-base font-medium text-gray-900 flex-1">Terms & Conditions</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Logout Button - UNCHANGED */}
        <View className="mt-8 mx-4">
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-white rounded-lg py-4 px-4 border border-gray-200 shadow-sm"
            activeOpacity={0.8}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="log-out-outline" size={24} color="#10B981" />
              <Text className="text-lg font-semibold text-green-600 ml-3">
                Log Out
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* App Version - UNCHANGED */}
        <View className="mt-8 items-center pb-4">
          <Text className="text-gray-400 text-sm">
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* ONLY ADDITION: Personal Information Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            className="bg-white rounded-t-3xl px-6 py-4"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal drag indicator */}
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />
            
            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">Personal Information</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#16a34a" />
              </TouchableOpacity>
            </View>

            {/* User Details Card */}
            <View className="bg-green-100 rounded-2xl p-4 mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xl font-bold text-gray-900">{userData.name}</Text>
                <TouchableOpacity>
                  <Ionicons name="create-outline" size={24} color="#16a34a" />
                </TouchableOpacity>
              </View>
              <Text className="text-gray-700 mb-1">Customer Type : {userData.customerType}</Text>
              <Text className="text-gray-700 mb-1">Mobile Number : {userData.mobile}</Text>
              <Text className="text-gray-700 mb-1">Email : {userData.email}</Text>
              <Text className="text-gray-700">Gender : {userData.gender}</Text>
            </View>

            {/* Address Section */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-3">Active Address (Home)</Text>
              <View className="bg-green-100 rounded-2xl p-4 flex-row items-start">
                <Ionicons name="location" size={24} color="#16a34a" className="mr-3 mt-1" />
                <Text className="text-gray-700 flex-1 leading-5">
                  {userData.address}
                </Text>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delivery Address Modal */}
      <LocationModal
        visible={addressModalVisible}
        onClose={handleCloseAddressModal}
        onSelectAddress={handleSelectAddress}
        onAddNewAddress={handleAddNewAddress}
      />
    </SafeAreaView>
  );
}
