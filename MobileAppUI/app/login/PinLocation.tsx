import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, Search, MapPin, X } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import MapView, { PROVIDER_GOOGLE, Marker } from "react-native-maps";
import * as Location from "expo-location";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

export default function MapLocationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mapRef = useRef<MapView | null>(null);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [region, setRegion] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [markerPosition, setMarkerPosition] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
  });

  const [currentAddress, setCurrentAddress] = useState(
    "Tap on map to set location",
  );
  const [currentLocation, setCurrentLocation] = useState(
    "Or search for your address above",
  );
  const [searchText, setSearchText] = useState("");
  type SearchResult = {
    displayName: string;
    displayAddress: string;
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy?: number;
  };

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [initialLocationLoaded, setInitialLocationLoaded] = useState(true);
const params = useLocalSearchParams();

  // Coerce params to expected types and provide safe defaults
  const city = (params.city as string) ?? "";
  const district = (params.district as string) ?? "";
  const name = (params.name as string) ?? "";
  const phoneNumber = (params.phoneNumber as string) ?? "";

  useEffect(() => {
    console.log("Received params in PinLocation:", { city, district, name, phoneNumber });
    // Set default location immediately for instant UI
    setToDefaultLocation();
    // Then try to get real location in background
    requestLocationPermission();
  }, []);

  // Search with debounce
  useEffect(() => {
    if (searchText.length > 2) {
      const debounceTimer = setTimeout(() => {
        searchLocation();
      }, 500);

      return () => clearTimeout(debounceTimer);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchText]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        getCurrentLocation();
      }
      // Don't show alert if permission denied - app is already usable with default location
    } catch (error) {
      console.error("Error requesting location permission:", error);
      // Default location already set, so no need to do anything
    }
  };

  const setToDefaultLocation = () => {
    const fallbackRegion = {
      latitude: 28.6139,
      longitude: 77.209,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };

    setRegion(fallbackRegion);
    setMarkerPosition({
      latitude: 28.6139,
      longitude: 77.209,
    });

    setCurrentAddress("Tap on map to set location");
    setCurrentLocation("Or search for your address above");
    setInitialLocationLoaded(true);

    if (mapRef.current) {
      mapRef.current.animateToRegion(fallbackRegion, 1000);
    }
  };

  const getCurrentLocation = async () => {
    try {
      // Ultra-fast location with very short timeouts
      let location;

      const getCurrentPositionWithTimeout = (options: any, ms: number) => {
        return Promise.race([
          Location.getCurrentPositionAsync(options),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
        ]);
      };

      // Try low accuracy first with 1 second timeout (fastest)
      try {
        location = await getCurrentPositionWithTimeout({ accuracy: Location.Accuracy.Low }, 1000);
      } catch (error) {
        // If that fails, try balanced with 1.5 second timeout
        try {
          location = await getCurrentPositionWithTimeout({ accuracy: Location.Accuracy.Balanced }, 1500);
        } catch (balancedError) {
          // Give up - app is already usable with default location
          console.log("Location timeout - using default location");
          return;
        }
      }

      // Success - update to real location
      if (
        location &&
        typeof location === "object" &&
        "coords" in location &&
        typeof (location as any).coords === "object"
      ) {
        const loc = location as Location.LocationObject;
        const newRegion = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        setRegion(newRegion);
        setMarkerPosition({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        // Smoothly animate to real location
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1500);
        }

        // Update address in background
        updateAddressFromCoordinate({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    } catch (error) {
      console.log("Location failed - using default location");
      // App is already usable with default location
    }
  };

  const searchLocation = async () => {
    if (searchText.trim().length === 0) return;

    setIsSearching(true);
    try {
      // Try multiple search approaches for better results
      let results = [];

      // First try: Direct geocoding
      const geocodeResults = await Location.geocodeAsync(searchText);
      results = geocodeResults;

      // If no results, try with additional context
      if (results.length === 0) {
        const searchWithContext = `${searchText}, India`;
        const contextResults = await Location.geocodeAsync(searchWithContext);
        results = contextResults;
      }

      if (results.length > 0) {
        const formattedResults = await Promise.all(
          results.slice(0, 8).map(async (result) => {
            try {
              const reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: result.latitude,
                longitude: result.longitude,
              });

              if (reverseGeocode.length > 0) {
                const address = reverseGeocode[0];
                return {
                  ...result,
                  displayName:
                    address.name ||
                    address.street ||
                    address.district ||
                    address.city ||
                    "Unknown location",
                  displayAddress: [
                    address.street,
                    address.district || address.city,
                    address.region,
                    address.country,
                  ]
                    .filter(Boolean)
                    .join(", "),
                };
              }
              return {
                ...result,
                displayName: "Location",
                displayAddress: `${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`,
              };
            } catch (error) {
              return {
                ...result,
                displayName: searchText,
                displayAddress: `${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`,
              };
            }
          }),
        );

        setSearchResults(formattedResults);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
        // Show a message that no results were found
        Alert.alert(
          "No Results",
          "No locations found for your search. Try a different search term.",
        );
      }
    } catch (error) {
      console.error("Error searching location:", error);
      Alert.alert(
        "Search Error",
        "Unable to search for location. Please check your internet connection and try again.",
      );
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result : SearchResult) => {
    // Just update the marker position and address - no map animation
    setMarkerPosition({
      latitude: result.latitude,
      longitude: result.longitude,
    });

    setCurrentAddress(result.displayName);
    setCurrentLocation(result.displayAddress);

    // No automatic map animation - user can manually navigate to see the pin

    setSearchText("");
    setShowSearchResults(false);
    Keyboard.dismiss();
  };

  const onMapPress = (event : any) => {
    const coordinate = event.nativeEvent.coordinate;
    setMarkerPosition(coordinate);

    // Update address for the new location
    updateAddressFromCoordinate(coordinate);

    // Hide search results if showing
    setShowSearchResults(false);
  };

  const onRegionChangeComplete = (newRegion : any) => {
    // Do nothing - let user control the map completely
  };

  const updateAddressFromCoordinate = async (coordinate : any) => {
    try {
      const addressResponse = await Location.reverseGeocodeAsync(coordinate);

      if (addressResponse.length > 0) {
        const address = addressResponse[0];
        setCurrentAddress(
          address.street || address.name || "Selected Location",
        );
        setCurrentLocation(
          `${address.district || address.city || ""}, ${address.region || ""}`.replace(
            /^,\s*/,
            "",
          ),
        );
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      setCurrentAddress("Selected Location");
      setCurrentLocation(
        `${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
      );
    }
  };

  const handleConfirmLocation = () => {
    // Navigate to add details page with location data
    router.push({
      pathname: "/login/AddAddressdetails",
      params: {
        latitude: Number(markerPosition.latitude),
        longitude: Number(markerPosition.longitude),
        address: currentAddress ?? "",
        location: currentLocation ?? "",
        city,
        district,
        name,
        phoneNumber,
      },
    });
  };

  const clearSearch = () => {
    setSearchText("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "#FFFFFF",
          paddingTop: insets.top,
          paddingHorizontal: 20,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#E4E8EC",
          zIndex: 10,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <ArrowLeft size={24} color="#000000" />
          </TouchableOpacity>

          <Text
            style={{
              fontFamily: "Inter_700Bold",
              fontSize: 20,
              color: "#000000",
              flex: 1,
            }}
          >
            Pin Your Location
          </Text>
        </View>

        {/* Search Bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#F5F8FA",
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <Search size={20} color="#7A8292" />
          <TextInput
            placeholder="Search for your shop or street..."
            placeholderTextColor="#7A8292"
            value={searchText}
            onChangeText={setSearchText}
            style={{
              flex: 1,
              fontFamily: "Inter_400Regular",
              fontSize: 16,
              color: "#000000",
              marginLeft: 12,
            }}
            onFocus={() => setShowSearchResults(searchResults.length > 0)}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <X size={20} color="#7A8292" />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results */}
        {showSearchResults && (
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              marginTop: 8,
              maxHeight: 200,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <FlatList
              data={searchResults}
              keyExtractor={(item, index) =>
                `${item.latitude}-${item.longitude}-${index}`
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => selectSearchResult(item)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#F0F0F0",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 16,
                      color: "#000000",
                      marginBottom: 2,
                    }}
                  >
                    {item.displayName}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Inter_400Regular",
                      fontSize: 14,
                      color: "#7A8292",
                    }}
                  >
                    {item.displayAddress}
                  </Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
      </View>

      {/* Map */}
      <View style={{ flex: 1 }}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          region={region}
          onPress={onMapPress}
          onRegionChangeComplete={onRegionChangeComplete}
          showsUserLocation={true}
          showsMyLocationButton={false}
          scrollEnabled={true}
          zoomEnabled={true}
          pitchEnabled={true}
          rotateEnabled={true}
        >
          <Marker
            coordinate={markerPosition}
            draggable={true}
            onDragEnd={(e) => {
              const coordinate = e.nativeEvent.coordinate;
              setMarkerPosition(coordinate);
              updateAddressFromCoordinate(coordinate);
            }}
          >
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MapPin size={32} color="#FF4444" />
            </View>
          </Marker>
        </MapView>

        {/* My Location Button */}
        <TouchableOpacity
          onPress={getCurrentLocation}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            padding: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <MapPin size={24} color="#22C55E" />
        </TouchableOpacity>

        {/* Address Display and Confirm Button */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: insets.bottom + 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 18,
                color: "#000000",
                marginBottom: 4,
              }}
            >
              {currentAddress}
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 14,
                color: "#7A8292",
              }}
            >
              {currentLocation}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleConfirmLocation}
            style={{
              backgroundColor: "#22C55E",
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 16,
                color: "#FFFFFF",
              }}
            >
              Confirm Location
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}



