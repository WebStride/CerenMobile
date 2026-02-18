import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, Search, MapPin, X } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Platform } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from "react-native-maps";
import * as Location from "expo-location";
import Constants from 'expo-constants';
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
  const [initialLocationLoaded, setInitialLocationLoaded] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
const params = useLocalSearchParams();

  // Coerce params to expected types and provide safe defaults
  const city = (params.city as string) ?? "";
  const district = (params.district as string) ?? "";
  const name = (params.name as string) ?? "";
  const phoneNumber = (params.phoneNumber as string) ?? "";
  const fromLocationModal = (params.fromLocationModal as string) ?? "";
  // Optional address or lat/lng passed from previous screen
  const addressParam = (params.address as string) ?? (params.location as string) ?? "";
  const paramLatitude = params.latitude ? Number(params.latitude) : null;
  const paramLongitude = params.longitude ? Number(params.longitude) : null;

  useEffect(() => {
    console.log("📍 Received params in PinLocation:", { city, district, name, phoneNumber, fromLocationModal, addressParam, paramLatitude, paramLongitude });
    // If caller provided city/district, show them immediately as the current location text
    if (city || district) {
      const cityText = city || "Bengaluru";
      const districtText = district || "Bangalore Urban";
      setCurrentAddress(cityText);
      setCurrentLocation(districtText + ", India");
    }

    // Orchestrate initial location: race device GPS vs geocoding the passed address (if any)
    initLocationFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      console.log('[PinLocation] Requesting location permission...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('[PinLocation] requestLocationPermission -> status:', status);
      
      if (status !== 'granted') {
        // Show user-friendly alert in production
        if (!__DEV__) {
          Alert.alert(
            'Location Permission Required',
            'Please enable location permission in your device settings to use this feature.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => {
                // Note: Opening settings requires additional linking setup
                console.log('[PinLocation] User requested to open settings');
              }}
            ]
          );
        }
      }
      
      return status === 'granted';
    } catch (error) {
      console.error('[PinLocation] Error requesting location permission:', error);
      
      // Alert user in production about permission error
      if (!__DEV__) {
        Alert.alert(
          'Location Error',
          'Unable to request location permission. Please check your device settings.',
          [{ text: 'OK' }]
        );
      }
      
      return false;
    }
  };

  // Get device location but return it instead of mutating state.
  const getCurrentLocationAsync = async (timeoutMs: number = 4000): Promise<Location.LocationObject | null> => {
    try {
      const getWithTimeout = (options: any, ms: number) => Promise.race([
        Location.getCurrentPositionAsync(options),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
      ]);

      let location: any = null;
      // Try progressive attempts and log each attempt outcome
      try {
        console.log(`[PinLocation] getCurrentLocationAsync: trying Low accuracy timeout=${timeoutMs}ms`);
        location = await getWithTimeout({ accuracy: Location.Accuracy.Low }, timeoutMs);
        console.log('[PinLocation] getCurrentLocationAsync: Low accuracy succeeded', location?.coords);
      } catch (e1) {
        console.log('[PinLocation] getCurrentLocationAsync: Low accuracy failed, trying Balanced');
        try {
          location = await getWithTimeout({ accuracy: Location.Accuracy.Balanced }, timeoutMs + 2000);
          console.log('[PinLocation] getCurrentLocationAsync: Balanced succeeded', location?.coords);
        } catch (e2) {
          console.log('[PinLocation] getCurrentLocationAsync: Balanced failed, trying High');
          try {
            location = await getWithTimeout({ accuracy: Location.Accuracy.High }, timeoutMs + 4000);
            console.log('[PinLocation] getCurrentLocationAsync: High succeeded', location?.coords);
          } catch (e3) {
            console.log('[PinLocation] getCurrentLocationAsync: All attempts failed');
            return null;
          }
        }
      }

      console.log('[PinLocation] getCurrentLocationAsync -> final location', location?.coords);
      return location as Location.LocationObject;
    } catch (error) {
      console.warn('[PinLocation] getCurrentLocationAsync unexpected error', error);
      return null;
    }
  };

  // Geocode the provided address string. Returns either a SearchResult-like object or null.
  const geocodeAddress = async (address: string) => {
    try {
      console.log('[PinLocation] geocodeAddress -> start', address ? address.slice(0, 120) : address);
      if (!address) return null;
      if (GOOGLE_MAPS_API_KEY) {
        const encoded = encodeURIComponent(address);
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${GOOGLE_MAPS_API_KEY}&language=en`;
        const start = Date.now();
        const resp = await fetch(geocodeUrl);
        const json = await resp.json();
        console.log('[PinLocation] geocodeAddress -> google response status', resp.status, 'took', Date.now() - start, 'ms');
        if (json && Array.isArray(json.results) && json.results.length > 0) {
          const r = json.results[0];
          const loc = r.geometry.location;
          console.log('[PinLocation] geocodeAddress -> parsed location', loc);
          return {
            displayName: r.formatted_address,
            displayAddress: r.formatted_address,
            latitude: loc.lat,
            longitude: loc.lng,
            geometry: r.geometry,
            formattedAddress: r.formatted_address,
          } as any;
        }
        console.log('[PinLocation] geocodeAddress -> google returned no results');
        return null;
      } else {
        // Fallback to expo-location geocode
        console.log('[PinLocation] geocodeAddress -> using expo-location geocode fallback');
        const results = await Location.geocodeAsync(address);
        if (results && results.length > 0) {
          const res = results[0];
          console.log('[PinLocation] geocodeAddress -> expo-location result', res);
          return { displayName: address, displayAddress: address, latitude: res.latitude, longitude: res.longitude } as any;
        }
        return null;
      }
    } catch (error) {
      console.warn('[PinLocation] geocodeAddress failed', error);
      return null;
    }
  };

  // Initialize location by racing device GPS and geocoding the provided address (if present).
  const initLocationFlow = async () => {
    console.log('[PinLocation] initLocationFlow -> starting');
    setInitialLocationLoaded(false);

    // If explicit lat/long were passed, use them immediately (fastest).
    if (paramLatitude && paramLongitude) {
      const newRegion = {
        latitude: paramLatitude,
        longitude: paramLongitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      console.log('[PinLocation] initLocationFlow -> using passed param lat/lng', paramLatitude, paramLongitude);
      setRegion(newRegion);
      setMarkerPosition({ latitude: paramLatitude, longitude: paramLongitude });
      setInitialLocationLoaded(true);
      // Also try to obtain live device location and animate to it if available
      (async () => {
        const granted = await requestLocationPermission();
        if (granted) {
          const device = await getCurrentLocationAsync(4000);
          if (device) {
            const dRegion = {
              latitude: device.coords.latitude,
              longitude: device.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            };
            if (mapRef.current) mapRef.current.animateToRegion(dRegion, 800);
            setRegion(dRegion);
            setMarkerPosition({ latitude: device.coords.latitude, longitude: device.coords.longitude });
            updateAddressFromCoordinate({ latitude: device.coords.latitude, longitude: device.coords.longitude });
          }
        }
      })();

      return;
    }
    // Start permission request and both location strategies in parallel
    console.log('[PinLocation] initLocationFlow -> starting parallel strategies (device & geocode)');
    const permissionPromise = requestLocationPermission();
    const geocodePromise = addressParam ? geocodeAddress(addressParam) : Promise.resolve(null);
    const devicePromise = (async () => {
      const granted = await permissionPromise;
      console.log('[PinLocation] initLocationFlow -> permission granted?', granted);
      if (!granted) return null;
      return await getCurrentLocationAsync(4000);
    })();

    try {
      // Race device vs geocode; whichever resolves first we'll show immediately.
      const first = await Promise.race([devicePromise, geocodePromise]);
      console.log('[PinLocation] initLocationFlow -> race winner', !!first, first && ('coords' in first ? 'device' : 'geocode'));

      if (first && 'coords' in first) {
        // Device location won the race
        const loc = first as Location.LocationObject;
        console.log('[PinLocation] initLocationFlow -> device won with coords', loc.coords);
        const newRegion = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(newRegion);
        setMarkerPosition({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        setInitialLocationLoaded(true);
        // Update address asynchronously
        updateAddressFromCoordinate({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });

        // If geocode is still pending, let it finish but prefer device coordinates
        geocodePromise.then((g) => {
          if (g && !('coords' in g)) {
            console.log('[PinLocation] initLocationFlow -> geocode finished later', g);
            // set address text but do not override marker
            setCurrentAddress(g.displayName || g.formattedAddress || currentAddress);
            setCurrentLocation(g.displayAddress || currentLocation);
          }
        }).catch(() => {});
      } else if (first) {
        // Geocode won the race (or device was not available). Use geocode result.
        const g = first as any;
        console.log('[PinLocation] initLocationFlow -> geocode won', g);
        const lat = g.latitude || (g.geometry && g.geometry.location && g.geometry.location.lat);
        const lng = g.longitude || (g.geometry && g.geometry.location && g.geometry.location.lng);
        if (lat && lng) {
          const newRegion = { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 };
          setRegion(newRegion);
          setMarkerPosition({ latitude: lat, longitude: lng });
          setCurrentAddress(g.displayName || g.formattedAddress || currentAddress);
          setCurrentLocation(g.displayAddress || currentLocation);
          setInitialLocationLoaded(true);

          // Meanwhile, if device becomes available later, animate to it
          devicePromise.then((device) => {
            if (device && device.coords) {
              console.log('[PinLocation] initLocationFlow -> device arrived later', device.coords);
              const dRegion = { latitude: device.coords.latitude, longitude: device.coords.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 };
              if (mapRef.current) mapRef.current.animateToRegion(dRegion, 800);
              setRegion(dRegion);
              setMarkerPosition({ latitude: device.coords.latitude, longitude: device.coords.longitude });
              updateAddressFromCoordinate({ latitude: device.coords.latitude, longitude: device.coords.longitude });
            }
          }).catch(() => {});
        } else {
          // Nothing useful, fall back
          console.log('[PinLocation] initLocationFlow -> geocode result had no coords, falling back');
          setToDefaultLocation();
        }
      } else {
        // Neither returned a result quickly; fall back to default and try device longer
        console.log('[PinLocation] initLocationFlow -> neither device nor geocode returned quickly; using fallback');
        setToDefaultLocation();
        // Try device again with longer timeout
        const granted = await permissionPromise;
        if (granted) {
          const device = await getCurrentLocationAsync(8000);
          if (device && device.coords) {
            console.log('[PinLocation] initLocationFlow -> late device success', device.coords);
            const dRegion = { latitude: device.coords.latitude, longitude: device.coords.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 };
            if (mapRef.current) mapRef.current.animateToRegion(dRegion, 800);
            setRegion(dRegion);
            setMarkerPosition({ latitude: device.coords.latitude, longitude: device.coords.longitude });
            updateAddressFromCoordinate({ latitude: device.coords.latitude, longitude: device.coords.longitude });
            setInitialLocationLoaded(true);
          }
        }
      }
    } catch (err) {
      console.error('[PinLocation] initLocationFlow error:', err);
      setToDefaultLocation();
    }
  };
  // Expose the Google Maps keys from app config (app.config.js injects these into expo.extra)
  const extras = (Constants.expoConfig?.extra as any) || (Constants.manifest2?.extra as any) || {};
  
  // For production: directly use EXPO_GOOGLE_MAPS_API_KEY for Android (simpler approach)
  // This matches the production .env variable name exactly
  const ANDROID_API_KEY = extras.GOOGLE_MAPS_API_KEY_ANDROID || extras.GOOGLE_MAPS_API_KEY || '';
  const IOS_API_KEY = extras.GOOGLE_MAPS_API_KEY_IOS || extras.GOOGLE_MAPS_API_KEY || '';
  const API_BASE_URL = extras.EXPO_PUBLIC_API_URL || extras.API_BASE_URL || '';

  // Select platform-appropriate key at runtime. This is important for Expo Go where
  // the same JS bundle is served to multiple platforms but you want device-specific keys.
  const GOOGLE_MAPS_API_KEY = Platform.OS === 'ios' ? IOS_API_KEY : ANDROID_API_KEY;

  // Debug: log masked runtime key info so developers can confirm which key is available
  // Note: we intentionally do not print the full key here to avoid accidental leakage.
  try {
    const source = GOOGLE_MAPS_API_KEY
      ? (Platform.OS === 'ios' ? 'expoConfig.extra.GOOGLE_MAPS_API_KEY_IOS' : 'expoConfig.extra.GOOGLE_MAPS_API_KEY_ANDROID')
      : 'none';
    const masked = GOOGLE_MAPS_API_KEY
      ? (GOOGLE_MAPS_API_KEY.length > 12
          ? `${GOOGLE_MAPS_API_KEY.slice(0, 8)}...${GOOGLE_MAPS_API_KEY.slice(-4)}`
          : GOOGLE_MAPS_API_KEY)
      : '<none>';
    const both = { android: !!ANDROID_API_KEY, ios: !!IOS_API_KEY };
    console.log('[PinLocation] Runtime GOOGLE_MAPS_API_KEY selected:', !!GOOGLE_MAPS_API_KEY, 'source=', source, 'masked=', masked, 'available=', both, 'platform=', Platform.OS);
  } catch (e) {
    console.log('[PinLocation] Error logging GOOGLE_MAPS_API_KEY', e);
  }

  const setToDefaultLocation = () => {
    // Use Bengaluru as the friendly default region (city center)
    const fallbackRegion = {
      latitude: 12.9716,
      longitude: 77.5946,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };

    setRegion(fallbackRegion);
    setMarkerPosition({
      latitude: fallbackRegion.latitude,
      longitude: fallbackRegion.longitude,
    });

    // Show Bengaluru / Bangalore Urban as default visible text so users see local context
    setCurrentAddress("Bengaluru");
    setCurrentLocation("Bangalore Urban, India");
    setInitialLocationLoaded(true);

    if (mapRef.current) {
      mapRef.current.animateToRegion(fallbackRegion, 1000);
    }
  };

  const getCurrentLocation = async () => {
    try {
      // Ultra-fast location with very short timeouts
      let location;
      // Helper: try to get current position with a timeout
      const getCurrentPositionWithTimeout = (options: any, ms: number) => {
        return Promise.race([
          Location.getCurrentPositionAsync(options),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
        ]);
      };

      // Try progressively longer timeouts to improve chance of success on slow devices
      try {
        // Low accuracy attempt (fast)
        location = await getCurrentPositionWithTimeout({ accuracy: Location.Accuracy.Low }, 3000);
      } catch (error) {
        try {
          // Balanced accuracy attempt
          location = await getCurrentPositionWithTimeout({ accuracy: Location.Accuracy.Balanced }, 5000);
        } catch (balancedError) {
          try {
            // High accuracy attempt (last resort)
            location = await getCurrentPositionWithTimeout({ accuracy: Location.Accuracy.High }, 8000);
          } catch (highError) {
            console.log("Location timeout - falling back to default location");
            setToDefaultLocation();
            return;
          }
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

        // Mark that initial live location has been loaded
        setInitialLocationLoaded(true);

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
      console.log('[PinLocation] searchLocation -> input', searchText);
      // If we have a Google Maps API key, prefer Places Autocomplete (better UX)
      let autoResp: Response | null = null;
      let autoJson: any = null;
      if (API_BASE_URL) {
        // Use server proxy
        const proxyBase = API_BASE_URL.replace(/\/\/$/, '');
        autoResp = await fetch(`${proxyBase}/maps/place-autocomplete?input=${encodeURIComponent(searchText)}`);
        autoJson = await autoResp.json();
        console.log('[PinLocation] Places autocomplete (proxied) -> status', autoResp.status, autoJson && (autoJson.error_message || autoJson.status));
        if (autoResp.status !== 200) console.warn('[PinLocation] Proxy autocomplete returned non-200', autoResp.status, autoJson);
      } else if (GOOGLE_MAPS_API_KEY) {
        const input = encodeURIComponent(searchText);
        const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&key=${GOOGLE_MAPS_API_KEY}&components=country:in&language=en`;

        autoResp = await fetch(autocompleteUrl);
        autoJson = await autoResp.json();
        console.log('[PinLocation] Places autocomplete -> status', autoResp.status, 'body:', (autoJson && (autoJson.error_message || autoJson.status)) || autoJson);
      }

      if (autoJson && Array.isArray(autoJson.predictions) && autoJson.predictions.length > 0) {
          // For each prediction, fetch place details to get coordinates. If details fail
          // (e.g., REQUEST_DENIED due to key restrictions), try a lightweight
          // fallback using expo-location geocode on the prediction description.
          const predictions = autoJson.predictions.slice(0, 6);
          const detailed = await Promise.all(predictions.map(async (p: any) => {
            const placeId = p.place_id;
            try {
              let detailsResp: any;
              let detailsJson: any;
              if (API_BASE_URL) {
                const proxyBase = API_BASE_URL.replace(/\/\/$/, '');
                const resp = await fetch(`${proxyBase}/maps/place-details?place_id=${encodeURIComponent(placeId)}`);
                detailsResp = resp;
                detailsJson = await resp.json();
              } else {
                const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,name,formatted_address&key=${GOOGLE_MAPS_API_KEY}`;
                detailsResp = await fetch(detailsUrl);
                detailsJson = await detailsResp.json();
              }
              console.log('[PinLocation] Place details -> place_id', placeId, 'status', detailsResp.status, detailsJson && (detailsJson.error_message || detailsJson.status));

              const loc = detailsJson?.result?.geometry?.location;
              const nameText = detailsJson?.result?.name || p.description;
              const formattedAddress = detailsJson?.result?.formatted_address || p.description;

              if (loc && loc.lat && loc.lng) {
                return {
                  displayName: nameText,
                  displayAddress: formattedAddress,
                  latitude: loc.lat,
                  longitude: loc.lng,
                } as SearchResult;
              }
            } catch (err) {
              console.warn('[PinLocation] Place details fetch failed for', p.description, err);
            }

            // Fallback: try expo-location geocoding for the textual description
            try {
              const geocodeResults = await Location.geocodeAsync(p.description);
              if (geocodeResults && geocodeResults.length > 0) {
                const r = geocodeResults[0];
                return {
                  displayName: p.description,
                  displayAddress: p.description,
                  latitude: r.latitude,
                  longitude: r.longitude,
                } as SearchResult;
              }
            } catch (geoErr) {
              console.warn('[PinLocation] Fallback geocode failed for', p.description, geoErr);
            }

            // If everything fails, return a shallow fallback with description only
            return {
              displayName: p.description,
              displayAddress: p.description,
              latitude: NaN,
              longitude: NaN,
            } as any;
          }));

          const filtered = detailed.filter((x) => x && !Number.isNaN((x as any).latitude)) as SearchResult[];
          if (filtered.length > 0) {
            setSearchResults(filtered);
            setShowSearchResults(true);
            return;
          }
        // If autocomplete returned empty, fall through to geocode fallback
      }

      // Fallback: use expo-location geocoding
      let results: any[] = [];
      const geocodeResults = await Location.geocodeAsync(searchText);
      results = geocodeResults;
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
                  latitude: result.latitude,
                  longitude: result.longitude,
                } as SearchResult;
              }
              return {
                displayName: "Location",
                displayAddress: `${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`,
                latitude: result.latitude,
                longitude: result.longitude,
              } as SearchResult;
            } catch (error) {
              return {
                displayName: searchText,
                displayAddress: `${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`,
                latitude: result.latitude,
                longitude: result.longitude,
              } as SearchResult;
            }
          }),
        );

        setSearchResults(formattedResults);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
        Alert.alert("No Results", "No locations found for your search. Try a different search term.");
      }
    } catch (error) {
      console.error("Error searching location:", error);
      Alert.alert("Search Error", "Unable to search for location. Please check your internet connection and try again.");
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result : SearchResult) => {
    // Update the marker position and animate the map to the selected result
    const newRegion = {
      latitude: result.latitude,
      longitude: result.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    setMarkerPosition({ latitude: result.latitude, longitude: result.longitude });
    setRegion(newRegion);
    if (mapRef.current) {
      try {
        mapRef.current.animateToRegion(newRegion, 800);
      } catch (err) {
        // ignore animate errors on some platforms
      }
    }

    setCurrentAddress(result.displayName);
    setCurrentLocation(result.displayAddress);

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
    if (isNavigating) return;
    setIsNavigating(true);

    // Normalize params to plain serializable strings to avoid navigation/worklet issues
    const latStr = String(Number(markerPosition.latitude));
    const lngStr = String(Number(markerPosition.longitude));

    console.log("📍 Confirming location and navigating to AddAddressDetails");
    console.log("📋 Navigation params:", {
      latitude: latStr,
      longitude: lngStr,
      address: currentAddress ?? "",
      location: currentLocation ?? "",
      city,
      district,
      name,
      phoneNumber,
      fromLocationModal
    });

    // Navigate to add details page with location data (params serialized as strings)
    router.push({
      pathname: "/login/AddAddressdetails",
      params: {
        latitude: latStr,
        longitude: lngStr,
        address: currentAddress ?? "",
        location: currentLocation ?? "",
        city,
        district,
        name,
        phoneNumber,
        fromLocationModal,
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
          // Use Google provider only on Android. On iOS use Apple Maps unless
          // the native Google Maps SDK is configured via app.config.js + prebuild/pods.
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
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

        {/* Locating overlay shown until we resolve the initial live location or fallback */}
        {!initialLocationLoaded && (
          <View
            style={{
              position: 'absolute',
              top: '40%',
              left: 0,
              right: 0,
              zIndex: 50,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                backgroundColor: 'rgba(255,255,255,0.95)',
                padding: 14,
                borderRadius: 12,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 6,
              }}
            >
              <ActivityIndicator size="large" color="#22C55E" />
              <Text
                style={{
                  marginTop: 10,
                  fontFamily: 'Inter_500Medium',
                  fontSize: 14,
                  color: '#222',
                }}
              >
                Locating...
              </Text>
            </View>
          </View>
        )}

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
            disabled={isNavigating}
            style={{
              backgroundColor: isNavigating ? "#A0A0A0" : "#22C55E",
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
              {isNavigating ? "Confirming..." : "Confirm Location"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}



