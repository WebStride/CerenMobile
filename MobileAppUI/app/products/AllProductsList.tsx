import React, { useEffect, useState, useCallback, useMemo } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  Alert,
  SafeAreaView,
  TextInput
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getExclusiveOffers, getBestSelling, getNewProducts, getBuyAgainProducts, checkCustomerExists } from "@/services/api";
import { useCart } from "../context/CartContext";
import { useFavourites } from "../context/FavouritesContext";
import { PriceRequestModal } from "@/components/PriceRequestModal";
import { QuantitySelector } from "@/components/QuantitySelector";

// Blurhash for smooth placeholder (light gray)
const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

// Product interface definition
interface Product {
  productId: number;
  productName: string;
  productUnits: number;
  unitsOfMeasurement: string;
  price: number;
  // API may return URL (string) or we will assign local require (number)
  image: string | number | null;
  minOrderQuantity: number; // Made required instead of optional
  description?: string;
  nutritionInfo?: string;
  otherDetails?: string;
}

const defaultImage = require("../../assets/images/Banana.png");
const fallbackImages = [
  require("../../assets/images/Banana.png"),
  require("../../assets/images/PulsesCategory.png"),
  require("../../assets/images/LocationThumbnail.png"),
  require("../../assets/images/HomeLogo.png"),
];

// Mock data for 100+ products with guaranteed minOrderQuantity
const generateMockProducts = (count: number): Product[] => {
  const productNames = [
    "Fresh Bananas", "Organic Apples", "Green Spinach", "Red Tomatoes", "Fresh Carrots",
    "Broccoli Crown", "Sweet Potatoes", "Bell Peppers", "Cucumber", "Onions",
    "Garlic Bulbs", "Fresh Ginger", "Lemons", "Oranges", "Grapes",
    "Strawberries", "Blueberries", "Avocados", "Lettuce", "Celery",
    "Cauliflower", "Cabbage", "Corn", "Peas", "Green Beans",
    "Mushrooms", "Zucchini", "Eggplant", "Radish", "Beetroot"
  ];
  
  const units = [250, 500, 1000, 1500, 2000];
  const measurements = ["g", "kg", "pieces", "bunch"];
  
  // Create array of sample image URLs
  const imageUrls = [
    "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=300&h=300&fit=crop"
  ];
  
  // Define different minimum order quantities based on product type
  const getMinOrderQuantity = (productName: string, measurement: string): number => {
    // Bulk items (kg) typically have lower MOQ
    if (measurement === "kg") {
      return Math.floor(Math.random() * 2) + 1; // 1-2
    }
    // Smaller units (g) have higher MOQ
    else if (measurement === "g") {
      return Math.floor(Math.random() * 3) + 2; // 2-4
    }
    // Pieces/bunch have varied MOQ
    else if (measurement === "pieces") {
      return Math.floor(Math.random() * 5) + 3; // 3-7
    }
    // Bunch items
    else {
      return Math.floor(Math.random() * 2) + 1; // 1-2
    }
  };
  
  return Array.from({ length: count }, (_, index) => {
    const productName = productNames[index % productNames.length];
    const measurement = measurements[Math.floor(Math.random() * measurements.length)];
    const minOrderQty = getMinOrderQuantity(productName, measurement);
    
    return {
      productId: index + 1,
      productName,
      productUnits: units[Math.floor(Math.random() * units.length)],
      unitsOfMeasurement: measurement,
      price: Math.floor(Math.random() * 200) + 20,
      image: imageUrls[index % imageUrls.length],
      minOrderQuantity: minOrderQty, // Guaranteed to have a valid MOQ
      description: `Fresh and natural ${productName} sourced directly from farms. Rich in nutrients and perfect for daily consumption.`,
      nutritionInfo: "100gm",
      otherDetails: "Store in a cool, dry place. Best consumed within 3-5 days."
    };
  });
};

