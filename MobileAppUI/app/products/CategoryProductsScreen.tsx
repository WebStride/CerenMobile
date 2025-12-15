import React, { useEffect, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  Alert,
  SafeAreaView
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useCart } from "../context/CartContext";
import { useFavourites } from "../context/FavouritesContext";
import { getSubCategories, getProductsBySubCategory, checkCustomerExists } from "../../services/api";

// Blurhash for smooth placeholder (light gray)
const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

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

// Placeholder image URLs to use when API returns null
const placeholderImageUrls = [
  "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1502741126161-b048400d7c6f?w=400&h=400&fit=crop",
];

const getRandomImage = () => placeholderImageUrls[Math.floor(Math.random() * placeholderImageUrls.length)];

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

// FIXED: Enhanced Product Card Component with Android-compatible quantity controls
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
      
      {/* MOQ Info */}
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
          <Text className="font-semibold text-xs text-gray-500 italic">Price on request</Text>
        )}
      </View>
      
      {/* FIXED: Add to Cart Button OR Quantity Controls - Only for registered users with pricing */}
      {(isCustomerExists && item.price > 0) ? (
        showControls ? (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#15803d', // green-700
            borderRadius: 20,
            paddingHorizontal: 4,
            paddingVertical: 4,
            height: 32, // Fixed height for consistency
          }}>
            <TouchableOpacity
              onPress={handleDecrease}
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Ionicons name="remove" size={16} color="#fff" />
            </TouchableOpacity>
            
            {/* FIXED: Text Input Container - Better Android support */}
            <View style={{
              flex: 1,
              marginHorizontal: 4,
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 32, // Ensure minimum width for 2-digit numbers
              height: 24, // Fixed height
            }}>
              <TextInput
                value={qtyInput}
                onChangeText={handleInputChange}
                keyboardType="number-pad"
                maxLength={3}
                style={{
                  width: '100%',
                  height: 24, // Explicit height matching container
                  textAlign: 'center',
                  fontSize: 14, // Slightly smaller font for compact card
                  fontWeight: 'bold',
                  color: 'white',
                  backgroundColor: 'transparent',
                  borderWidth: 0,
                  padding: 0, // Remove padding to prevent text cutoff
                  margin: 0,
                  includeFontPadding: false, // Android specific - prevents text cutoff
                  textAlignVertical: 'center', // Android specific - centers text vertically
                }}
                selectionColor="#fff"
                placeholder={String(minOrder)}
                placeholderTextColor="rgba(255,255,255,0.5)"
                multiline={false}
                numberOfLines={1}
              />
            </View>
            
            <TouchableOpacity
              onPress={handleIncrease}
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Ionicons name="add" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={{
              width: '100%',
              backgroundColor: '#15803d', // green-700
              borderRadius: 20,
              paddingVertical: 6,
              paddingHorizontal: 8,
              alignItems: 'center',
              justifyContent: 'center',
              height: 32, // Same height as controls
            }}
            onPress={handleAddToCartPress}
            activeOpacity={0.8}
          >
            <Text style={{
              color: 'white',
              fontWeight: '600',
              fontSize: 12
            }}>
              Add {minOrder > 1 ? `${minOrder}` : ''} to Cart
            </Text>
          </TouchableOpacity>
        )
      ) : null}
    </View>
  );
});

