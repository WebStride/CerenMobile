import React, { useState, useCallback, useEffect } from "react";
import { useFavourites } from "../context/FavouritesContext";
import {
  View,
  Text,
  TextInput,
  Image,
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
  deleteUserAddress
} from "@/services/api";
import { useCart } from "../context/CartContext";

const { height, width } = Dimensions.get('window');

// Types
interface Product {
  productId: number;
  productName: string;
  productUnits: number;
  unitsOfMeasurement: string;
  price: number;
  image: string | number | null;
  minOrderQuantity?: number;
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

// ---------- Fixed Location Selection Modal ----------
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
        />        {/* Modal content - Fixed positioning */}
        <View style={{
          backgroundColor: 'white',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          height: height * 0.75, // Fixed height instead of maxHeight
          paddingBottom: 100 + insets.bottom, // Account for tab bar + safe area
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
                        <Text style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>House Number</Text>
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
                        <Text style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>Building/Block</Text>
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
                        <Text style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>City</Text>
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
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>District</Text>
                        <TextInput
                          style={{
                            borderWidth: 1,
                            borderColor: '#D1D5DB',
                            borderRadius: 8,
                            padding: 12,
                            fontSize: 16
                          }}
                          value={editForm.district}
                          onChangeText={(text) => setEditForm(prev => ({ ...prev, district: text }))}
                          placeholder="District"
                        />
                      </View>
                    </View>

                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>Pin Code</Text>
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
                        <Text style={{ color: '#374151', fontWeight: '500' }}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          backgroundColor: '#BCD042',
                          padding: 12,
                          borderRadius: 8,
                          marginLeft: 8,
                          alignItems: 'center'
                        }}
                        onPress={handleSaveEdit}
                      >
                        <Text style={{ color: 'white', fontWeight: '500' }}>Save</Text>
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
                        // Set as default address
                        setDefaultAddress(address.DeliveryAddressID).then(async (result) => {
                          if (result.success) {
                            console.log('Address set as default successfully');
                            // Refresh addresses to show updated default status
                            await fetchUserAddresses();
                            // Also refresh the default address in parent component
                            if (onSelectAddress) {
                              onSelectAddress({
                                id: address.DeliveryAddressID,
                                label: address.SaveAs || 'Home',
                                address: [
                                  address.HouseNumber,
                                  address.BuildingBlock,
                                  address.Landmark,
                                  `${address.City}, ${address.District}`
                                ].filter(Boolean).join(', '),
                                isDefault: true // This address is now default
                              });
                            }
                          } else {
                            console.error('Failed to set default address:', result.message);
                            Alert.alert('Error', 'Failed to set address as default');
                          }
                        });