// Updated Product Card Component with Enhanced MOQ Support
const ProductCard = React.memo(({ 
  item, 
  isCustomerExists,
  index 
}: { 
  item: Product;
  isCustomerExists: boolean;
  index: number;
}) => {
  const { cart, addToCart, increaseQuantity, decreaseQuantity, removeFromCart, setQuantity } = useCart();
  const { addToFavourites, removeFromFavourites, isFavourite } = useFavourites();
  const router = useRouter();
  
  const cartItem = cart.find(x => x.productId === item.productId);
  const isProductFavourite = isFavourite(item.productId);
  const minOrder = item.minOrderQuantity; // Now guaranteed to exist
  
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

  // Navigation to product details
  const handleProductPress = useCallback(() => {
    router.push({
      pathname: '/products/[productId]',
      params: {
        productId: item.productId.toString(),
        productName: item.productName,
        productUnits: item.productUnits.toString(),
        unitsOfMeasurement: item.unitsOfMeasurement,
        price: item.price.toString(),
        image: item.image || '',
        minOrderQuantity: minOrder.toString(),
        description: item.description || `Fresh and natural ${item.productName} sourced directly from farms.`,
        nutritionInfo: item.nutritionInfo || "100gm",
        otherDetails: item.otherDetails || "Store in a cool, dry place."
      },
    });
  }, [item, minOrder, router]);

  // Handle favorites toggle
  const handleFavouriteToggle = useCallback((event: any) => {
    event.stopPropagation();
    if (isProductFavourite) {
      removeFromFavourites(item.productId);
    } else {
      addToFavourites({
        ...item,
        minQuantity: minOrder,
        image: typeof item.image === 'number' ? '' : (item.image as string | null)
      } as any);
    }
  }, [isProductFavourite, item, minOrder, addToFavourites, removeFromFavourites]);

  // Enhanced Add to Cart with MOQ validation
  const handleAddToCartPress = useCallback(() => {
    addToCart({
      productId: item.productId,
      productName: item.productName,
      price: item.price,
  image: typeof item.image === 'number' ? '' : (item.image as string | null),
      productUnits: item.productUnits,
      unitsOfMeasurement: item.unitsOfMeasurement,
    }, minOrder);
    setShowControls(true);
  }, [item, addToCart, minOrder]);

  const handleSetQuantity = useCallback((qty: number) => {
    setQuantity(item.productId, qty);
  }, [setQuantity, item.productId]);

  // Enhanced decrease with MOQ validation
  const handleDecrease = useCallback(() => {
    if (cartItem && cartItem.quantity > minOrder) {
      decreaseQuantity(item.productId);
    } else if (cartItem && cartItem.quantity === minOrder) {
      removeFromCart(item.productId);
    } else {
      // Show MOQ warning
      Alert.alert(
        "Minimum Order Quantity", 
        `Cannot decrease below minimum order quantity of ${minOrder}`
      );
    }
  }, [cartItem, decreaseQuantity, removeFromCart, item.productId, minOrder]);

  const handleIncrease = useCallback(() => {
    increaseQuantity(item.productId);
  }, [increaseQuantity, item.productId]);

  // Handle image source properly for display
  const getImageSource = () => {
    if (item.image && typeof item.image === 'string' && item.image.startsWith('http')) {
      return { uri: item.image };
    }
    return defaultImage;
  };

  return (
    <View className="bg-white rounded-xl p-3 m-2 flex-1 border border-gray-100 min-w-0">
      {/* Clickable Product Image Area */}
      <TouchableOpacity
        onPress={handleProductPress}
        className="items-center mb-2 relative"
        activeOpacity={0.7}
      >
        <Image 
          source={getImageSource()} 
          placeholder={blurhash}
          contentFit="contain"
          transition={200}
          cachePolicy="memory-disk"
          style={{ width: 80, height: 80, marginBottom: 8, backgroundColor: '#f3f4f6' }}
        />
        {/* Favourite Heart Icon */}
        <TouchableOpacity
          onPress={handleFavouriteToggle}
          className="absolute top-1 right-1 bg-white/80 rounded-full p-1 shadow-sm"
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isProductFavourite ? "heart" : "heart-outline"} 
            size={16} 
            color={isProductFavourite ? "#EF4444" : "#9CA3AF"} 
          />
        </TouchableOpacity>
      </TouchableOpacity>

      <Text 
        className="text-sm font-semibold text-gray-900 mb-1" 
        numberOfLines={2} 
        ellipsizeMode="tail"
      >
        {item.productName}
      </Text>
      <Text className="text-gray-500 text-xs mb-1">
        {item.productUnits} {item.unitsOfMeasurement}
      </Text>
      
      {/* MOQ Info - Always show if > 1 */}
      {minOrder > 1 && (
        <Text className="text-red-500 text-xs mb-1 font-medium">
          Min: {minOrder}
        </Text>
      )}
      
      {/* Price */}
      <View className="w-full mb-2">
        {isCustomerExists && item.price > 0 ? (
          <Text className="font-bold text-sm text-gray-900">₹{item.price}.00</Text>
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
      
      {/* Add to Cart Button OR Quantity Controls */}
      {(isCustomerExists && item.price > 0) ? (
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
            className="w-full bg-green-700 rounded-full py-1.5 px-2 items-center justify-center"
            onPress={handleAddToCartPress}
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold text-xs">
              Add {minOrder > 1 ? `${minOrder}` : ''} to Cart
            </Text>
          </TouchableOpacity>
        )
      ) : null}
    </View>
  );
});

