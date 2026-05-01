import React, { useState, useCallback, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useFavourites } from "../context/FavouritesContext";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
  Pressable,
  StatusBar,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getExclusiveOffers,
  getBestSelling,
  getCategories,
  checkCustomerExists,
  getNewProducts,
  getBuyAgainProducts,
  getDefaultAddress,
  getUserAddresses,
  setDefaultAddress,
  updateUserAddress,
  deleteUserAddress,
  getUserMasterAddress,
  getStoresForUser
} from "@/services/api";
import { useCart } from "../context/CartContext";
import { isGuestSession } from "@/utils/session";
import { PriceRequestModal } from "@/components/PriceRequestModal";
import { QuantitySelector } from "@/components/QuantitySelector";
import {
  sanitizeIndianMobileInput,
  validateIndianMobile,
  toIndianE164,
  formatIndianMobileForDisplay,
} from "@/utils/phoneNumber";
import { useSubmissionGuard } from "@/utils/useSubmissionGuard";

const { height, width } = Dimensions.get('window');

// Blurhash for smooth placeholder (light gray)
const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

// Types
interface Product {
  productId: number;
  productName: string;
  productUnits: number;
  unitsOfMeasurement: string;
  price: number | null; // Allow null for catalog mode
  image: string | number | null;
  minOrderQuantity?: number;
  showPricing?: boolean; // Flag from backend
}

interface Category {
  categoryId: number;
  categoryName: string;
  categoryImage: string | null;
}

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

const defaultImage = require("../../assets/images/Banana.png");
const fallbackImages = [
  require("../../assets/images/Banana.png"),
  require("../../assets/images/PulsesCategory.png"),
  require("../../assets/images/LocationThumbnail.png"),
  require("../../assets/images/HomeLogo.png"),
];
const HOME_RAIL_PADDING_LEFT = 16;
const HOME_PRODUCT_CARD_WIDTH = 160;
const HOME_PRODUCT_CARD_SPACING = 16;
const HOME_PRODUCT_CARD_ITEM_SIZE = HOME_PRODUCT_CARD_WIDTH + HOME_PRODUCT_CARD_SPACING;
const HOME_CATEGORY_CARD_WIDTH = 192;
const HOME_CATEGORY_CARD_SPACING = 12;
const HOME_CATEGORY_CARD_ITEM_SIZE = HOME_CATEGORY_CARD_WIDTH + HOME_CATEGORY_CARD_SPACING;

const createHorizontalItemLayout = (itemSize: number, leadingPadding = 0) =>
  (_data: ArrayLike<unknown> | null | undefined, index: number) => ({
    length: itemSize,
    offset: leadingPadding + itemSize * index,
    index,
  });

const getHomeProductItemLayout = createHorizontalItemLayout(
  HOME_PRODUCT_CARD_ITEM_SIZE,
  HOME_RAIL_PADDING_LEFT,
);
const getHomeCategoryItemLayout = createHorizontalItemLayout(
  HOME_CATEGORY_CARD_ITEM_SIZE,
  HOME_RAIL_PADDING_LEFT,
);

