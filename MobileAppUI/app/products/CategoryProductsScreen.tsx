import React, { useEffect, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  Image, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  Alert,
  SafeAreaView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useCart } from "../context/CartContext";
import { useFavourites } from "../context/FavouritesContext";

// Types
interface Product {
  productId: number;
  productName: string;
  productUnits: number;
  unitsOfMeasurement: string;
  price: number;
  image: string | null;
  subcategoryId: number;
  minOrderQuantity: number; // Made required
  description?: string;
  nutritionInfo?: string;
  otherDetails?: string;
}

interface Subcategory {
  subcategoryId: number;
  subcategoryName: string;
  categoryId: number;
  productCount: number;
  subcategoryImage?: string | null;
}

interface Category {
  categoryId: number;
  categoryName: string;
}

const defaultImage = require("../../assets/images/Banana.png");

// Mock data generators
const generateMockSubcategories = (categoryId: number): Subcategory[] => {
  const subcategoryNames = [
    "Fresh Fruits", "Seasonal Fruits", "Exotic Fruits", "Citrus Fruits", "Berries",
    "Tropical Fruits", "Stone Fruits", "Dried Fruits", "Organic Fruits", "Local Fruits",
    "Imported Fruits", "Fruit Juices", "Frozen Fruits", "Canned Fruits", "Fruit Salads",
    "Baby Fruits", "Premium Fruits", "Bulk Fruits", "Gift Packs", "Fruit Combos",
    "Green Vegetables", "Root Vegetables", "Leafy Greens", "Herbs", "Mushrooms",
    "Onions & Garlic", "Tomatoes", "Potatoes", "Peppers", "Squash & Gourds"
  ];
  
  return Array.from({ length: 25 }, (_, index) => ({
    subcategoryId: index + 1,
    subcategoryName: subcategoryNames[index % subcategoryNames.length],
    categoryId: categoryId,
    productCount: Math.floor(Math.random() * 50) + 5,
    subcategoryImage: defaultImage
  }));
};

// Enhanced product generation with MOQ and full product details
const generateMockProducts = (subcategoryId: number, count: number, startIndex: number = 0): Product[] => {
  const productNames = [
    "Fresh Bananas", "Organic Apples", "Red Strawberries", "Sweet Oranges", "Green Grapes",
    "Ripe Mangoes", "Fresh Pineapple", "Juicy Watermelon", "Sweet Peaches", "Fresh Kiwi",
    "Dragon Fruit", "Passion Fruit", "Star Fruit", "Lychee", "Rambutan",
    "Fresh Blueberries", "Blackberries", "Raspberries", "Cranberries", "Goji Berries",
    "Avocados", "Pomegranates", "Fresh Coconut", "Papaya", "Guava",
    "Fresh Lemons", "Limes", "Grapefruit", "Tangerines", "Blood Oranges"
  ];
  
  const units = [250, 500, 1000, 1500, 2000];
  const measurements = ["g", "kg", "pieces", "bunch", "pack"];
  
  // Sample image URLs
  const imageUrls = [
    "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=300&h=300&fit=crop"
  ];

  // Smart MOQ assignment based on product type
  const getMinOrderQuantity = (productName: string, measurement: string): number => {
    if (measurement === "kg") return Math.floor(Math.random() * 2) + 1; // 1-2
    else if (measurement === "g") return Math.floor(Math.random() * 3) + 2; // 2-4
    else if (measurement === "pieces") return Math.floor(Math.random() * 5) + 3; // 3-7
    else return Math.floor(Math.random() * 2) + 1; // 1-2
  };
  
  return Array.from({ length: count }, (_, index) => {
    const productName = productNames[(startIndex + index) % productNames.length];
    const measurement = measurements[Math.floor(Math.random() * measurements.length)];
    const minOrderQty = getMinOrderQuantity(productName, measurement);
    
    return {
      productId: (subcategoryId * 10000) + startIndex + index + 1,
      productName,
      productUnits: units[Math.floor(Math.random() * units.length)],
      unitsOfMeasurement: measurement,
      price: Math.floor(Math.random() * 300) + 20,
      image: imageUrls[(startIndex + index) % imageUrls.length],
      subcategoryId: subcategoryId,
      minOrderQuantity: minOrderQty,
      description: `Fresh and natural ${productName} sourced directly from farms. Rich in nutrients and perfect for daily consumption.`,
      nutritionInfo: "100gm",
      otherDetails: "Store in a cool, dry place. Best consumed within 3-5 days."
    };
  });
};

