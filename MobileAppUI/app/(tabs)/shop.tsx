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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  getExclusiveOffers,
  getBestSelling,
  getCategories,
  checkCustomerExists,
  getNewProducts,
  getBuyAgainProducts
} from "@/services/api";
import { useCart } from "../context/CartContext";

// Types
interface Product {
  productId: number;
  productName: string;
  productUnits: number;
  unitsOfMeasurement: string;
  price: number;
  // API may return a URL (string) or we'll use a local require (number)
  image: string | number | null;
  // minimum order quantity from API may be named minimumOrderQuantity or minOrderQuantity
  minOrderQuantity?: number;
}

interface Category {
  categoryId: number;
  categoryName: string;
  categoryImage: string | null;
}

const defaultImage = require("../../assets/images/Banana.png");
const fallbackImages = [
  require("../../assets/images/Banana.png"),
  require("../../assets/images/PulsesCategory.png"),
  require("../../assets/images/LocationThumbnail.png"),
  require("../../assets/images/HomeLogo.png"),
];

// ---------- Complete ProductCard with Cart + Favorites + Navigation Functionality ----------
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

  // Create unique identifier for this specific instance
  const uniqueInstanceId = `${sectionKey}_${item.productId}_${index}`;

  // Find cart item
  const cartItem = cart.find(x => x.productId === item.productId);
  const isProductFavourite = isFavourite(item.productId);
  const minOrder = item.minOrderQuantity || (item as any).minimumOrderQuantity || 1;

  // Local state - simple and isolated
  const [showControls, setShowControls] = useState(!!cartItem);
  const [qtyInput, setQtyInput] = useState(cartItem ? String(cartItem.quantity) : String(minOrder));

  // Simple sync with cart
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

  // Handle navigation to product details
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

  // Correctly shape image source for React Native Image
  const getImageSource = () => {
    const img = (item as any).image;
    if (img && typeof img === 'string' && (img.startsWith('http') || img.startsWith('https'))) {
      return { uri: img };
    }
    return img || defaultImage;
  };

  // Handle favorites toggle
  const handleFavouriteToggle = useCallback((event: any) => {
    event.stopPropagation(); // Prevent navigation when heart is pressed
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
    for (let i = 0; i < qty; i++) {
      addToCart({
        productId: item.productId,
        productName: item.productName,
        price: item.price,
        image: typeof (item as any).image === 'number' ? '' : (item.image as string | null),
        productUnits: item.productUnits,
        unitsOfMeasurement: item.unitsOfMeasurement,
      });
    }
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
      for (let i = 0; i < numVal; i++) {
        addToCart({
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          image: typeof (item as any).image === 'number' ? '' : (item.image as string | null),
          productUnits: item.productUnits,
          unitsOfMeasurement: item.unitsOfMeasurement,
        });
      }
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
      className="bg-white rounded-xl p-3 mr-4 w-36 border border-gray-100"
    >
      {/* Clickable Product Image Area */}
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
        {/* Favourite Heart Icon - Top Right Corner */}
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

      {/* MOQ Info - show when greater than 1 */}
      {minOrder > 1 && (
        <Text className="text-red-500 text-xs mb-1 font-medium">Min: {minOrder}</Text>
      )}

      {/* Price */}
      <View className="w-full mb-2">
        <Text className="font-bold text-base text-gray-900">₹{item.price}.00</Text>
      </View>

      {/* Add to Cart Button OR Quantity Controls */}
      {isCustomerExists ? (
        showControls ? (
          // Improved Quantity Controls with better input sizing
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
          // Add to Cart Button
          <TouchableOpacity
            className="w-full bg-green-700 rounded-full py-2 px-3 items-center justify-center"
            onPress={handleAddToCartPress}
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold text-sm">Add {minOrder > 1 ? `${minOrder}` : ''} to Cart</Text>
          </TouchableOpacity>
        )
      ) : (
        // Customer doesn't exist
        <View className="w-full bg-gray-300 rounded-full py-2 px-3 items-center justify-center">
          <Text className="text-gray-600 font-semibold text-sm">Verification Required</Text>
        </View>
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
  {/* handle remote category images */}
  <Image source={typeof item.categoryImage === 'string' ? { uri: item.categoryImage } : (item.categoryImage || defaultImage)} className="w-12 h-12 mb-2" resizeMode="contain" />
      <Text className="font-semibold text-sm text-gray-800 flex-1">
        {item.categoryName}
      </Text>
    </TouchableOpacity>
  );
};

// ---------- Home Screen ----------
const HomeScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams(); // Get route parameters
  const { cartCount } = useCart();

  // Extract location details from params - Updated to use dynamic location
  const { phoneNumber, name, location, city, district, address } = params;

  // Create a display-friendly location string from the params
  const getLocationDisplay = () => {
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

  // Handle location picker navigation
  const handleLocationPress = useCallback(() => {
    router.push({
      pathname: "/login/PinLocation",
      params: { city, district, name, phoneNumber },
    }); // Navigate to your location picker screen
  }, [router]);

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
    fetchData();
  }, []);

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

      // Normalizer - prefer API field names flexibly
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

  const handleSeeAllPress = () => {
    router.push("/products/AllProductsList");
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
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Top Header - Updated with Dynamic Location */}
            <View className="flex-row items-center justify-between px-5 mt-20">
              {/* Dynamic Location Display with Dropdown Arrow */}
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
                  {locationDisplay}
                </Text>
                <Ionicons name="chevron-down-outline" size={18} color="#222" className="ml-1" />
              </TouchableOpacity>

              {/* Profile Image */}
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

            {/* Search Box - Updated placeholder text to match Figma */}
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
            <View className="absolute left-0 right-0 bottom-6 px-4 z-50">
              <TouchableOpacity
                className="bg-green-700 rounded-full flex-row items-center justify-between px-6 py-4 shadow-lg"
                activeOpacity={0.95}
                onPress={() => router.push("/cart")}
              >
                <View className="flex-row items-center space-x-2">
                  <Ionicons name="cart-outline" size={22} color="#fff" />
                  <Text className="text-white font-semibold text-base">
                    Go to Cart
                  </Text>
                </View>
                <View className="px-3 py-1 rounded-full bg-white/10 items-center flex-row" style={{ minWidth: 48 }}>
                  <Text className="text-white font-bold">
                    {cartCount} {cartCount === 1 ? "item" : "items"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
};

export default HomeScreen;