// ---------- Fixed Location Selection Modal ----------
const LocationModal = ({
  visible,
  onClose,
  onSelectAddress,
  onAddNewAddress,
  onAddressSetAsDefault
}: {
  visible: boolean;
  onClose: () => void;
  onSelectAddress: (address: any) => void;
  onAddNewAddress?: () => void;
  onAddressSetAsDefault?: () => void;
}) => {
  const { isSubmitting: isSavingEdit, runWithGuard: runSaveEdit } = useSubmissionGuard();
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
    saveAs: 'home',
    isDefault: false
  });
  const insets = useSafeAreaInsets();

  // Fetch user addresses when modal opens
  useEffect(() => {
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
      phoneNumber: sanitizeIndianMobileInput(address.PhoneNumber || ''),
      houseNumber: address.HouseNumber || '',
      buildingBlock: address.BuildingBlock || '',
      landmark: address.Landmark || '',
      city: address.City,
      district: address.District,
      pinCode: address.PinCode || '',
      saveAs: address.SaveAs || 'home',
      isDefault: address.IsDefault || false
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

  const handleSaveEdit = () =>
    runSaveEdit(async () => {
      if (!editingAddress) return;

      const phoneError = validateIndianMobile(editForm.phoneNumber);
      if (phoneError) {
        Alert.alert('Invalid phone number', phoneError);
        return;
      }

      try {
        const result = await updateUserAddress(editingAddress.DeliveryAddressID, {
          ...editForm,
          phoneNumber: toIndianE164(editForm.phoneNumber),
        });
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
    });

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
        
        {/* Modal content - Fixed positioning */}
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
                  // Inline Edit Form
                  <View key={address.DeliveryAddressID} style={{
                    paddingHorizontal: 24,
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: '#F3F4F6',
                    backgroundColor: '#F9FAFB'
                  }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 14 }}>
                      Edit Address
                    </Text>

                    {/* Name */}
                    <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Full Name</Text>
                    <TextInput
                      style={{
                        borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8,
                        paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
                        color: '#111827', backgroundColor: 'white', marginBottom: 10
                      }}
                      value={editForm.name}
                      onChangeText={(v) => setEditForm(prev => ({ ...prev, name: v }))}
                      placeholder="Name"
                      placeholderTextColor="#9CA3AF"
                    />

                    {/* Phone */}
                    <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Phone Number</Text>
                    <TextInput
                      style={{
                        borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8,
                        paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
                        color: '#111827', backgroundColor: 'white', marginBottom: 10
                      }}
                      value={editForm.phoneNumber}
                      onChangeText={(v) => setEditForm(prev => ({ ...prev, phoneNumber: v }))}
                      placeholder="10-digit mobile number"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="phone-pad"
                      maxLength={10}
                    />

                    {/* House Number */}
                    <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>House / Flat No.</Text>
                    <TextInput
                      style={{
                        borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8,
                        paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
                        color: '#111827', backgroundColor: 'white', marginBottom: 10
                      }}
                      value={editForm.houseNumber}
                      onChangeText={(v) => setEditForm(prev => ({ ...prev, houseNumber: v }))}
                      placeholder="House / Flat No."
                      placeholderTextColor="#9CA3AF"
                    />

                    {/* Building / Block */}
                    <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Building / Block</Text>
                    <TextInput
                      style={{
                        borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8,
                        paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
                        color: '#111827', backgroundColor: 'white', marginBottom: 10
                      }}
                      value={editForm.buildingBlock}
                      onChangeText={(v) => setEditForm(prev => ({ ...prev, buildingBlock: v }))}
                      placeholder="Building / Block / Apartment"
                      placeholderTextColor="#9CA3AF"
                    />

                    {/* Landmark */}
                    <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Landmark</Text>
                    <TextInput
                      style={{
                        borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8,
                        paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
                        color: '#111827', backgroundColor: 'white', marginBottom: 10
                      }}
                      value={editForm.landmark}
                      onChangeText={(v) => setEditForm(prev => ({ ...prev, landmark: v }))}
                      placeholder="Landmark (optional)"
                      placeholderTextColor="#9CA3AF"
                    />

                    {/* City + District row */}
                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>City</Text>
                        <TextInput
                          style={{
                            borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8,
                            paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
                            color: '#111827', backgroundColor: 'white'
                          }}
                          value={editForm.city}
                          onChangeText={(v) => setEditForm(prev => ({ ...prev, city: v }))}
                          placeholder="City"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>District</Text>
                        <TextInput
                          style={{
                            borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8,
                            paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
                            color: '#111827', backgroundColor: 'white'
                          }}
                          value={editForm.district}
                          onChangeText={(v) => setEditForm(prev => ({ ...prev, district: v }))}
                          placeholder="District"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </View>

                    {/* Pin Code */}
                    <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Pin Code</Text>
                    <TextInput
                      style={{
                        borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8,
                        paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
                        color: '#111827', backgroundColor: 'white', marginBottom: 10
                      }}
                      value={editForm.pinCode}
                      onChangeText={(v) => setEditForm(prev => ({ ...prev, pinCode: v }))}
                      placeholder="6-digit pin code"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      maxLength={6}
                    />

                    {/* Save As pills */}
                    <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>Save As</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                      {['home', 'work', 'other'].map((label) => (
                        <TouchableOpacity
                          key={label}
                          onPress={() => setEditForm(prev => ({ ...prev, saveAs: label }))}
                          style={{
                            paddingHorizontal: 16, paddingVertical: 8,
                            borderRadius: 20, borderWidth: 1.5,
                            borderColor: editForm.saveAs === label ? '#BCD042' : '#E5E7EB',
                            backgroundColor: editForm.saveAs === label ? '#F7FDE5' : 'white'
                          }}
                        >
                          <Text style={{
                            fontSize: 13, fontWeight: '500', textTransform: 'capitalize',
                            color: editForm.saveAs === label ? '#5A7A00' : '#6B7280'
                          }}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Set as default toggle */}
                    <TouchableOpacity
                      onPress={() => setEditForm(prev => ({ ...prev, isDefault: !prev.isDefault }))}
                      style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
                      activeOpacity={0.7}
                    >
                      <View style={{
                        width: 20, height: 20, borderRadius: 4, borderWidth: 1.5,
                        borderColor: editForm.isDefault ? '#BCD042' : '#D1D5DB',
                        backgroundColor: editForm.isDefault ? '#BCD042' : 'white',
                        alignItems: 'center', justifyContent: 'center', marginRight: 8
                      }}>
                        {editForm.isDefault && (
                          <Ionicons name="checkmark" size={13} color="white" />
                        )}
                      </View>
                      <Text style={{ fontSize: 14, color: '#374151' }}>Set as default address</Text>
                    </TouchableOpacity>

                    {/* Buttons */}
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity
                        onPress={handleCancelEdit}
                        style={{
                          flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1,
                          borderColor: '#E5E7EB', alignItems: 'center', backgroundColor: 'white',
                          opacity: isSavingEdit ? 0.6 : 1,
                        }}
                        disabled={isSavingEdit}
                        activeOpacity={0.7}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280' }}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleSaveEdit}
                        style={{
                          flex: 1, paddingVertical: 12, borderRadius: 10,
                          backgroundColor: isSavingEdit ? '#A8B77B' : '#BCD042', alignItems: 'center'
                        }}
                        disabled={isSavingEdit}
                        activeOpacity={0.8}
                      >
                        {isSavingEdit ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <ActivityIndicator size="small" color="#1A1A1A" style={{ marginRight: 8 }} />
                            <Text style={{ fontSize: 14, fontWeight: '700', color: '#1A1A1A' }}>Saving...</Text>
                          </View>
                        ) : (
                          <Text style={{ fontSize: 14, fontWeight: '700', color: '#1A1A1A' }}>Save</Text>
                        )}
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
                      onPress={async () => {
                        if (address.IsDefault) {
                          // Already default, just select and close
                          onSelectAddress(address);
                          onClose();
                          return;
                        }
                        
                        try {
                          const result = await setDefaultAddress(address.DeliveryAddressID);
                          if (result.success) {
                            await fetchUserAddresses();
                            if (onAddressSetAsDefault) {
                              onAddressSetAsDefault();
                            }
                            Alert.alert('Success', 'Default address updated successfully');
                            onSelectAddress(address);
                            onClose();
                          } else {
                            Alert.alert('Error', result.message || 'Failed to set default address');
                          }
                        } catch (error) {
                          console.error('Error setting default address:', error);
                          Alert.alert('Error', 'Failed to set default address');
                        }
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
                            address.CurrentAddress,
                            address.CurrentLocation || `${address.City}, ${address.District}`,
                            address.PinCode
                          ].filter(Boolean).join(', ')}
                        </Text>
                        {(address.Name || address.PhoneNumber) && (
                          <Text style={{
                            color: '#9CA3AF',
                            fontSize: 12,
                            marginTop: 4
                          }}>
                          {[address.Name, address.PhoneNumber ? formatIndianMobileForDisplay(address.PhoneNumber) : null].filter(Boolean).join(' • ')}
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

// ---------- Store Selection Modal ----------
const StoreSelectionModal = ({
  visible,
  onClose,
  stores,
  selectedStoreId,
  onSelectStore,
  loading,
  onRefreshStores
}: {
  visible: boolean;
  onClose: () => void;
  stores: Array<{CUSTOMERID: number; CUSTOMERNAME: string; ADDRESS?: string | null; CITY?: string | null}>;
  selectedStoreId: number | null;
  onSelectStore: (store: {CUSTOMERID: number; CUSTOMERNAME: string}) => void;
  loading: boolean;
  onRefreshStores?: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const [hasTriedRefresh, setHasTriedRefresh] = useState(false);

  // Debug log props
  useEffect(() => {
    console.log('🏪 [StoreSelectionModal] Props received:', {
      visible,
      storesCount: stores.length,
      loading,
      selectedStoreId,
      hasTriedRefresh
    });
  }, [visible, stores.length, loading, selectedStoreId, hasTriedRefresh]);

  // Always trigger refresh when modal opens
  useEffect(() => {
    if (visible && onRefreshStores) {
      console.log('🏪 [StoreSelectionModal] Modal opened, refreshing stores...');
      setHasTriedRefresh(false);
      onRefreshStores();
    }
  }, [visible]);

  // Track when loading completes
  useEffect(() => {
    if (visible && !loading) {
      setHasTriedRefresh(true);
    }
  }, [visible, loading]);

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
        <Pressable 
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }} 
          onPress={onClose}
        />
        
        <View style={{
          backgroundColor: 'white',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: height * 0.6,
          minHeight: height * 0.35,
          paddingBottom: insets.bottom + 20,
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
            }}>Select Store</Text>
            <Text style={{ fontSize: 10, color: '#9CA3AF' }}>
              {`L:${loading ? 'Y' : 'N'} R:${hasTriedRefresh ? 'Y' : 'N'} S:${stores.length}`}
            </Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ maxHeight: height * 0.45 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16 }}
          >
            {loading || !hasTriedRefresh ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#BCD042" />
                <Text style={{ marginTop: 12, color: '#6B7280' }}>Loading stores...</Text>
              </View>
            ) : stores.length === 0 ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Ionicons name="storefront-outline" size={48} color="#D1D5DB" />
                <Text style={{ marginTop: 12, fontSize: 16, color: '#6B7280' }}>No stores available</Text>
              </View>
            ) : (
              stores.map((store) => (
                <TouchableOpacity
                  key={store.CUSTOMERID}
                  onPress={() => onSelectStore(store)}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: selectedStoreId === store.CUSTOMERID ? '#BCD042' : '#E5E7EB',
                    backgroundColor: selectedStoreId === store.CUSTOMERID ? '#F8FFED' : '#FFFFFF',
                    marginBottom: 12,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: selectedStoreId === store.CUSTOMERID ? '#BCD042' : '#F3F4F6',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12
                  }}>
                    <Ionicons 
                      name="storefront" 
                      size={22} 
                      color={selectedStoreId === store.CUSTOMERID ? '#FFFFFF' : '#6B7280'} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ 
                      fontWeight: '600', 
                      fontSize: 16, 
                      color: '#111827',
                      marginBottom: 4
                    }}>
                      {store.CUSTOMERNAME}
                    </Text>
                    {store.ADDRESS && (
                      <Text style={{ color: '#6B7280', fontSize: 13 }} numberOfLines={1}>
                        {store.ADDRESS}
                      </Text>
                    )}
                    {store.CITY && (
                      <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2 }}>
                        {store.CITY}
                      </Text>
                    )}
                  </View>
                  {selectedStoreId === store.CUSTOMERID && (
                    <Ionicons name="checkmark-circle" size={24} color="#BCD042" />
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ---------- FIXED ProductCard Component ----------
const ProductCard = React.memo(({
  item,
  isCustomerExists,
  sectionKey,
  index,
}: {
  item: Product & { minOrderQuantity?: number };
  isCustomerExists: boolean;
  sectionKey: string;
  index: number;
}) => {
  const { cart, addToCart, increaseQuantity, decreaseQuantity, removeFromCart, setQuantity } = useCart();
  const { addToFavourites, removeFromFavourites, isFavourite } = useFavourites();
  const router = useRouter();

  const uniqueInstanceId = `${sectionKey}_${item.productId}_${index}`;
  const cartItem = cart.find(x => x.productId === item.productId);
  const isProductFavourite = isFavourite(item.productId);
  const minOrder = item.minOrderQuantity || (item as any).minimumOrderQuantity || 1;

  const [showControls, setShowControls] = useState(!!cartItem);
  const [showPriceRequestModal, setShowPriceRequestModal] = useState(false);

  useEffect(() => {
    if (cartItem) {
      if (!showControls) {
        setShowControls(true);
      }
    } else {
      setShowControls(false);
    }
  }, [cartItem, showControls]);

  const handleProductPress = useCallback(() => {
    router.push({
      pathname: '/products/[productId]',
      params: {
        productId: item.productId.toString(),
        productName: item.productName,
        productUnits: item.productUnits.toString(),
        unitsOfMeasurement: item.unitsOfMeasurement,
        price: item.price !== null ? item.price.toString() : '0',
        image: (typeof (item as any).image === 'number') ? '' : (item.image || ''),
        minOrderQuantity: minOrder.toString(),
        description: `Fresh and natural ${item.productName} sourced directly from farms. Rich in nutrients and perfect for daily consumption.`,
        nutritionInfo: "100gm",
        otherDetails: "Store in a cool, dry place. Best consumed within 3-5 days."
      },
    });
  }, [item, minOrder, router]);

  const getImageSource = () => {
    const img = (item as any).image;
    if (img && typeof img === 'string' && (img.startsWith('http') || img.startsWith('https'))) {
      return { uri: img };
    }
    return img || defaultImage;
  };

  const handleFavouriteToggle = useCallback((event: any) => {
    event.stopPropagation();
    if (isProductFavourite) {
      removeFromFavourites(item.productId);
    } else {
      addToFavourites({
        ...item,
        minQuantity: minOrder,
        image: typeof (item as any).image === 'number' ? '' : (item.image as string | null)
      } as any);
    }
  }, [isProductFavourite, item, minOrder, addToFavourites, removeFromFavourites]);

  const handleAddToCartPress = useCallback(() => {
    // Check if user is registered before allowing cart access
    if (!isCustomerExists) {
      Alert.alert(
        'Registration Required',
        'Please register in the app to access the add to cart feature.',
        [
          { text: 'OK', style: 'cancel' }
        ]
      );
      return;
    }

    // Add the item with MOQ
    addToCart({
      productId: item.productId,
      productName: item.productName,
      price: item.price || 0,
      image: typeof (item as any).image === 'number' ? '' : (item.image as string | null),
      productUnits: item.productUnits,
      unitsOfMeasurement: item.unitsOfMeasurement,
    }, minOrder);
    
    setShowControls(true);
  }, [item, addToCart, minOrder, isCustomerExists]);

  const handleSetQuantity = useCallback((qty: number) => {
    if (!isCustomerExists) {
      Alert.alert(
        'Registration Required',
        'Please register in the app to access the add to cart feature.',
        [{ text: 'OK', style: 'cancel' }]
      );
      return;
    }
    setQuantity(item.productId, qty);
  }, [isCustomerExists, setQuantity, item.productId]);

  const handleDecrease = useCallback(() => {
    // Check if user is registered before allowing cart access
    if (!isCustomerExists) {
      Alert.alert(
        'Registration Required',
        'Please register in the app to access the add to cart feature.',
        [
          { text: 'OK', style: 'cancel' }
        ]
      );
      return;
    }

    if (cartItem && cartItem.quantity > minOrder) {
      decreaseQuantity(item.productId);
    } else if (cartItem && cartItem.quantity === minOrder) {
      removeFromCart(item.productId);
    }
  }, [cartItem, decreaseQuantity, removeFromCart, item.productId, minOrder, isCustomerExists]);

  const handleIncrease = useCallback(() => {
    // Check if user is registered before allowing cart access
    if (!isCustomerExists) {
      Alert.alert(
        'Registration Required',
        'Please register in the app to access the add to cart feature.',
        [
          { text: 'OK', style: 'cancel' }
        ]
      );
      return;
    }

    increaseQuantity(item.productId);
  }, [increaseQuantity, item.productId, isCustomerExists]);

  return (
    <View
      key={uniqueInstanceId}
      className="bg-white rounded-xl p-3 border border-gray-100"
      style={{ minHeight: 292, marginRight: HOME_PRODUCT_CARD_SPACING, width: HOME_PRODUCT_CARD_WIDTH }}
    >
      <TouchableOpacity
        onPress={handleProductPress}
        style={{ alignItems: 'center', marginBottom: 10, position: 'relative' }}
        activeOpacity={0.7}
      >
        <View
          style={{
            width: 112,
            height: 112,
            borderRadius: 12,
            backgroundColor: '#f3f4f6',
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
          }}
        >
          <Image
            source={getImageSource()}
            placeholder={blurhash}
            contentFit="contain"
            transition={200}
            cachePolicy="memory-disk"
            style={{ width: '100%', height: '100%' }}
          />
        </View>
        <TouchableOpacity
          onPress={handleFavouriteToggle}
          className="absolute top-0 right-0 bg-white/80 rounded-full p-1.5 shadow-sm"
          activeOpacity={0.7}
        >
          <Ionicons
            name={isProductFavourite ? "heart" : "heart-outline"}
            size={18}
            color={isProductFavourite ? "#EF4444" : "#9CA3AF"}
          />
        </TouchableOpacity>
      </TouchableOpacity>

      <Text className="text-base font-semibold text-gray-900 mt-1" numberOfLines={1}>
        {item.productName}
      </Text>
      <Text className="text-gray-500 text-xs mb-1">
        {item.productUnits} {item.unitsOfMeasurement}
      </Text>

      {minOrder > 1 && (
        <Text className="text-red-500 text-xs mb-1 font-medium">Min: {minOrder}</Text>
      )}

      <View className="w-full mb-2">
        {item.price !== null && item.price !== undefined && item.price > 0 ? (
          <Text className="font-bold text-base text-gray-900">₹{item.price}.00</Text>
        ) : (
          <TouchableOpacity
            onPress={() => setShowPriceRequestModal(true)}
            className="bg-orange-100 border border-orange-300 rounded-lg px-2 py-1"
            activeOpacity={0.7}
          >
            <Text className="font-semibold text-xs text-orange-600 text-center">
              Price on Request
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Price Request Modal */}
      <PriceRequestModal
        visible={showPriceRequestModal}
        onClose={() => setShowPriceRequestModal(false)}
        productId={item.productId}
        productName={item.productName}
      />

      {/* FIXED: Quantity Controls - Only show for products with pricing */}
      {(item.price !== null && item.price !== undefined && item.price > 0) && (
        showControls ? (
          <QuantitySelector
            quantity={cartItem?.quantity ?? minOrder}
            minQuantity={minOrder}
            productName={item.productName}
            onDecrease={handleDecrease}
            onIncrease={handleIncrease}
            onSetQuantity={handleSetQuantity}
          />
        ) : (
          <TouchableOpacity
            style={{
              width: '100%',
              backgroundColor: '#15803d', // green-700
              borderRadius: 25,
              paddingVertical: 10,
              paddingHorizontal: 12,
              alignItems: 'center',
              justifyContent: 'center',
              height: 40, // Same height as controls
            }}
            onPress={handleAddToCartPress}
            activeOpacity={0.8}
          >
            <Text style={{
              color: 'white',
              fontWeight: '600',
              fontSize: 14
            }}>
              Add {minOrder > 1 ? `${minOrder}` : ''} to Cart
            </Text>
          </TouchableOpacity>
        )
      )}
    </View>
  );
});

// ---------- Category Card ----------
const GroceryCategoryCard = ({
  item,
  onPress,
}: { item: Category; onPress: () => void }) => {
  const getRandomColor = () => {
    const colors = ['bg-amber-100', 'bg-green-100', 'bg-blue-100', 'bg-purple-100', 'bg-pink-100'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`rounded-xl flex-row items-center justify-start px-3 py-2 h-auto ${getRandomColor()} gap-x-3`}
      style={{ marginRight: HOME_CATEGORY_CARD_SPACING, width: HOME_CATEGORY_CARD_WIDTH }}
    >
      <Image 
        source={typeof item.categoryImage === 'string' ? { uri: item.categoryImage } : (item.categoryImage || defaultImage)} 
        placeholder={blurhash}
        contentFit="contain"
        transition={200}
        cachePolicy="memory-disk"
        style={{ width: 48, height: 48, marginBottom: 8, backgroundColor: 'transparent' }}
      />
      <Text className="font-semibold text-sm text-gray-800 flex-1">
        {item.categoryName}
      </Text>
    </TouchableOpacity>
  );
};

// ---------- Main Home Screen ----------
const HomeScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { cartCount, refreshCart, isCartLoading } = useCart();

  const { phoneNumber, name, location, city, district, address } = params;

  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [userMasterAddress, setUserMasterAddress] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  
  // Location modal state
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  
  // Store selection state
  const [stores, setStores] = useState<Array<{CUSTOMERID: number; CUSTOMERNAME: string; ADDRESS?: string | null; CITY?: string | null}>>([]);
  const [selectedStoreName, setSelectedStoreName] = useState<string>("");
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [storesLoading, setStoresLoading] = useState(false);
  const [hasMultipleStores, setHasMultipleStores] = useState<boolean>(false);

  const getLocationDisplay = () => {
    // Priority 1: Show default delivery address if available
    if (defaultAddress) {
      // Prefer pin-selected location data (either field is sufficient)
      const pinDisplay = [defaultAddress.CurrentAddress, defaultAddress.CurrentLocation].filter(Boolean).join(', ');
      if (pinDisplay) return pinDisplay;

      const parts = [
        defaultAddress.HouseNumber,
        defaultAddress.BuildingBlock,
        defaultAddress.Landmark,
        `${defaultAddress.City}, ${defaultAddress.District}`
      ].filter(Boolean);
      return parts.join(', ');
    }

    // Priority 2: Show USERCUSTOMERMASTER address if user registered but no delivery address
    if (userMasterAddress) {
      return userMasterAddress;
    }

    // Priority 3: Fallback to selected location or URL params
    if (selectedLocation) {
      return selectedLocation;
    }
    if (address) return address as string;
    if (city && district) return `${city}, ${district}`;
    if (city) return city as string;
    
    // Priority 4: Default fallback
    return "Set your location";
  };

  const locationDisplay = getLocationDisplay();

  const [exclusiveOffers, setExclusiveOffers] = useState<Product[]>([]);
  const [bestSelling, setBestSelling] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [userData, setUserData] = useState<{name: string; phoneNumber: string} | null>(null);
  const [isCustomerExists, setIsCustomerExists] = useState<boolean | null>(null);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [buyAgainProducts, setBuyAgainProducts] = useState<Product[]>([]);

  const handleCategoryPress = useCallback((category: Category) => {
    router.push({
      pathname: "/products/CategoryProductsScreen",
      params: {
        categoryId: category.categoryId.toString(),
        categoryName: category.categoryName,
      },
    });
  }, [router]);

  const handleLocationPress = useCallback(() => {
    console.log("Opening location modal...");
    setShowLocationModal(true);
  }, []);

  const handleSelectAddress = useCallback((addressData: any) => {
    console.log("Selected address:", addressData);
    if (addressData.address) {
      setSelectedLocation(addressData.address);
    } else if (addressData.label) {
      setSelectedLocation(addressData.label);
    }
    // Refresh default address after selection
    fetchDefaultAddress();
  }, []);

  const handleCloseModal = useCallback(() => {
    console.log("Closing location modal...");
    setShowLocationModal(false);
  }, []);

  const handleAddNewAddress = useCallback(async () => {
    console.log("🖱️ Add new address button clicked");
    console.log("👤 Current userData state:", userData);

    let currentUserData = userData;

    // If userData is not available, try to load it from AsyncStorage
    if (!currentUserData) {
      console.log("🔄 User data not in state, trying to load from AsyncStorage...");
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData) {
          currentUserData = JSON.parse(storedUserData);
          console.log("✅ Loaded user data from AsyncStorage:", currentUserData);
          setUserData(currentUserData);
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

    if (!currentUserData) {
      console.log("❌ User data still not available, cannot add address");
      Alert.alert(
        "Session Error",
        "Unable to load user information. This might be due to corrupted data.",
        [
          {
            text: "Retry",
            onPress: () => {
              loadUserData();
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
          }
        ]
      );
      return;
    }

    console.log("✅ User data available, navigating to select location...");
    console.log("📋 Navigation params:", {
      name: currentUserData.name || "",
      phoneNumber: currentUserData.phoneNumber || "",
      fromLocationModal: "true"
    });

    // Navigate to SelectLocation screen first to choose city/district
    router.push({
      pathname: "/login/SelectLocation",
      params: {
        name: currentUserData.name || "",
        phoneNumber: currentUserData.phoneNumber || "",
        fromLocationModal: "true"
      },
    });
  }, [router, city, district, userData]);

  const loadUserData = useCallback(async () => {
    try {
      console.log("🔍 Loading user data from AsyncStorage...");

      // First check if user is logged in
      const accessToken = await AsyncStorage.getItem('accessToken');
      console.log("🔑 Access token exists:", !!accessToken);

      if (!accessToken) {
        console.log("❌ No access token found - user not logged in");
        setUserData(null);
        return;
      }

      const storedUserData = await AsyncStorage.getItem('userData');
      console.log("📦 Raw stored user data:", storedUserData);

      if (storedUserData) {
        const parsedUserData = JSON.parse(storedUserData);
        console.log("✅ Parsed user data:", parsedUserData);
        setUserData(parsedUserData);
      } else {
        console.log("❌ No user data found in AsyncStorage");
        setUserData(null);

        // Try to get user data from the access token (decode JWT)
        try {
          console.log("🔄 Attempting to decode user data from access token...");
          const tokenParts = accessToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log("🔍 Decoded token payload:", payload);

            if (payload.phoneNumber) {
              // Create basic user data from token
              const basicUserData = {
                id: payload.userId,
                name: "User",
                phoneNumber: payload.phoneNumber
              };
              console.log("✅ Created basic user data from token:", basicUserData);
              setUserData(basicUserData);

              // Store it for future use
              await AsyncStorage.setItem('userData', JSON.stringify(basicUserData));
            }
          }
        } catch (tokenError) {
          console.error("❌ Failed to decode token:", tokenError);
        }
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      setUserData(null);
    }
  }, []);

  const fetchDefaultAddress = useCallback(async () => {
    try {
      const guest = await isGuestSession();
      if (guest) {
        setDefaultAddress(null);
        setUserMasterAddress(null);
        return;
      }

      setAddressLoading(true);
      
      // Fetch default delivery address
      const response = await getDefaultAddress();
      if (response.success && response.address) {
        setDefaultAddress(response.address);
      } else {
        setDefaultAddress(null);
        
        // If no default delivery address, fetch USERCUSTOMERMASTER address as fallback
        try {
          const masterAddressResponse = await getUserMasterAddress();
          if (masterAddressResponse.success && masterAddressResponse.address) {
            console.log('✅ Using USERCUSTOMERMASTER address:', masterAddressResponse.address);
            setUserMasterAddress(masterAddressResponse.address);
          } else {
            setUserMasterAddress(null);
          }
        } catch (masterError) {
          console.error('Error fetching user master address:', masterError);
          setUserMasterAddress(null);
        }
      }
    } catch (error) {
      console.error('Error fetching default address:', error);
      setDefaultAddress(null);
      setUserMasterAddress(null);
    } finally {
      setAddressLoading(false);
    }
  }, []);

  // Load store data and current selection
  const loadStoreData = useCallback(async () => {
    try {
      // Load current store selection from AsyncStorage
      const storedStoreId = await AsyncStorage.getItem('selectedStoreId');
      const storedStoreName = await AsyncStorage.getItem('selectedStoreName');
      const storedHasMultiple = await AsyncStorage.getItem('hasMultipleStores');

      if (storedStoreId) {
        setSelectedStoreId(Number(storedStoreId));
      }
      if (storedStoreName) {
        setSelectedStoreName(storedStoreName);
      }
      if (storedHasMultiple) {
        setHasMultipleStores(storedHasMultiple === 'true');
      }

      // Fetch all available stores
      setStoresLoading(true);
      const res = await getStoresForUser();

      if (res.success && Array.isArray(res.stores)) {
        setStores(res.stores);
        const multipleStores = res.stores.length > 1;
        setHasMultipleStores(multipleStores);
        await AsyncStorage.setItem('hasMultipleStores', String(multipleStores));
      }
    } catch (error) {
      console.error('Error loading store data:', error);
    } finally {
      setStoresLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkCustomer = async () => {
      try {
        const guest = await isGuestSession();
        if (guest) {
          setIsCustomerExists(false);
          return;
        }

        const response = await checkCustomerExists();
        setIsCustomerExists(response.success ? response.exists : false);
      } catch (error) {
        setIsCustomerExists(false);
      }
    };
    checkCustomer();
    loadUserData();
    loadStoreData(); // Load store data on mount
    fetchData(false); // Initially fetch without Buy Again products
  }, [loadUserData, loadStoreData]);

  // Use useFocusEffect to refresh address whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchDefaultAddress();
      loadStoreData();
    }, [fetchDefaultAddress, loadStoreData])
  );

  // Handle store change
  const handleStoreChange = useCallback(async (store: { CUSTOMERID: number; CUSTOMERNAME: string }) => {
    try {
      await AsyncStorage.setItem('selectedStoreId', String(store.CUSTOMERID));
      await AsyncStorage.setItem('selectedStoreName', store.CUSTOMERNAME);
      setSelectedStoreId(store.CUSTOMERID);
      setSelectedStoreName(store.CUSTOMERNAME);
      setShowStoreModal(false);
      
      // Refresh cart with new store's cart data (await for proper sequencing)
      console.log('🛒 Store changed, refreshing cart...');
      await refreshCart();
      
      // Refresh products with new store pricing
      fetchData(isCustomerExists === true);
    } catch (error) {
      console.error('Error changing store:', error);
      Alert.alert('Error', 'Failed to change store. Please try again.');
    }
  }, [isCustomerExists, refreshCart]);

  // Handle opening store modal - ensure stores are loaded
  const handleOpenStoreModal = useCallback(async () => {
    setShowStoreModal(true);
    // If stores haven't been loaded yet, load them now
    if (stores.length === 0 && !storesLoading) {
      loadStoreData();
    }
  }, [stores.length, storesLoading, loadStoreData]);

  // Fetch Buy Again products only for registered users
  useEffect(() => {
    const fetchBuyAgainProducts = async () => {
      if (isCustomerExists) {
        try {
          console.log('🛒 [Shop] Fetching Buy Again products for registered user');
          const buyAgainProductsRes = await getBuyAgainProducts();
          
          const normalize = (p: any, idx: number): Product => {
            const id = p.productId ?? p.id ?? p.product_id ?? (idx + 1);
            const name = p.productName ?? p.name ?? p.product_name ?? "";
            const units = p.productUnits ?? p.units ?? p.packetWeight ?? 1;
            const measurement = p.unitsOfMeasurement ?? p.unit ?? p.uom ?? "pcs";
            
            const rawPrice = p.price ?? p.mrp ?? p.sellingPrice;
            const price = rawPrice !== null && rawPrice !== undefined ? rawPrice : null;
            
            const img = p.image ?? p.imageUrl ?? p.productImage ?? null;
            const minOrder = p.minimumOrderQuantity ?? p.minOrderQuantity ?? p.minOrder ?? 1;
            
            return {
              productId: Number(id),
              productName: String(name),
              productUnits: Number(units),
              unitsOfMeasurement: String(measurement),
              price: price !== null ? Number(price) : null,
              image: img && typeof img === 'string' && img.length > 0 ? img : fallbackImages[Number(id) % fallbackImages.length],
              minOrderQuantity: Number(minOrder),
            } as Product;
          };
          
          if (buyAgainProductsRes && buyAgainProductsRes.success) {
            setBuyAgainProducts((buyAgainProductsRes.products || []).map((p: any, i: number) => normalize(p, i)));
          }
        } catch (error) {
          console.error('Error fetching Buy Again products:', error);
        }
      } else {
        // Clear Buy Again products for unregistered users
        setBuyAgainProducts([]);
      }
    };
    
    if (isCustomerExists !== null) {
      fetchBuyAgainProducts();
    }
  }, [isCustomerExists]);

  // Debug effect to check user data loading
  useEffect(() => {
  }, [userData]);

  useEffect(() => {
    const filtered = [...exclusiveOffers, ...bestSelling].filter(product =>
      product.productName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchQuery, exclusiveOffers, bestSelling]);

  const fetchData = async (shouldFetchBuyAgain: boolean = true) => {
    try {
      setLoading(true);
      
      // Conditionally fetch Buy Again products only for registered users
      const apiCalls = [
        getExclusiveOffers(),
        getBestSelling(50),
        getCategories(),
        getNewProducts()
      ];
      
      if (shouldFetchBuyAgain) {
        apiCalls.push(getBuyAgainProducts());
      }
      
      const results = await Promise.all(apiCalls);
      const [exclusiveRes, bestSellingRes, categoriesRes, newProductsRes, buyAgainProductsRes] = results;

      const normalize = (p: any, idx: number): Product => {
        const id = p.productId ?? p.id ?? p.product_id ?? (idx + 1);
        const name = p.productName ?? p.name ?? p.product_name ?? "";
        const units = p.productUnits ?? p.units ?? p.packetWeight ?? 1;
        const measurement = p.unitsOfMeasurement ?? p.unit ?? p.uom ?? "pcs";
        
        // CRITICAL FIX: Check if price is explicitly null (catalog mode)
        // Don't default to 0 or any other value if price is null
        const rawPrice = p.price ?? p.mrp ?? p.sellingPrice;
        const price = rawPrice !== null && rawPrice !== undefined ? rawPrice : null;
        
        const img = p.image ?? p.imageUrl ?? p.productImage ?? null;
        const minOrder = p.minimumOrderQuantity ?? p.minOrderQuantity ?? p.minOrder ?? 1;

        return {
          productId: Number(id),
          productName: String(name),
          productUnits: Number(units),
          unitsOfMeasurement: String(measurement),
          price: price !== null ? Number(price) : null, // Keep null if no price
          image: img && typeof img === 'string' && img.length > 0 ? img : fallbackImages[Number(id) % fallbackImages.length],
          minOrderQuantity: Number(minOrder),
        } as Product;
      };

      if (exclusiveRes.success) setExclusiveOffers((exclusiveRes.products || []).map((p: any, i: number) => normalize(p, i)));
      if (bestSellingRes.success) setBestSelling((bestSellingRes.products || []).map((p: any, i: number) => normalize(p, i)));
      if (categoriesRes.success) setCategories(categoriesRes.categories);
      if (newProductsRes.success) setNewProducts((newProductsRes.products || []).map((p: any, i: number) => normalize(p, i)));
      if (buyAgainProductsRes && buyAgainProductsRes.success) setBuyAgainProducts((buyAgainProductsRes.products || []).map((p: any, i: number) => normalize(p, i)));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeeAllExclusive = useCallback(() => {
    router.push({ pathname: "/products/AllProductsList", params: { feedType: "exclusive" } });
  }, [router]);

  const handleSeeAllBestSelling = useCallback(() => {
    router.push({ pathname: "/products/AllProductsList", params: { feedType: "bestselling" } });
  }, [router]);

  const handleSeeAllNew = useCallback(() => {
    router.push({ pathname: "/products/AllProductsList", params: { feedType: "newproducts" } });
  }, [router]);

  const handleSeeAllBuyAgain = useCallback(() => {
    router.push({ pathname: "/products/AllProductsList", params: { feedType: "buyagain" } });
  }, [router]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#BCD042" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {isCustomerExists === null ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#BCD042" />
        </View>
      ) : (
        <>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }} // Extra padding for cart button
          >
            {/* Top Header with Store/Location */}
            <View className="flex-row items-center justify-between px-5 mt-20">
              {/* Store Display - Replace location with store name when available */}
              {selectedStoreName ? (
                hasMultipleStores ? (
                  // Multiple stores - show store name with change option and location below
                  <TouchableOpacity
                    onPress={handleOpenStoreModal}
                    className="flex-1"
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="storefront-outline" size={20} color="#222" />
                      <Text
                        className="text-base font-medium ml-1 text-gray-900 flex-1"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {selectedStoreName}
                      </Text>
                      <Ionicons name="chevron-down-outline" size={18} color="#222" />
                    </View>
                    {/* Location below store name */}
                    <View className="flex-row items-center mt-1 ml-6">
                      <Ionicons name="location-outline" size={14} color="#6B7280" />
                      <Text
                        className="text-xs text-gray-500 ml-1 flex-1"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {addressLoading ? "Loading..." : locationDisplay}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  // Single store - show store name with location below (no dropdown)
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Ionicons name="storefront-outline" size={20} color="#222" />
                      <Text
                        className="text-base font-medium ml-1 text-gray-900 flex-1"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {selectedStoreName}
                      </Text>
                    </View>
                    {/* Location below store name */}
                    <View className="flex-row items-center mt-1 ml-6">
                      <Ionicons name="location-outline" size={14} color="#6B7280" />
                      <Text
                        className="text-xs text-gray-500 ml-1 flex-1"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {addressLoading ? "Loading..." : locationDisplay}
                      </Text>
                    </View>
                  </View>
                )
              ) : (
                // No store selected - show location dropdown
                <TouchableOpacity
                  onPress={handleLocationPress}
                  className="flex-row items-center flex-1"
                  activeOpacity={0.7}
                >
                  <Ionicons name="location-outline" size={20} color="#222" />
                  <Text
                    className="text-base font-medium ml-1 text-gray-900 flex-1"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {addressLoading ? "Loading..." : locationDisplay}
                  </Text>
                  <Ionicons name="chevron-down-outline" size={18} color="#222" />
                </TouchableOpacity>
              )}

              {/* Profile Button */}
              <TouchableOpacity 
                onPress={() => router.push("/account")}
                className="ml-3"
                activeOpacity={0.8}
              >
                <View className="bg-green-700 w-10 h-10 rounded-full items-center justify-center shadow-lg">
                  <Ionicons name="person" size={22} color="white" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Search Box */}
            <View className="flex-row items-center bg-gray-100 rounded-xl mx-4 mt-4 px-3 h-12">
              <Ionicons name="search" size={20} color="#888" />
              <TextInput
                className="flex-1 ml-2 text-base"
                placeholder="Search for groceries..."
                placeholderTextColor="#888"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {searchQuery ? (
              <View className="mt-4">
                <Text className="text-lg font-bold text-gray-900 mx-4 mb-2">Search Results</Text>
                <FlatList
                  data={filteredProducts}
                  horizontal={false}
                  numColumns={2}
                  showsVerticalScrollIndicator={false}
                  keyExtractor={(item, index) => `search_${item.productId ?? index}`}
                  renderItem={({ item, index }) => (
                    <View className="flex-1 m-2">
                      <ProductCard
                        item={item}
                        isCustomerExists={isCustomerExists}
                        sectionKey="search"
                        index={index}
                      />
                    </View>
                  )}
                  contentContainerStyle={{ paddingHorizontal: 12 }}
                  removeClippedSubviews={true}
                  initialNumToRender={8}
                  maxToRenderPerBatch={8}
                  windowSize={7}
                  ListEmptyComponent={() => (
                    <Text className="text-center text-gray-500 mt-4">No products found</Text>
                  )}
                />
              </View>
            ) : (
              <>
                {/* Exclusive Offer */}
                <View className="flex-row justify-between items-center mx-4 mt-3 mb-1">
                  <Text className="text-lg font-bold text-gray-900">Exclusive Offer</Text>
                  <TouchableOpacity onPress={handleSeeAllExclusive}>
                    <Text className="text-green-700 font-medium text-base">See all</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={exclusiveOffers}
                  horizontal
                  showsVerticalScrollIndicator={false}
                  getItemLayout={getHomeProductItemLayout}
                  keyExtractor={(item, index) => `exclusive_${item.productId ?? index}`}
                  renderItem={({ item, index }) => (
                    <ProductCard
                      item={item}
                      isCustomerExists={isCustomerExists}
                      sectionKey="exclusive"
                      index={index}
                    />
                  )}
                  contentContainerStyle={{ paddingLeft: 16, paddingBottom: 8 }}
                  initialNumToRender={4}
                  maxToRenderPerBatch={6}
                  windowSize={5}
                  ListEmptyComponent={() => (
                    <Text className="text-center text-gray-500 mx-4">No exclusive offers available</Text>
                  )}
                />

                {/* Best Selling */}
                <View className="flex-row justify-between items-center mx-4 mt-3 mb-1">
                  <Text className="text-lg font-bold text-gray-900">Best Selling</Text>
                  <TouchableOpacity onPress={handleSeeAllBestSelling}>
                    <Text className="text-green-700 font-medium text-base">See all</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={bestSelling}
                  horizontal
                  showsVerticalScrollIndicator={false}
                  getItemLayout={getHomeProductItemLayout}
                  keyExtractor={(item, index) => `bestselling_${item.productId ?? index}`}
                  renderItem={({ item, index }) => (
                    <ProductCard
                      item={item}
                      isCustomerExists={isCustomerExists}
                      sectionKey="bestselling"
                      index={index}
                    />
                  )}
                  contentContainerStyle={{ paddingLeft: 16, paddingBottom: 8 }}
                  initialNumToRender={4}
                  maxToRenderPerBatch={6}
                  windowSize={5}
                  ListEmptyComponent={() => (
                    <Text className="text-center text-gray-500 mx-4">No best selling products available</Text>
                  )}
                />

                {/* New Products */}
                <View className="flex-row justify-between items-center mx-4 mt-3 mb-1">
                  <Text className="text-lg font-bold text-gray-900">New Products</Text>
                  <TouchableOpacity onPress={handleSeeAllNew}>
                    <Text className="text-green-700 font-medium text-base">See all</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={newProducts}
                  horizontal
                  showsVerticalScrollIndicator={false}
                  getItemLayout={getHomeProductItemLayout}
                  keyExtractor={(item, index) => `newproducts_${item.productId ?? index}`}
                  renderItem={({ item, index }) => (
                    <ProductCard
                      item={item}
                      isCustomerExists={isCustomerExists}
                      sectionKey="newproducts"
                      index={index}
                    />
                  )}
                  contentContainerStyle={{ paddingLeft: 16, paddingBottom: 8 }}
                  initialNumToRender={4}
                  maxToRenderPerBatch={6}
                  windowSize={5}
                  ListEmptyComponent={() => (
                    <Text className="text-center text-gray-500 mx-4">No new products available</Text>
                  )}
                />

                {/* Buy Again Products - Only show for registered users */}
                {isCustomerExists && (
                  <>
                    <View className="flex-row justify-between items-center mx-4 mt-3 mb-1">
                      <Text className="text-lg font-bold text-gray-900">Buy Again Products</Text>
                      <TouchableOpacity onPress={handleSeeAllBuyAgain}>
                        <Text className="text-green-700 font-medium text-base">See all</Text>
                      </TouchableOpacity>
                    </View>
                    <FlatList
                      data={buyAgainProducts}
                      horizontal
                      showsVerticalScrollIndicator={false}
                      getItemLayout={getHomeProductItemLayout}
                      keyExtractor={(item, index) => `buyagain_${item.productId ?? index}`}
                      renderItem={({ item, index }) => (
                        <ProductCard
                          item={item}
                          isCustomerExists={isCustomerExists}
                          sectionKey="buyagain"
                          index={index}
                        />
                      )}
                      contentContainerStyle={{ paddingLeft: 16, paddingBottom: 8 }}
                      initialNumToRender={4}
                      maxToRenderPerBatch={6}
                      windowSize={5}
                      ListEmptyComponent={() => (
                        <Text className="text-center text-gray-500 mx-4">No buy again products available</Text>
                      )}
                    />
                  </>
                )}

                {/* Categories */}
                <View className="flex-row justify-between items-center mx-4 mt-3 mb-1">
                  <Text className="text-lg font-bold text-gray-900">Categories</Text>
                  <TouchableOpacity onPress={() => router.push("/products/CategoriesList")}>
                    <Text className="text-green-700 font-medium text-base">See all</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={categories}
                  horizontal
                  showsVerticalScrollIndicator={false}
                  getItemLayout={getHomeCategoryItemLayout}
                  keyExtractor={(item) => item.categoryId.toString()}
                  renderItem={({ item }) => <GroceryCategoryCard item={item} onPress={() => handleCategoryPress(item)} />}
                  contentContainerStyle={{ paddingLeft: 16, paddingBottom: 32 }}
                  ListEmptyComponent={() => (
                    <Text className="text-center text-gray-500 mx-4">No categories available</Text>
                  )}
                />
              </>
            )}
          </ScrollView>

          {/* Fixed "Go to Cart" button */}
          {(cartCount > 0 || isCartLoading) && (
            <View 
              style={{
                position: 'absolute',
                left: 16,
                right: 16,
                bottom: 100, // Moved lower from tab bar
                zIndex: 50,
              }}
            >
              <TouchableOpacity
                style={{
                  backgroundColor: '#15803d', // green-700
                  borderRadius: 25, // More rounded
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 20, // More padding
                  paddingVertical: 16, // Bigger button
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                }}
                activeOpacity={0.9}
                onPress={() => router.push("/cart")}
                disabled={isCartLoading}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="cart-outline" size={24} color="#fff" />
                  <Text style={{ 
                    color: 'white', 
                    fontWeight: '600', 
                    fontSize: 18, // Bigger text
                    marginLeft: 8 
                  }}>
                    {isCartLoading ? 'Loading...' : 'Go to Cart'}
                  </Text>
                </View>
                
                {/* Fixed cart count display for APK compatibility */}
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: 20,
                  minWidth: 48, // Fixed minimum width
                  height: 32, // Fixed height
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 12,
                }}>
                  {isCartLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={{ 
                      color: 'white', 
                      fontWeight: '700',
                      fontSize: 16, // Bigger count text
                      textAlign: 'center',
                      lineHeight: 20, // Fixed line height for APK
                    }}>
                      {cartCount}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Location Selection Modal */}
          <LocationModal
            visible={showLocationModal}
            onClose={handleCloseModal}
            onSelectAddress={handleSelectAddress}
            onAddNewAddress={handleAddNewAddress}
            onAddressSetAsDefault={fetchDefaultAddress}
          />

          {/* Store Selection Modal */}
          <StoreSelectionModal
            visible={showStoreModal}
            onClose={() => setShowStoreModal(false)}
            stores={stores}
            selectedStoreId={selectedStoreId}
            onSelectStore={handleStoreChange}
            loading={storesLoading}
            onRefreshStores={loadStoreData}
          />
        </>
      )}
    </View>
  );
};

export default HomeScreen;