// FIXED: Updated Subcategory Item Component with proper circular image display
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
    style={{
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#f3f4f6',
      backgroundColor: isSelected ? '#f0fdf4' : 'white',
      borderRightWidth: isSelected ? 3 : 0,
      borderRightColor: isSelected ? '#16a34a' : 'transparent',
    }}
    activeOpacity={0.7}
  >
    {/* FIXED: Properly Circular Image Container */}
    <View style={{
      width: 64,
      height: 64,
      borderRadius: 32, // Half of width/height for perfect circle
      backgroundColor: '#f9fafb', // Light background in case image doesn't load
      borderWidth: isSelected ? 3 : 2,
      borderColor: isSelected ? '#16a34a' : '#e5e7eb',
      marginBottom: 8,
      overflow: 'hidden', // CRITICAL: This ensures image is clipped to circle
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Image 
        source={typeof item.subcategoryImage === 'string' ? { uri: item.subcategoryImage } : (item.subcategoryImage || defaultImage)}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 32, // Match container border radius
        }}
        resizeMode="cover" // CHANGED: cover ensures image fills the circle properly
      />
    </View>
    
    {/* FIXED: Better text styling */}
    <Text 
      style={{
        fontSize: 11,
        fontWeight: '500',
        color: isSelected ? '#15803d' : '#374151',
        textAlign: 'center',
        lineHeight: 14,
        maxWidth: 80, // Prevent text from being too wide
      }}
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
  const [allProducts, setAllProducts] = useState<Product[]>([]); // for client-side pagination
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [isCustomerExists, setIsCustomerExists] = useState<boolean | null>(null);

  const ITEMS_PER_PAGE = 20;

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
      // Fetch from API
      const res = await getSubCategories(categoryId);
      if (res && res.success && Array.isArray(res.subCategories)) {
        const mapped: Subcategory[] = res.subCategories.map((s: any) => ({
          subcategoryId: s.subCategoryId,
          subcategoryName: s.subCategoryName,
          categoryId: categoryId,
          productCount: 0,
          subcategoryImage: s.subCategoryImage || getRandomImage(),
        }));
        setSubcategories(mapped);

        if (mapped.length > 0) {
          setSelectedSubcategory(mapped[0]);
          await loadProducts(mapped[0].subcategoryId, true);
        }
      } else {
        // Fallback to mock if API fails
        const mockSubcategories = generateMockSubcategories(categoryId);
        setSubcategories(mockSubcategories);
        if (mockSubcategories.length > 0) {
          setSelectedSubcategory(mockSubcategories[0]);
          loadProducts(mockSubcategories[0].subcategoryId, true);
        }
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
      setAllProducts([]);
    } else {
      setLoadingMore(true);
    }

    try {
      // Fetch products from API
      const res = await getProductsBySubCategory(subcategoryId);
      if (res && res.success && Array.isArray(res.products)) {
        // Map API product fields to local Product type
        const mapped: Product[] = res.products.map((p: any) => ({
          productId: p.productId,
          productName: p.productName,
          productUnits: p.productUnits,
          unitsOfMeasurement: p.unitsOfMeasurement,
          price: p.price,
          image: p.image || getRandomImage(),
          subcategoryId: subcategoryId,
          minOrderQuantity: p.minimumOrderQuantity ?? p.minOrderQuantity ?? 1,
          description: p.description || '',
        }));

        // Client-side pagination: store all and slice
        setAllProducts(mapped);
        const startIndex = 0;
        const firstPage = mapped.slice(startIndex, ITEMS_PER_PAGE);
        setProducts(firstPage);
        setCurrentPage(2);
        setHasMoreData(mapped.length > firstPage.length);
      } else {
        // Fallback to mock data
        await new Promise(resolve => setTimeout(resolve, 600));
        const totalProducts = Math.floor(Math.random() * 100) + 50;
        const startIndex = isInitial ? 0 : (currentPage - 1) * ITEMS_PER_PAGE;
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

        setHasMoreData((startIndex + newProducts.length) < totalProducts);
      }
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

    // If we have allProducts (fetched from API), perform client-side pagination
    if (allProducts && allProducts.length > 0) {
      setLoadingMore(true);
      try {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const nextSlice = allProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
        if (nextSlice.length > 0) {
          setProducts(prev => [...prev, ...nextSlice]);
          setCurrentPage(prev => prev + 1);
          setHasMoreData((startIndex + nextSlice.length) < allProducts.length);
        }
      } finally {
        setLoadingMore(false);
      }
      return;
    }

    // Fallback to server/mock pagination
    loadProducts(selectedSubcategory.subcategoryId, false);
  }, [loadingMore, hasMoreData, selectedSubcategory, searchQuery]);

  const renderProduct = useCallback(({ item, index }: { item: Product, index: number }) => (
    <ProductCard 
      item={item} 
      isCustomerExists={isCustomerExists || false}
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
        {/* FIXED: Left Side - Subcategories with better styling */}
        <View style={{
          width: 100, // Slightly wider to accommodate circular images better
          backgroundColor: '#f9fafb',
          borderRightWidth: 1,
          borderRightColor: '#e5e7eb'
        }}>
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
              keyExtractor={(item) => `category_${item.productId}`}
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

      {/* FIXED: Floating "Go to Cart" bar - Positioned lower */}
      {cartCount > 0 && (
        <View 
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 24, // CHANGED: From bottom-36 to bottom: 24 - Much lower position
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
              paddingHorizontal: 20,
              paddingVertical: 16, // Good padding
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
              marginHorizontal: 16, // Additional margin from screen edges
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

export default CategoryProductsScreen;