// Enhanced Product Card Component with all features
const ProductCard = React.memo(({ 
  item, 
  isCustomerExists,
  index 
}: { 
  item: Product, 
  isCustomerExists: boolean,
  index: number 
}) => {
  const { cart, addToCart, increase, decrease, removeFromCart } = useCart();
  const { addToFavourites, removeFromFavourites, isFavourite } = useFavourites();
  const router = useRouter();
  
  const cartItem = cart.find(x => x.productId === item.productId);
  const isProductFavourite = isFavourite(item.productId);
  const minOrder = item.minOrderQuantity;
  
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
      addToFavourites(item);
    }
  }, [isProductFavourite, item, addToFavourites, removeFromFavourites]);

  // Enhanced Add to Cart with MOQ validation
  const handleAddToCartPress = useCallback(() => {
    const qty = Math.max(Number(qtyInput), minOrder);
    
    if (qty > Number(qtyInput)) {
      Alert.alert(
        "Minimum Order Quantity", 
        `Minimum order for ${item.productName} is ${minOrder}. Adding ${qty} to cart.`,
        [{ text: "OK" }]
      );
    }
    
    for (let i = 0; i < qty; i++) {
      addToCart({
        productId: item.productId,
        productName: item.productName,
        price: item.price,
        image: item.image,
        productUnits: item.productUnits,
        unitsOfMeasurement: item.unitsOfMeasurement,
      });
    }
    setShowControls(true);
  }, [item, addToCart, qtyInput, minOrder]);

  // Enhanced input validation with MOQ
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
          image: item.image,
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

  // Enhanced decrease with MOQ validation
  const handleDecrease = useCallback(() => {
    if (cartItem && cartItem.quantity > minOrder) {
      decrease(item.productId);
    } else if (cartItem && cartItem.quantity === minOrder) {
      removeFromCart(item.productId);
    } else {
      Alert.alert(
        "Minimum Order Quantity", 
        `Cannot decrease below minimum order quantity of ${minOrder}`
      );
    }
  }, [cartItem, decrease, removeFromCart, item.productId, minOrder]);

  const handleIncrease = useCallback(() => {
    increase(item.productId);
  }, [increase, item.productId]);

  // Handle image source properly
  const getImageSource = () => {
    if (item.image && typeof item.image === 'string' && item.image.startsWith('http')) {
      return { uri: item.image };
    }
    return defaultImage;
  };

  return (
    <View className="bg-white rounded-xl p-3 m-2 border border-gray-100 min-w-0 flex-1">
      {/* Clickable Product Image Area */}
      <TouchableOpacity
        onPress={handleProductPress}
        className="items-center mb-2 relative"
        activeOpacity={0.7}
      >
        <Image 
          source={getImageSource()} 
          className="w-20 h-20 mb-2" 
          resizeMode="contain" 
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
      
      {/* MOQ Info */}
      {minOrder > 1 && (
        <Text className="text-red-500 text-xs mb-1 font-medium">
          Min: {minOrder}
        </Text>
      )}
      
      {/* Price */}
      <View className="w-full mb-2">
        <Text className="font-bold text-sm text-gray-900">₹{item.price}.00</Text>
      </View>
      
      {/* Add to Cart Button OR Quantity Controls */}
      {isCustomerExists ? (
        showControls ? (
          <View className="flex-row items-center justify-center rounded-full bg-green-700 px-1 py-1">
            <TouchableOpacity
              onPress={handleDecrease}
              className="w-7 h-7 rounded-full items-center justify-center"
            >
              <Ionicons name="remove" size={18} color="#fff" />
            </TouchableOpacity>
            <View className="flex-1 mx-1 items-center justify-center">
              <TextInput
                className="w-full h-7 text-center text-white font-bold"
                value={qtyInput}
                onChangeText={handleInputChange}
                keyboardType="number-pad"
                maxLength={3}
                style={{
                  borderWidth: 0,
                  backgroundColor: "transparent",
                  fontSize: 14,
                  color: "white",
                  fontWeight: "bold",
                  textAlign: "center",
                  minWidth: 30,
                }}
                selectionColor="#fff"
                placeholder={String(minOrder)}
                placeholderTextColor="rgba(255,255,255,0.5)"
                textAlign="center"
              />
            </View>
            <TouchableOpacity
              onPress={handleIncrease}
              className="w-7 h-7 rounded-full items-center justify-center"
            >
              <Ionicons name="add" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
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
      ) : (
        <View className="w-full bg-gray-300 rounded-full py-1.5 px-2 items-center justify-center">
          <Text className="text-gray-600 font-semibold text-xs">Verification Required</Text>
        </View>
      )}
    </View>
  );
});