const AllProductsList = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const feedType = (params.feedType as string) || "all"; // exclusive|bestselling|newproducts|buyagain|all
  const { cartCount } = useCart();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [isCustomerExists, setIsCustomerExists] = useState<boolean | null>(null);

  const ITEMS_PER_PAGE = 20;
  const mockData = useMemo(() => generateMockProducts(100), []);
  const fullFeedRef = React.useRef<Product[] | null>(null);

  const getFallbackImageFor = (id: number) => fallbackImages[id % fallbackImages.length];

  // Check customer existence
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
  }, []);

  // Initial load
  useEffect(() => {
    loadInitialData();
  }, [feedType]);

  // Filter products when search changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.productName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      let apiProducts: any[] | null = null;
      try {
        if (feedType === "exclusive") {
          const res = await getExclusiveOffers();
          if (res && res.success) apiProducts = res.products;
        } else if (feedType === "bestselling") {
          const res = await getBestSelling(200);
          if (res && res.success) apiProducts = res.products;
        } else if (feedType === "newproducts") {
          const res = await getNewProducts();
          if (res && res.success) apiProducts = res.products;
        } else if (feedType === "buyagain") {
          const res = await getBuyAgainProducts();
          if (res && res.success) apiProducts = res.products;
        }
      } catch (err) {
        console.warn("API fetch error for feed", feedType, err);
      }

      // If API returned (even an empty) array and success, respect it.
      if (apiProducts !== null) {
        // normalize and ensure minOrderQuantity and image when there are products
        if (apiProducts.length > 0) {
          const normalized = apiProducts.map((p: any, idx: number) => {
            const pid = Number(p.productId || p.id || idx);
            const minOrder = Number(p.minimumOrderQuantity || p.minOrderQuantity || p.min_order_quantity || p.minOrder || 1) || 1;
            const img = p.image && p.image !== "" ? p.image : getFallbackImageFor(pid || idx);
            return {
              productId: pid,
              productName: p.productName || p.name || p.title || "Product",
              productUnits: Number(p.productUnits || p.units || 1),
              unitsOfMeasurement: p.unitsOfMeasurement || p.measurement || "unit",
              price: Number(p.price || 0),
              image: img,
              minOrderQuantity: minOrder,
              description: p.description || "",
              nutritionInfo: p.nutritionInfo || "",
              otherDetails: p.otherDetails || "",
            } as Product;
          });

          fullFeedRef.current = normalized;
          setProducts(normalized.slice(0, ITEMS_PER_PAGE));
          setCurrentPage(1);
          setHasMoreData(normalized.length > ITEMS_PER_PAGE);
        } else {
          // API explicitly returned an empty array: show empty list (no mock fallback)
          fullFeedRef.current = [];
          setProducts([]);
          setCurrentPage(1);
          setHasMoreData(false);
        }
      } else {
        // fallback to mock only when API failed or didn't return data
        const initialProducts = mockData.slice(0, ITEMS_PER_PAGE);
        setProducts(initialProducts);
        setCurrentPage(1);
        setHasMoreData(mockData.length > ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
      Alert.alert("Error", "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const loadMoreData = async () => {
    if (loadingMore || !hasMoreData || searchQuery.trim() !== "") return;

    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const startIndex = (nextPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;

      const source = fullFeedRef.current && fullFeedRef.current.length > 0 ? fullFeedRef.current : mockData;
      const newProducts = source.slice(startIndex, endIndex);

      if (newProducts.length > 0) {
        setProducts(prev => [...prev, ...newProducts]);
        setCurrentPage(nextPage);
        setHasMoreData(endIndex < source.length);
      } else {
        setHasMoreData(false);
      }
    } catch (error) {
      console.error("Error loading more data:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const renderProduct = useCallback(({ item, index }: { item: Product, index: number }) => (
    <ProductCard 
      item={item} 
      isCustomerExists={isCustomerExists ?? false}
      index={index}
    />
  ), [isCustomerExists]);

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#16a34a" />
        <Text className="text-center text-gray-500 mt-2">Loading more products...</Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View className="flex-1 justify-center items-center py-20">
      <Ionicons name="search" size={64} color="#d1d5db" />
      <Text className="text-gray-500 text-lg mt-4">No products found</Text>
      <Text className="text-gray-400 text-sm mt-1">Try adjusting your search</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#16a34a" />
          <Text className="text-gray-500 mt-2">Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="mr-3"
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900 flex-1">
          All Products
        </Text>
        <TouchableOpacity>
          <Ionicons name="filter" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="px-4 py-3">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 h-12">
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            className="flex-1 ml-2 text-base text-gray-900"
            placeholder="Search products..."
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#6b7280" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Products Grid */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item, index) => `allproducts_${item.productId ?? index}`}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingHorizontal: 8,
          paddingBottom: cartCount > 0 ? 120 : 100,
          flexGrow: 1
        }}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        onEndReached={loadMoreData}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        maxToRenderPerBatch={8}
        windowSize={7}
        initialNumToRender={8}
        removeClippedSubviews={true}
      />

      {/* Results Count */}
      {filteredProducts.length > 0 && !cartCount && (
        <View className="absolute bottom-4 left-4 right-4">
          <View className="bg-black/80 rounded-full px-4 py-2 self-center">
            <Text className="text-white text-sm">
              {searchQuery ? `${filteredProducts.length} results` : `${products.length} of ${mockData.length} products`}
            </Text>
          </View>
        </View>
      )}

      {/* Floating "Go to Cart" bar */}
      {cartCount > 0 && (
        <View 
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 24,
            zIndex: 50,
          }}
        >
          <TouchableOpacity
            style={{
              backgroundColor: '#15803d',
              borderRadius: 25,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
              marginHorizontal: 16,
            }}
            activeOpacity={0.95}
            onPress={() => router.push("/cart")}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="cart-outline" size={20} color="#fff" />
              <Text style={{
                color: 'white',
                fontWeight: '600',
                fontSize: 16,
                marginLeft: 8
              }}>
                Go to Cart
              </Text>
            </View>
            <View style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              minWidth: 40,
            }}>
              <Text style={{
                color: 'white',
                fontWeight: '700',
                fontSize: 16
              }}>
                {cartCount}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default AllProductsList;
