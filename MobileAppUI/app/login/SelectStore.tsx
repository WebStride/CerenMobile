import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
  Linking,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { images } from "@/constants/images";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import { getStoresForUser } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { resetToRoute } from "@/utils/navigation";
import { useSubmissionGuard } from "@/utils/useSubmissionGuard";

type Store = {
  CUSTOMERID: number;
  CUSTOMERNAME: string;
  ADDRESS?: string | null;
  CITY?: string | null;
  PINCODE?: number | null;
};

export default function SelectStore() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSubmitting, runWithGuard } = useSubmissionGuard();
  const [saveAs, setSaveAs] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [buildingBlock, setBuildingBlock] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [landmark, setLandmark] = useState("");
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const params = useLocalSearchParams(); // Retrieve route parameters
  const { phoneNumber, name } = params; // Destructure phoneNumber and name
  const city = (params as any).city || '';
  const district = (params as any).district || '';
  const location = (params as any).location || '';
  const address = (params as any).address || '';

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      console.log('🏪 [SelectStore] Loading stores...');
      setLoading(true);
      const res = await getStoresForUser();
      if (!mounted) return;
      
      console.log('🏪 [SelectStore] API Response:', res);
      
      if (res.success && Array.isArray(res.stores)) {
        setStores(res.stores);
        console.log(`🏪 [SelectStore] Found ${res.stores.length} stores`);
        
        if (res.stores.length === 1) {
          // Auto-select and navigate directly to shop if only one store
          const singleStore = res.stores[0];
          console.log('🏪 [SelectStore] Only one store found, auto-selecting:', singleStore.CUSTOMERNAME);
          await AsyncStorage.setItem('selectedStoreId', String(singleStore.CUSTOMERID));
          await AsyncStorage.setItem('selectedStoreName', singleStore.CUSTOMERNAME);
          setLoading(false);
          resetToRoute(router, {
            pathname: '/(tabs)/shop',
            params: {
              customerId: String(singleStore.CUSTOMERID),
              storeName: singleStore.CUSTOMERNAME,
            }
          });
          return;
        } else if (res.stores.length > 1) {
          setSelectedStoreId(res.stores[0].CUSTOMERID);
          console.log('🏪 [SelectStore] Multiple stores found, auto-selected first store:', res.stores[0].CUSTOMERID);
        } else {
          console.log('⚠️ [SelectStore] NO STORES - Will show "Continue to Browse" button');
        }
      } else {
        console.warn('❌ [SelectStore] Failed to load stores:', res.message);
      }
      setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, []);
  const handleSelectStore = () =>
    runWithGuard(async () => {
      if (!stores || stores.length === 0 || !selectedStoreId) {
        Alert.alert('No Store Selected', 'Please select a store to continue.');
        return;
      }

      try {
        const selected = stores.find((s) => s.CUSTOMERID === selectedStoreId);
        if (selected) {
          await AsyncStorage.setItem('selectedStoreId', String(selected.CUSTOMERID));
          await AsyncStorage.setItem('selectedStoreName', selected.CUSTOMERNAME);
          await AsyncStorage.setItem('hasMultipleStores', String(stores.length > 1));
          console.log('✅ Selected store:', selected.CUSTOMERNAME, '(ID:', selected.CUSTOMERID, ')');
        }

        resetToRoute(router, {
          pathname: '/(tabs)/shop',
          params: {
            customerId: selected ? String(selected.CUSTOMERID) : '',
            storeName: selected ? selected.CUSTOMERNAME : '',
          }
        });
      } catch (error) {
        console.error('Error selecting store:', error);
        Alert.alert('Error', 'Failed to select store. Please try again.');
      }
    });

  const handleContinueWithoutStore = () =>
    runWithGuard(async () => {
      try {
        console.log('⚠️ [handleContinueWithoutStore] User clicked Continue to Browse');

        await AsyncStorage.removeItem('selectedStoreId');
        await AsyncStorage.removeItem('selectedStoreName');

        const verifyCleared = await AsyncStorage.getItem('selectedStoreId');
        console.log('✅ [handleContinueWithoutStore] Verified selectedStoreId is cleared:', verifyCleared);

        if (verifyCleared !== null) {
          console.error('❌ [handleContinueWithoutStore] FAILED TO CLEAR selectedStoreId!');
          Alert.alert('Error', 'Failed to clear store selection. Please try again.');
          return;
        }

        console.log('⚠️ [handleContinueWithoutStore] Continuing without store - products will show WITHOUT pricing');

        resetToRoute(router, {
          pathname: '/(tabs)/shop',
          params: {
            customerId: '',
            noPricing: 'true',
          }
        });
      } catch (error) {
        console.error('❌ [handleContinueWithoutStore] Error:', error);
        Alert.alert('Error', 'Failed to continue. Please try again.');
      }
    });
  return (
    <KeyboardAvoidingAnimatedView style={{ flex: 1, backgroundColor : "#FFFFFF" }} behavior="padding">

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1">
          {/* Top background and back arrow */}
          <View className="relative">
            <Image
              source={images.LoginScreenTop}
              className="w-full h-40"
              resizeMode="cover"
            />
            <TouchableOpacity
              style={{
                position: "absolute",
                top: insets.top + 12,
                left: 18,
                width: 10,
                height: 18,
                justifyContent: "center",
                alignItems: "center",
                zIndex: 10,
              }}
              onPress={() => router.back()}
              accessibilityLabel="Back"
            >
              <Image
                source={images.TopLeftArrow}
                style={{ width: 10, height: 18 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
          {/* Form Section */}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 }}
          >
            <Text
              style={{
                fontFamily: "Open Sans",
                fontWeight: "700",
                fontSize: 24,
                color: "#181725",
                marginBottom: 24,
              }}
            >
              Select Store
            </Text>
            {/* Save Address As */}




            {/* Stores list */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontFamily: 'Open Sans', fontWeight: '600', fontSize: 15, color: '#7C7C7C', marginBottom: 8 }}>
                {stores.length > 0 ? 'Select a Store' : 'No Stores Available'}
              </Text>
              
              {loading ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#BCD042" />
                  <Text style={{ marginTop: 10, color: '#7C7C7C' }}>Loading stores...</Text>
                </View>
              ) : stores.length === 0 ? (
                <View style={{ 
                  padding: 20, 
                  backgroundColor: '#FFF9E6', 
                  borderRadius: 12, 
                  borderWidth: 1, 
                  borderColor: '#FFE4A3',
                  marginBottom: 16 
                }}>
                  <Text style={{ 
                    fontFamily: 'Open Sans', 
                    fontWeight: '600', 
                    fontSize: 16, 
                    color: '#181725',
                    marginBottom: 8,
                    textAlign: 'center'
                  }}>
                    No stores found for your account
                  </Text>
                  <Text style={{ 
                    fontFamily: 'Open Sans', 
                    fontSize: 14, 
                    color: '#7C7C7C',
                    textAlign: 'center',
                    lineHeight: 20
                  }}>
                    You can still browse our product catalog, but pricing information will not be available until a store is assigned to your account.
                  </Text>
                </View>
              ) : (
                stores.map((s) => (
                  <TouchableOpacity
                    key={s.CUSTOMERID}
                    onPress={() => setSelectedStoreId(s.CUSTOMERID)}
                    disabled={isSubmitting}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: selectedStoreId === s.CUSTOMERID ? '#BCD042' : '#EAEAEA',
                      backgroundColor: selectedStoreId === s.CUSTOMERID ? '#F8FFED' : '#FFFFFF',
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ fontFamily: 'Open Sans', fontWeight: '600', fontSize: 16, color: '#181725' }}>
                      {s.CUSTOMERNAME}
                    </Text>
                    {s.ADDRESS ? <Text style={{ color: '#7C7C7C', marginTop: 4 }}>{s.ADDRESS}</Text> : null}
                    {s.CITY ? <Text style={{ color: '#7C7C7C', fontSize: 12, marginTop: 2 }}>{s.CITY}</Text> : null}
                  </TouchableOpacity>
                ))
              )}
            </View>

            {/* Action Buttons */}
            {stores.length > 0 ? (
              // Show "Select Store" button when stores are available
              <TouchableOpacity
                style={{
                  backgroundColor: isSubmitting ? "#A8B77B" : "#BCD042",
                  height: 48,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 24,
                  opacity: isSubmitting ? 0.8 : 1,
                }}
                onPress={handleSelectStore}
                disabled={loading || isSubmitting || !selectedStoreId}
                accessibilityLabel="Select Store"
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
                    <Text
                      style={{
                        color: "#fff",
                        fontFamily: "Open Sans",
                        fontWeight: "700",
                        fontSize: 18,
                      }}
                    >
                      Opening...
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={{
                      color: "#fff",
                      fontFamily: "Open Sans",
                      fontWeight: "700",
                      fontSize: 18,
                    }}
                  >
                    Select Store
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              // Show "Continue to Browse" button when no stores
              <TouchableOpacity
                style={{
                  backgroundColor: isSubmitting ? "#A8B77B" : "#BCD042",
                  height: 48,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                  opacity: isSubmitting ? 0.8 : 1,
                }}
                onPress={handleContinueWithoutStore}
                disabled={loading || isSubmitting}
                accessibilityLabel="Continue to Browse Products"
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
                    <Text
                      style={{
                        color: "#fff",
                        fontFamily: "Open Sans",
                        fontWeight: "700",
                        fontSize: 18,
                      }}
                    >
                      Continuing...
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={{
                      color: "#fff",
                      fontFamily: "Open Sans",
                      fontWeight: "700",
                      fontSize: 18,
                    }}
                  >
                    Continue to Browse
                  </Text>
                )}
              </TouchableOpacity>
            )}
            
            {stores.length === 0 && (
              <Text style={{ 
                textAlign: 'center', 
                color: '#7C7C7C', 
                fontSize: 12,
                fontFamily: 'Open Sans',
                marginBottom: 24
              }}>
                You can browse products without pricing
              </Text>
            )}
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingAnimatedView>
  );
}