// Updated Subcategory Item Component - Compact image-only design
const SubcategoryItem = ({ 
  item, 
  isSelected, 
  onPress 
}: { 
  item: Subcategory, 
  isSelected: boolean, 
  onPress: () => void 
}) => (
  <TouchableOpacity
    onPress={onPress}
    className={`items-center py-4 px-2 border-b border-gray-100 ${isSelected ? 'bg-green-50 border-r-2 border-r-green-600' : 'bg-white'}`}
    activeOpacity={0.7}
  >
    {/* Circular Image */}
    <View className={`w-20 h-20 rounded-full p-3 overflow-hidden mb-2 ${isSelected ? 'border-2 border-green-500' : 'border border-gray-200'}`}>
      <Image 
        source={item.subcategoryImage || defaultImage} 
        className="w-full h-full" 
        resizeMode="cover" 
      />
    </View>
    
    {/* Compact Text */}
    <Text 
      className={`text-xs font-medium text-center leading-tight ${isSelected ? 'text-green-700' : 'text-gray-700'}`}
      numberOfLines={2}
      ellipsizeMode="tail"
    >
      {item.subcategoryName}
    </Text>
  </TouchableOpacity>
);

const CategoryProductsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { cartCount } = useCart();
  
  // Get category info from params or use defaults
  const categoryId = parseInt(params.categoryId as string) || 1;
  const categoryName = params.categoryName as string || "Fresh Fruits";
  
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [isCustomerExists, setIsCustomerExists] = useState(true);

  const ITEMS_PER_PAGE = 20;

  // Load subcategories on mount
  useEffect(() => {
    loadSubcategories();
  }, [categoryId]);

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

  const loadSubcategories = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockSubcategories = generateMockSubcategories(categoryId);
      setSubcategories(mockSubcategories);
      
      // Auto-select first subcategory
      if (mockSubcategories.length > 0) {
        setSelectedSubcategory(mockSubcategories[0]);
        loadProducts(mockSubcategories[0].subcategoryId, true);
      }
    } catch (error) {
      console.error("Error loading subcategories:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (subcategoryId: number, isInitial = false) => {
    if (isInitial) {
      setLoadingProducts(true);
      setProducts([]);
      setCurrentPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const totalProducts = Math.floor(Math.random() * 100) + 50;
      const startIndex = isInitial ? 0 : (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      
      const newProducts = generateMockProducts(
        subcategoryId, 
        Math.min(ITEMS_PER_PAGE, totalProducts - startIndex),
        startIndex
      );

      if (isInitial) {
        setProducts(newProducts);
        setCurrentPage(2);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
        setCurrentPage(prev => prev + 1);
      }

      setHasMoreData(endIndex < totalProducts);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoadingProducts(false);
      setLoadingMore(false);
    }
  };

  const handleSubcategoryPress = useCallback((subcategory: Subcategory) => {
    setSelectedSubcategory(subcategory);
    setSearchQuery("");
    loadProducts(subcategory.subcategoryId, true);
  }, []);

  const loadMoreProducts = useCallback(() => {
    if (loadingMore || !hasMoreData || !selectedSubcategory || searchQuery.trim() !== "") return;
    loadProducts(selectedSubcategory.subcategoryId, false);
  }, [loadingMore, hasMoreData, selectedSubcategory, searchQuery]);

  const renderProduct = useCallback(({ item, index }: { item: Product, index: number }) => (
    <ProductCard 
      item={item} 
      isCustomerExists={isCustomerExists}
      index={index}
    />
  ), [isCustomerExists]);

  const renderSubcategory = useCallback(({ item }: { item: Subcategory }) => (
    <SubcategoryItem
      item={item}
      isSelected={selectedSubcategory?.subcategoryId === item.subcategoryId}
      onPress={() => handleSubcategoryPress(item)}
    />
  ), [selectedSubcategory, handleSubcategoryPress]);

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
      <Ionicons name="cube-outline" size={64} color="#d1d5db" />
      <Text className="text-gray-500 text-lg mt-4">No products found</Text>
      <Text className="text-gray-400 text-sm mt-1">Try selecting a different subcategory</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#16a34a" />
          <Text className="text-gray-500 mt-2">Loading categories...</Text>
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
        <Text className="text-3xl font-bold text-gray-900 flex-1 text-center">
          {categoryName}
        </Text>
        <TouchableOpacity>
          <Ionicons name="filter" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 flex-row">
        {/* Left Side - Subcategories */}
        <View className="w-34 bg-gray-50 border-r border-gray-200">
          <FlatList
            data={subcategories}
            renderItem={renderSubcategory}
            keyExtractor={(item) => `subcategory_${item.subcategoryId}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>

        {/* Right Side - Products */}
        <View className="flex-1">
          {/* Subcategory Header and Search */}
          <View className="bg-white border-b border-gray-200">
            <Text className="text-2xl font-bold text-gray-700 px-4 py-3 text-center">
              {selectedSubcategory?.subcategoryName || "Select Category"}
            </Text>
            
            {/* Search Bar */}
            <View className="px-4 pb-3">
              <View className="flex-row items-center bg-gray-100 rounded-lg px-3 h-10">
                <Ionicons name="search" size={16} color="#6b7280" />
                <TextInput
                  className="flex-1 ml-2 text-sm text-gray-900"
                  placeholder="Search products..."
                  placeholderTextColor="#6b7280"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons name="close-circle" size={16} color="#6b7280" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>

          {/* Products Grid */}
          {loadingProducts ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#16a34a" />
              <Text className="text-gray-500 mt-2">Loading products...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              renderItem={renderProduct}
              keyExtractor={(item, index) => `category_${item.productId}_${item.subcategoryId}_${index}_${Math.random()}`}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ 
                paddingHorizontal: 8,
                paddingBottom: cartCount > 0 ? 120 : 20,
                flexGrow: 1
              }}
              columnWrapperStyle={{ justifyContent: 'space-between' }}
              onEndReached={loadMoreProducts}
              onEndReachedThreshold={0.1}
              ListFooterComponent={renderFooter}
              ListEmptyComponent={renderEmpty}
              maxToRenderPerBatch={10}
              windowSize={10}
              initialNumToRender={20}
              removeClippedSubviews={true}
            />
          )}
        </View>
      </View>

      {/* Results Count */}
      {filteredProducts.length > 0 && !cartCount && (
        <View className="absolute bottom-4 right-4">
          <View className="bg-black/80 rounded-full px-3 py-1">
            <Text className="text-white text-xs">
              {searchQuery ? `${filteredProducts.length} results` : `${products.length} products`}
            </Text>
          </View>
        </View>
      )}

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
    </SafeAreaView>
  );
};

export default CategoryProductsScreen;