                        onClose();
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={{
                        backgroundColor: address.IsDefault ? '#DBEAFE' : '#FEF3C7',
                        borderRadius: 50,
                        padding: 12,
                        marginRight: 16
                      }}>
                        <Ionicons
                          name={address.IsDefault ? "home" : "location"}
                          size={20}
                          color={address.IsDefault ? "#2563EB" : "#d97706"}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginBottom: 4
                        }}>
                          <Text style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: '#111827',
                            marginRight: 8
                          }}>
                            {address.SaveAs || 'Home'}
                          </Text>
                          {address.IsDefault && (
                            <View style={{
                              backgroundColor: '#DBEAFE',
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 12
                            }}>
                              <Text style={{
                                fontSize: 12,
                                color: '#2563EB',
                                fontWeight: '500'
                              }}>
                                Default
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={{
                          fontSize: 14,
                          color: '#6B7280',
                          lineHeight: 20
                        }}>
                          {[
                            address.HouseNumber,
                            address.BuildingBlock,
                            address.Landmark,
                            `${address.City}, ${address.District}`
                          ].filter(Boolean).join(', ')}
                        </Text>
                        {address.Name && (
                          <Text style={{
                            fontSize: 12,
                            color: '#9CA3AF',
                            marginTop: 4
                          }}>
                            {address.Name}
                          </Text>
                        )}
                        {address.PhoneNumber && (
                          <Text style={{
                            fontSize: 12,
                            color: '#9CA3AF',
                            marginTop: 2
                          }}>
                            {address.PhoneNumber}
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

// ---------- ProductCard Component ----------
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
  const { cart, addToCart, increase, decrease, removeFromCart } = useCart();
  const { addToFavourites, removeFromFavourites, isFavourite } = useFavourites();
  const router = useRouter();

  const uniqueInstanceId = `${sectionKey}_${item.productId}_${index}`;
  const cartItem = cart.find(x => x.productId === item.productId);
  const isProductFavourite = isFavourite(item.productId);
  const minOrder = item.minOrderQuantity || (item as any).minimumOrderQuantity || 1;

  const [showControls, setShowControls] = useState(!!cartItem);
  const [qtyInput, setQtyInput] = useState(cartItem ? String(cartItem.quantity) : String(minOrder));

  useEffect(() => {
    if (cartItem) {
      setQtyInput(String(cartItem.quantity));
      if (!showControls) {
        setShowControls(true);
      }
    } else {
      setShowControls(false);
      setQtyInput(String(minOrder));
    }
  }, [cartItem, showControls, minOrder]);

  const handleProductPress = useCallback(() => {
    router.push({
      pathname: '/products/[productId]',
      params: {
        productId: item.productId.toString(),
        productName: item.productName,
        productUnits: item.productUnits.toString(),
        unitsOfMeasurement: item.unitsOfMeasurement,
        price: item.price.toString(),
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
        image: typeof (item as any).image === 'number' ? '' : (item.image as string | null)
      } as any);
    }
  }, [isProductFavourite, item, addToFavourites, removeFromFavourites]);

  const handleAddToCartPress = useCallback(() => {
    const qty = Math.max(Number(qtyInput), minOrder);
    
    // Add the item with the correct quantity in one call
    addToCart({
      productId: item.productId,
      productName: item.productName,
      price: item.price,
      image: typeof (item as any).image === 'number' ? '' : (item.image as string | null),
      productUnits: item.productUnits,
      unitsOfMeasurement: item.unitsOfMeasurement,
    }, qty); // Pass the quantity directly
    
    setShowControls(true);
  }, [item, addToCart, qtyInput, minOrder]);

  const handleInputChange = useCallback((val: string) => {
    const onlyDigits = val.replace(/[^0-9]/g, "");
    setQtyInput(onlyDigits);

    if (onlyDigits === "" || Number(onlyDigits) < minOrder) {
      removeFromCart(item.productId);
      return;
    }

    const numVal = Number(onlyDigits);

    if (!cartItem && numVal >= minOrder) {
      // Add the item with the correct quantity in one call
      addToCart({
        productId: item.productId,
        productName: item.productName,
        price: item.price,
        image: typeof (item as any).image === 'number' ? '' : (item.image as string | null),
        productUnits: item.productUnits,
        unitsOfMeasurement: item.unitsOfMeasurement,
      }, numVal); // Pass the quantity directly
    } else if (cartItem) {
      const diff = numVal - cartItem.quantity;
      if (diff > 0) {
        for (let i = 0; i < diff; i++) increase(item.productId);
      } else if (diff < 0) {
        for (let i = 0; i < Math.abs(diff); i++) decrease(item.productId);
      }
    }
  }, [item, cartItem, addToCart, increase, decrease, removeFromCart, minOrder]);

  const handleDecrease = useCallback(() => {
    if (cartItem && cartItem.quantity > minOrder) {
      decrease(item.productId);
    } else if (cartItem && cartItem.quantity === minOrder) {
      removeFromCart(item.productId);
    }
  }, [cartItem, decrease, removeFromCart, item.productId, minOrder]);

  const handleIncrease = useCallback(() => {
    increase(item.productId);
  }, [increase, item.productId]);

  return (
    <View
      key={uniqueInstanceId}
      className="bg-white rounded-xl p-3 mr-4 w-40 border border-gray-100"
    >
      <TouchableOpacity
        onPress={handleProductPress}
        className="flex-1 items-center mb-2 relative"
        activeOpacity={0.7}
      >
        <Image
          source={getImageSource()}
          className="w-28 h-28 mb-2"
          resizeMode="contain"
        />
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

      <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
        {item.productName}
      </Text>
      <Text className="text-gray-500 text-xs mb-1">
        {item.productUnits} {item.unitsOfMeasurement}
      </Text>

      {minOrder > 1 && (
        <Text className="text-red-500 text-xs mb-1 font-medium">Min: {minOrder}</Text>
      )}

      <View className="w-full mb-2">
        <Text className="font-bold text-base text-gray-900">₹{item.price}.00</Text>
      </View>

      {showControls ? (
        <View className="flex-row items-center justify-center rounded-full bg-green-700 px-1 py-1">
          <TouchableOpacity
            onPress={handleDecrease}
            className="w-8 h-8 rounded-full items-center justify-center"
          >
            <Ionicons name="remove" size={20} color="#fff" />
          </TouchableOpacity>
          <View className="flex-1 mx-1 items-center justify-center">
            <TextInput
              className="w-full h-8 text-center text-white font-bold"
              value={qtyInput}
              onChangeText={handleInputChange}
              keyboardType="number-pad"
              maxLength={3}
              style={{
                borderWidth: 0,
                backgroundColor: "transparent",
                fontSize: 16,
                color: "white",
                fontWeight: "bold",
                textAlign: "center",
                minWidth: 40,
              }}
              selectionColor="#fff"
              placeholder={String(minOrder)}
              placeholderTextColor="rgba(255,255,255,0.5)"
              textAlign="center"
            />
          </View>
          <TouchableOpacity
            onPress={handleIncrease}
            className="w-8 h-8 rounded-full items-center justify-center"
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          className="w-full bg-green-700 rounded-full py-2 px-3 items-center justify-center"
          onPress={handleAddToCartPress}
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold text-sm">Add {minOrder > 1 ? `${minOrder}` : ''} to Cart</Text>
        </TouchableOpacity>
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
      className={`rounded-xl flex-row items-center justify-start mr-3 px-3 py-2 w-48 h-auto ${getRandomColor()} gap-x-3`}
    >
      <Image source={typeof item.categoryImage === 'string' ? { uri: item.categoryImage } : (item.categoryImage || defaultImage)} className="w-12 h-12 mb-2" resizeMode="contain" />
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
  const { cartCount } = useCart();

  const { phoneNumber, name, location, city, district, address } = params;

  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  
  // Location modal state
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  const getLocationDisplay = () => {
    // Always show default address if available
    if (defaultAddress) {
      if (defaultAddress.CurrentLocation && defaultAddress.CurrentAddress) {
        return `${defaultAddress.CurrentAddress}, ${defaultAddress.CurrentLocation}`;
      }
      const parts = [
        defaultAddress.HouseNumber,
        defaultAddress.BuildingBlock,
        defaultAddress.Landmark,
        `${defaultAddress.City}, ${defaultAddress.District}`
      ].filter(Boolean);
      return parts.join(', ');
    }

    // Fallback to selected location or other sources
    if (selectedLocation) {
      return selectedLocation;
    }
    if (address) return address as string;
    if (city && district) return `${city}, ${district}`;
    if (city) return city as string;
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
          setUserData(currentUserData); // Update state for future use
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
              loadUserData(); // Try to reload user data
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
      phoneNumber: currentUserData.phoneNumber || "",
      fromLocationModal: "true"
    });

    // Navigate to SelectLocation screen first to choose city/district
    router.push({
      pathname: "/login/SelectLocation",
      params: {
        name: currentUserData.name || "",
        phoneNumber: currentUserData.phoneNumber || "",
        fromLocationModal: "true" // Flag to indicate navigation from location modal
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
          // Note: This is a simple decode, in production you'd validate the token properly
          const tokenParts = accessToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log("🔍 Decoded token payload:", payload);

            if (payload.phoneNumber) {
              // Create basic user data from token
              const basicUserData = {
                id: payload.userId,
                name: "User", // Default name since it's not in JWT
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
      setAddressLoading(true);
      const response = await getDefaultAddress();
      if (response.success && response.address) {
        setDefaultAddress(response.address);
      } else {
        console.log('No default address found or error:', response.message);
        setDefaultAddress(null);
      }
    } catch (error) {
      console.error('Error fetching default address:', error);
      setDefaultAddress(null);
    } finally {
      setAddressLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkCustomer = async () => {
      try {
        const response = await checkCustomerExists();
        setIsCustomerExists(response.success ? response.exists : false);
      } catch (error) {
        console.error("Error checking customer existence:", error);
        setIsCustomerExists(false);
      }
    };
    checkCustomer();
    loadUserData();
    fetchData();
    fetchDefaultAddress();
  }, [loadUserData, fetchDefaultAddress]);

  // Debug effect to check user data loading
  useEffect(() => {
    console.log("🔍 User data state changed:", userData);

    // Add global debug function for console access
    if (typeof global !== 'undefined') {
      (global as any).debugUserData = async () => {
        try {
          const accessToken = await AsyncStorage.getItem('accessToken');
          const refreshToken = await AsyncStorage.getItem('refreshToken');
          const userData = await AsyncStorage.getItem('userData');

          console.log("🔑 Access Token:", accessToken ? "Present" : "Missing");
          console.log("🔄 Refresh Token:", refreshToken ? "Present" : "Missing");
          console.log("👤 User Data:", userData ? JSON.parse(userData) : "Missing");

          return {
            accessToken: !!accessToken,
            refreshToken: !!refreshToken,
            userData: userData ? JSON.parse(userData) : null
          };
        } catch (error) {
          console.error("Debug error:", error);
        }
      };

      // Add function to manually reload user data
      (global as any).reloadUserData = loadUserData;

      // Add function to clear all stored data
      (global as any).clearStoredData = async () => {
        try {
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userData']);
          console.log("🧹 Cleared all stored data");
          setUserData(null);
          return true;
        } catch (error) {
          console.error("❌ Failed to clear data:", error);
          return false;
        }
      };
    }
  }, [userData]);

  useEffect(() => {
    const filtered = [...exclusiveOffers, ...bestSelling].filter(product =>
      product.productName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchQuery, exclusiveOffers, bestSelling]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        exclusiveRes, bestSellingRes, categoriesRes,
        newProductsRes, buyAgainProductsRes
      ] = await Promise.all([
        getExclusiveOffers(),
        getBestSelling(50),
        getCategories(),
        getNewProducts(),
        getBuyAgainProducts()
      ]);

      const normalize = (p: any, idx: number): Product => {
        const id = p.productId ?? p.id ?? p.product_id ?? (idx + 1);
        const name = p.productName ?? p.name ?? p.product_name ?? "";
        const units = p.productUnits ?? p.units ?? p.packetWeight ?? 1;
        const measurement = p.unitsOfMeasurement ?? p.unit ?? p.uom ?? "pcs";
        const price = p.price ?? p.mrp ?? p.sellingPrice ?? 0;
        const img = p.image ?? p.imageUrl ?? p.productImage ?? null;
        const minOrder = p.minimumOrderQuantity ?? p.minOrderQuantity ?? p.minOrder ?? 1;

        return {
          productId: Number(id),
          productName: String(name),
          productUnits: Number(units),
          unitsOfMeasurement: String(measurement),
          price: Number(price),
          image: img && typeof img === 'string' && img.length > 0 ? img : fallbackImages[Number(id) % fallbackImages.length],
          minOrderQuantity: Number(minOrder),
        } as Product;
      };

      if (exclusiveRes.success) setExclusiveOffers((exclusiveRes.products || []).map((p: any, i: number) => normalize(p, i)));
      if (bestSellingRes.success) setBestSelling((bestSellingRes.products || []).map((p: any, i: number) => normalize(p, i)));
      if (categoriesRes.success) setCategories(categoriesRes.categories);
      if (newProductsRes.success) setNewProducts((newProductsRes.products || []).map((p: any, i: number) => normalize(p, i)));
      if (buyAgainProductsRes.success) setBuyAgainProducts((buyAgainProductsRes.products || []).map((p: any, i: number) => normalize(p, i)));
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
            contentContainerStyle={{ paddingBottom: 80 }}
          >
            {/* Top Header with Dynamic Location */}
            <View className="flex-row items-center justify-between px-5 mt-20">
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

              <TouchableOpacity onPress={() => {
                Alert.alert("Logout", "Are you sure you want to logout?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await Promise.all([
                          AsyncStorage.removeItem("accessToken"),
                          AsyncStorage.removeItem("refreshToken"),
                        ]);
                        router.replace("/OnboardingScreen");
                      } catch (error) {
                        console.error("Error during logout:", error);
                        Alert.alert("Error", "Failed to logout. Please try again.");
                      }
                    },
                  },
                ]);
              }}>
                <Image source={require("../../assets/images/AccountProfile.png")} className="w-8 h-8 rounded-full bg-gray-200" />
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
                  keyExtractor={(item, index) => `search_${item.productId}_${index}_${Math.random()}`}
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
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item, index) => `exclusive_${item.productId}_${index}_${Math.random()}`}
                  renderItem={({ item, index }) => (
                    <ProductCard
                      item={item}
                      isCustomerExists={isCustomerExists}
                      sectionKey="exclusive"
                      index={index}
                    />
                  )}
                  contentContainerStyle={{ paddingLeft: 16, paddingBottom: 8 }}
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
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item, index) => `bestselling_${item.productId}_${index}_${Math.random()}`}
                  renderItem={({ item, index }) => (
                    <ProductCard
                      item={item}
                      isCustomerExists={isCustomerExists}
                      sectionKey="bestselling"
                      index={index}
                    />
                  )}
                  contentContainerStyle={{ paddingLeft: 16, paddingBottom: 8 }}
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
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item, index) => `newproducts_${item.productId}_${index}_${Math.random()}`}
                  renderItem={({ item, index }) => (
                    <ProductCard
                      item={item}
                      isCustomerExists={isCustomerExists}
                      sectionKey="newproducts"
                      index={index}
                    />
                  )}
                  contentContainerStyle={{ paddingLeft: 16, paddingBottom: 8 }}
                  ListEmptyComponent={() => (
                    <Text className="text-center text-gray-500 mx-4">No new products available</Text>
                  )}
                />

                {/* Buy Again Products */}
                <View className="flex-row justify-between items-center mx-4 mt-3 mb-1">
                  <Text className="text-lg font-bold text-gray-900">Buy Again Products</Text>
                  <TouchableOpacity onPress={handleSeeAllBuyAgain}>
                    <Text className="text-green-700 font-medium text-base">See all</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={buyAgainProducts}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item, index) => `buyagain_${item.productId}_${index}_${Math.random()}`}
                  renderItem={({ item, index }) => (
                    <ProductCard
                      item={item}
                      isCustomerExists={isCustomerExists}
                      sectionKey="buyagain"
                      index={index}
                    />
                  )}
                  contentContainerStyle={{ paddingLeft: 16, paddingBottom: 8 }}
                  ListEmptyComponent={() => (
                    <Text className="text-center text-gray-500 mx-4">No buy again products available</Text>
                  )}
                />

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
                  showsHorizontalScrollIndicator={false}
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

          {/* Floating "Go to Cart" bar */}
          {cartCount > 0 && (
            <View className="absolute left-0 right-0 bottom-36 px-8 z-50">
              <TouchableOpacity
                className="bg-green-700 rounded-full flex-row items-center justify-between px-4 py-4 shadow-lg mx-6"
                activeOpacity={0.95}
                onPress={() => router.push("/cart")}
              >
                <View className="flex-row items-center space-x-1">
                  <Ionicons name="cart-outline" size={20} color="#fff" />
                  <Text className="text-white font-semibold text-sm">
                    Go to Cart
                  </Text>
                </View>
                <View className="px-2 py-1 rounded-full bg-white/10 items-center flex-row" style={{ minWidth: 36 }}>
                  <Text className="text-white font-bold text-sm">
                    {cartCount}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Location Selection Modal - Fixed positioning */}
          <LocationModal
            visible={showLocationModal}
            onClose={handleCloseModal}
            onSelectAddress={handleSelectAddress}
            onAddNewAddress={handleAddNewAddress}
          />
        </>
      )}
    </View>
  );
};

export default HomeScreen;
