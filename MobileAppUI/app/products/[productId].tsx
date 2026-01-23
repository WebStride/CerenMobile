import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  Dimensions,
  FlatList
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useCart } from "../context/CartContext";
import { useFavourites } from "../context/FavouritesContext";
import { getProductsByCatalog, getSimilarProductsApi, checkCustomerExists } from "@/services/api";

const { width } = Dimensions.get('window');
const defaultImage = require("../../assets/images/Banana.png");

// Blurhash for smooth placeholder (light gray)
const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

interface ProductDetailsProps {
  productId: number;
  productName: string;
  productUnits: number;
  unitsOfMeasurement: string;
  price: number;
  image: string | null;
  description?: string;
  minOrderQuantity: number;
  nutritionInfo?: string;
  otherDetails?: string;
}

interface Product {
  productId: number;
  productName: string;
  productUnits: number;
  unitsOfMeasurement: string;
  price: number;
  image: string | null;
  minOrderQuantity?: number;
}

interface ProductVariant {
  variantId: string;
  units: number;
  unitsOfMeasurement: string;
  price: number;
  originalPrice?: number;
  image?: string | null;
  minOrderQuantity: number;
  description?: string;
  isAvailable: boolean;
}

// ---------- Fixed ProductCard with proper MOQ handling ----------
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
  const { cart, addToCart, increaseQuantity, decreaseQuantity, removeFromCart } = useCart();
  const { addToFavourites, removeFromFavourites, isFavourite } = useFavourites();
  const router = useRouter();
  
  const uniqueInstanceId = `${sectionKey}_${item.productId}_${index}`;
  const cartItem = cart.find(x => x.productId === item.productId);
  const isProductFavourite = isFavourite(item.productId);
  const minOrder = item.minOrderQuantity || 1;
  
  const [showControls, setShowControls] = useState(!!cartItem);
  const [qtyInput, setQtyInput] = useState(cartItem ? String(cartItem.quantity) : String(minOrder));
  const [tempInput, setTempInput] = useState(cartItem ? String(cartItem.quantity) : String(minOrder));

  useEffect(() => {
    if (cartItem) {
      setQtyInput(String(cartItem.quantity));
      setTempInput(String(cartItem.quantity));
      if (!showControls) {
        setShowControls(true);
      }
    } else {
      setShowControls(false);
      setQtyInput(String(minOrder));
      setTempInput(String(minOrder));
    }
  }, [cartItem, showControls, minOrder]);

  const getImageSource = (imageUrl: string | null) => {
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
      return { uri: imageUrl };
    }
    return defaultImage;
  };

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
        description: `Fresh and natural ${item.productName} sourced directly from farms. Rich in nutrients and perfect for daily consumption.`,
        nutritionInfo: "100gm",
        otherDetails: "Store in a cool, dry place. Best consumed within 3-5 days."
      },
    });
  }, [item, minOrder, router]);

  const handleFavouriteToggle = useCallback((event: any) => {
    event.stopPropagation();
    if (isProductFavourite) {
      removeFromFavourites(item.productId);
    } else {
      addToFavourites({...item, minQuantity: minOrder});
    }
  }, [isProductFavourite, item, minOrder, addToFavourites, removeFromFavourites]);

  const handleAddToCartPress = useCallback(() => {
    const qty = Math.max(Number(qtyInput), minOrder);
    if (qty !== Number(qtyInput)) {
      Alert.alert(
        "Minimum Order Quantity",
        `Minimum order for ${item.productName} is ${minOrder}. Adding ${qty} to cart.`
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

  const handleInputChange = useCallback((val: string) => {
    const onlyDigits = val.replace(/[^0-9]/g, "");
    setTempInput(onlyDigits);
  }, []);

  const handleBlur = useCallback(() => {
    const onlyDigits = tempInput.replace(/[^0-9]/g, "");

    if (onlyDigits === "" || Number(onlyDigits) < minOrder) {
      const snapQty = minOrder;
      setTempInput(String(snapQty));
      setQtyInput(String(snapQty));
      
      if (cartItem) {
        const diff = snapQty - cartItem.quantity;
        if (diff > 0) {
          for (let i = 0; i < diff; i++) increaseQuantity(item.productId);
        } else if (diff < 0) {
          for (let i = 0; i < Math.abs(diff); i++) decreaseQuantity(item.productId);
        }
      } else {
        for (let i = 0; i < snapQty; i++) {
          addToCart({
            productId: item.productId,
            productName: item.productName,
            price: item.price,
            image: item.image,
            productUnits: item.productUnits,
            unitsOfMeasurement: item.unitsOfMeasurement,
          });
        }
      }
      return;
    }

    const numVal = Number(onlyDigits);
    setQtyInput(String(numVal));
    
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
        for (let i = 0; i < diff; i++) increaseQuantity(item.productId);
      } else if (diff < 0) {
        for (let i = 0; i < Math.abs(diff); i++) decreaseQuantity(item.productId);
      }
    }
  }, [tempInput, item, cartItem, addToCart, increaseQuantity, decreaseQuantity, minOrder]);

  const handleDecrease = useCallback(() => {
    if (cartItem && cartItem.quantity > minOrder) {
      decreaseQuantity(item.productId);
    } else if (cartItem && cartItem.quantity === minOrder) {
      removeFromCart(item.productId);
    } else {
      Alert.alert(
        "Minimum Order Quantity",
        `Cannot decrease below minimum order quantity of ${minOrder}`
      );
    }
  }, [cartItem, decreaseQuantity, removeFromCart, item.productId, minOrder]);

  const handleIncrease = useCallback(() => {
    increaseQuantity(item.productId);
  }, [increaseQuantity, item.productId]);

  return (
    <View 
      key={uniqueInstanceId}
      className="bg-white rounded-xl p-3 mr-4 w-36 border border-gray-100"
    >
      <TouchableOpacity
        onPress={handleProductPress}
        className="flex-1 items-center mb-2 relative"
        activeOpacity={0.7}
      >
        <Image
          source={getImageSource(item.image)}
          placeholder={blurhash}
          contentFit="contain"
          transition={200}
          cachePolicy="memory-disk"
          style={{ width: 112, height: 112, marginBottom: 8, backgroundColor: '#f3f4f6' }}
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
        <Text className="text-red-500 text-xs mb-1 font-medium">
          Min: {minOrder}
        </Text>
      )}
      
      <View className="w-full mb-2">
        {isCustomerExists && item.price > 0 ? (
          <Text className="font-bold text-base text-gray-900">₹{item.price}.00</Text>
        ) : (
          <Text className="text-gray-500 text-sm italic">Price on request</Text>
        )}
      </View>
      
      {isCustomerExists && item.price > 0 && (
        <>
          {showControls ? (
          // FIXED: Better Android compatibility for quantity controls
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#15803d',
            borderRadius: 25,
            paddingHorizontal: 4,
            paddingVertical: 6,
            height: 40,
          }}>
            <TouchableOpacity
              onPress={handleDecrease}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Ionicons name="remove" size={20} color="#fff" />
            </TouchableOpacity>
            
            <View style={{
              flex: 1,
              marginHorizontal: 4,
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 48,
              height: 32,
            }}>
              <TextInput
                value={tempInput}
                onChangeText={handleInputChange}
                onBlur={handleBlur}
                keyboardType="number-pad"
                maxLength={3}
                style={{
                  width: '100%',
                  height: 32,
                  textAlign: 'center',
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: 'white',
                  backgroundColor: 'transparent',
                  borderWidth: 0,
                  padding: 0,
                  margin: 0,
                  includeFontPadding: false,
                  textAlignVertical: 'center',
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
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={{
              width: '100%',
              backgroundColor: '#15803d',
              borderRadius: 25,
              paddingVertical: 10,
              paddingHorizontal: 12,
              alignItems: 'center',
              justifyContent: 'center',
              height: 40,
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
        )}
        </>
      )}
    </View>
  );
});

export default function ProductDetailsScreen() {
  const router = useRouter();
  const rawParams = useLocalSearchParams();
  const { cart, addToCart, increaseQuantity, decreaseQuantity, removeFromCart } = useCart();
  const { addToFavourites, removeFromFavourites, isFavourite } = useFavourites();
  
  // Memoize params to prevent infinite loop
  const stableParams = useMemo(() => {
    return {
      productId: rawParams.productId as string || '0',
      productName: rawParams.productName as string || '',
      productUnits: rawParams.productUnits as string || '0',
      unitsOfMeasurement: rawParams.unitsOfMeasurement as string || '',
      price: rawParams.price as string || '0',
      image: rawParams.image as string || '',
      description: rawParams.description as string || '',
      minOrderQuantity: rawParams.minOrderQuantity as string || '1',
      nutritionInfo: rawParams.nutritionInfo as string || '',
      otherDetails: rawParams.otherDetails as string || ''
    };
  }, [
    rawParams.productId,
    rawParams.productName,
    rawParams.productUnits,
    rawParams.unitsOfMeasurement,
    rawParams.price,
    rawParams.image,
    rawParams.description,
    rawParams.minOrderQuantity,
    rawParams.nutritionInfo,
    rawParams.otherDetails
  ]);

  const baseProduct: ProductDetailsProps = useMemo(() => ({
    productId: parseInt(stableParams.productId),
    productName: stableParams.productName,
    productUnits: parseInt(stableParams.productUnits),
    unitsOfMeasurement: stableParams.unitsOfMeasurement,
    price: parseFloat(stableParams.price),
    image: stableParams.image,
    description: stableParams.description || "Fresh and natural product sourced directly from farms. Rich in nutrients and perfect for daily consumption.",
    minOrderQuantity: parseInt(stableParams.minOrderQuantity) || 1,
    nutritionInfo: stableParams.nutritionInfo || "100gm",
    otherDetails: stableParams.otherDetails || "Store in a cool, dry place. Best consumed within 3-5 days."
  }), [stableParams]);

  // Product variants with proper MOQ - will be replaced from API when available
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([
    {
      variantId: 'default',
      units: baseProduct.productUnits,
      unitsOfMeasurement: baseProduct.unitsOfMeasurement,
      price: baseProduct.price,
      originalPrice: undefined,
      image: baseProduct.image || undefined,
      minOrderQuantity: baseProduct.minOrderQuantity,
      description: baseProduct.description,
      isAvailable: true
    }
  ]);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(productVariants[0]);
  
  const currentProduct = useMemo<ProductDetailsProps>(() => ({
    ...baseProduct,
    productUnits: selectedVariant.units,
    unitsOfMeasurement: selectedVariant.unitsOfMeasurement,
    price: selectedVariant.price,
    image: selectedVariant.image || baseProduct.image,
    minOrderQuantity: selectedVariant.minOrderQuantity,
    description: selectedVariant.description || baseProduct.description
  }), [baseProduct, selectedVariant]);

  const [quantity, setQuantity] = useState<number>(selectedVariant.minOrderQuantity);
  const [tempQuantity, setTempQuantity] = useState<string>(String(selectedVariant.minOrderQuantity));
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [isCustomerExists, setIsCustomerExists] = useState<boolean | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const isProductFavourite = isFavourite(currentProduct.productId);
  
  // Get cart item for current product to sync quantity
  const cartItem = useMemo(() => {
    return cart.find(item => item.productId === currentProduct.productId);
  }, [cart, currentProduct.productId]);

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

  // Update quantity when variant changes or cart changes
  useEffect(() => {
    if (cartItem) {
      // Sync with cart quantity
      setQuantity(cartItem.quantity);
      setTempQuantity(String(cartItem.quantity));
    } else {
      // Reset to minimum when not in cart
      setQuantity(selectedVariant.minOrderQuantity);
      setTempQuantity(String(selectedVariant.minOrderQuantity));
    }
  }, [selectedVariant.minOrderQuantity, cartItem]);

  const handleVariantSelect = useCallback((variant: ProductVariant) => {
    if (variant.isAvailable) {
      setSelectedVariant(variant);
    }
  }, []);

  // Load catalog variants and similar products from API on mount
  useEffect(() => {
    let mounted = true;

    const loadCatalogAndSimilar = async () => {
      try {
        const pid = baseProduct.productId;

        const catRes = await getProductsByCatalog(pid);
        if (mounted && catRes && catRes.success) {
          // Map catalog products into variants
          const variants: ProductVariant[] = (catRes.products || []).map((p: any) => ({
            variantId: String(p.productId),
            units: p.productUnits || 1,
            unitsOfMeasurement: p.unitsOfMeasurement || '',
            price: Number(p.price) || 0,
            originalPrice: undefined,
            image: p.image || undefined,
            minOrderQuantity: p.minimumOrderQuantity || p.minOrderQuantity || 1,
            description: p.productName || '',
            isAvailable: true
          }));

          if (variants.length > 0) {
            setProductVariants(variants);
            // choose a variant that matches base product units, or first one
            const match = variants.find(v => v.units === baseProduct.productUnits) || variants[0];
            setSelectedVariant(match);
          }
        }

        const simRes = await getSimilarProductsApi(pid);
        if (mounted && simRes && simRes.success) {
          // Normalize similar products fields to match Product interface
          const normalized = (simRes.products || []).map((p: any) => ({
            productId: Number(p.ProductID ?? p.productId ?? p.id ?? 0),
            productName: p.ProductName ?? p.productName ?? p.DisplayName ?? '',
            productUnits: Number(p.ProductUnits ?? p.productUnits ?? p.productUnit ?? 1),
            unitsOfMeasurement: p.UnitsOfMeasurement ?? p.unitsOfMeasurement ?? p.uom ?? '',
            price: Number(p.Price ?? p.price ?? 0),
            image: p.Image ?? p.image ?? p.ProductImage ?? null,
            minOrderQuantity: Number(p.MinimumOrderQuantity ?? p.minimumOrderQuantity ?? p.minOrderQuantity ?? p.MinQuantity ?? 1)
          } as Product));

          setSimilarProducts(normalized);
        }
      } catch (err) {
        console.error('Error loading catalog/similar:', err);
      }
    };

    loadCatalogAndSimilar();

    return () => { mounted = false; };
  }, [baseProduct.productId]);

  const getImageSource = useCallback((imageUrl: string | null) => {
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
      return { uri: imageUrl };
    }
    return defaultImage;
  }, []);

  const productImages = useMemo(() => [
    currentProduct.image || '',
    currentProduct.image || '',
    currentProduct.image || '',
  ], [currentProduct.image]);

  const handleFavouriteToggle = useCallback(() => {
    if (isProductFavourite) {
      removeFromFavourites(currentProduct.productId);
    } else {
      addToFavourites({...currentProduct, minQuantity: currentProduct.minOrderQuantity});
    }
  }, [isProductFavourite, currentProduct, addToFavourites, removeFromFavourites]);

  // FIXED: Proper MOQ validation with smooth editing using tempInput
  const handleTextInputChange = useCallback((text: string) => {
    const onlyDigits = text.replace(/[^0-9]/g, "");
    setTempQuantity(onlyDigits);
  }, []);

  const handleTextInputBlur = useCallback(() => {
    const onlyDigits = tempQuantity.replace(/[^0-9]/g, "");
    
    if (onlyDigits === "" || Number(onlyDigits) < currentProduct.minOrderQuantity) {
      const snapQty = currentProduct.minOrderQuantity;
      setTempQuantity(String(snapQty));
      setQuantity(snapQty);
      return;
    }
    
    const numValue = Number(onlyDigits);
    setQuantity(numValue);
  }, [tempQuantity, currentProduct.minOrderQuantity]);

  const handleDecrease = useCallback(() => {
    const newQuantity = quantity - 1;
    
    if (newQuantity < currentProduct.minOrderQuantity) {
      Alert.alert(
        "Minimum Quantity Reached", 
        `Cannot decrease below minimum order quantity of ${currentProduct.minOrderQuantity}`
      );
      return;
    }
    
    setQuantity(newQuantity);
    setTempQuantity(String(newQuantity));
  }, [quantity, currentProduct.minOrderQuantity]);

  const handleIncrease = useCallback(() => {
    const newQuantity = quantity + 1;
    setQuantity(newQuantity);
    setTempQuantity(String(newQuantity));
  }, [quantity]);

  const handleAddToBasket = useCallback(() => {
    if (quantity < currentProduct.minOrderQuantity) {
      Alert.alert("Error", `Minimum order quantity is ${currentProduct.minOrderQuantity}`);
      setQuantity(currentProduct.minOrderQuantity);
      setTempQuantity(String(currentProduct.minOrderQuantity));
      return;
    }

    if (cartItem) {
      // Update existing cart item
      const diff = quantity - cartItem.quantity;
      if (diff > 0) {
        for (let i = 0; i < diff; i++) {
          increaseQuantity(currentProduct.productId);
        }
      } else if (diff < 0) {
        for (let i = 0; i < Math.abs(diff); i++) {
          decreaseQuantity(currentProduct.productId);
        }
      }
      Alert.alert("Success", `Cart updated! ${quantity} items in cart.`);
    } else {
      // Add new items to cart
      for (let i = 0; i < quantity; i++) {
        addToCart({
          productId: currentProduct.productId,
          productName: `${currentProduct.productName} (${currentProduct.productUnits}${currentProduct.unitsOfMeasurement})`,
          price: currentProduct.price,
          image: currentProduct.image,
          productUnits: currentProduct.productUnits,
          unitsOfMeasurement: currentProduct.unitsOfMeasurement,
        });
      }
      Alert.alert("Success", `${quantity} ${currentProduct.productName} added to cart!`);
    }
  }, [quantity, currentProduct, addToCart, increaseQuantity, decreaseQuantity, cartItem]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  }, [expandedSection]);

  const renderImageItem = useCallback(({ item, index }: { item: string, index: number }) => (
    <View style={{ width, height: 300, justifyContent: 'center', alignItems: 'center' }}>
      <Image
        source={getImageSource(item)}
        placeholder={blurhash}
        contentFit="contain"
        transition={200}
        cachePolicy="memory-disk"
        style={{ width: '80%', height: '80%', backgroundColor: '#f3f4f6' }}
      />
    </View>
  ), [getImageSource]);

  const renderSimilarProduct = useCallback(({ item, index }: { item: Product, index: number }) => (
    <ProductCard
      item={item}
      isCustomerExists={isCustomerExists ?? false}
      sectionKey="similar_products"
      index={index}
    />
  ), [isCustomerExists]);

  const isDecreaseDisabled = quantity <= currentProduct.minOrderQuantity;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Product Images Carousel */}
        <View className="relative">
          <FlatList
            ref={flatListRef}
            data={productImages}
            renderItem={renderImageItem}
            keyExtractor={(item, index) => `${selectedVariant.variantId}_${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(index);
            }}
          />
          
          <View className="flex-row justify-center mt-4 mb-2">
            {productImages.map((_, index) => (
              <View
                key={index}
                className={`w-2 h-2 rounded-full mx-1 ${
                  index === currentImageIndex ? 'bg-green-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </View>

          <TouchableOpacity
            onPress={handleFavouriteToggle}
            className="absolute top-4 right-4 bg-white/80 rounded-full p-2 shadow-sm"
          >
            <Ionicons
              name={isProductFavourite ? "heart" : "heart-outline"}
              size={24}
              color={isProductFavourite ? "#EF4444" : "#9CA3AF"}
            />
          </TouchableOpacity>
        </View>

        {/* FIXED: Product Info Section with proper spacing */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          {/* Product Title and Price - Fixed spacing */}
          <View style={{ marginBottom: 24, zIndex: 1 }}>
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: 8,
              lineHeight: 32
            }}>
              {currentProduct.productName}
            </Text>
            <Text style={{
              fontSize: 16,
              color: '#6B7280',
              marginBottom: 16
            }}>
              {currentProduct.productUnits}{currentProduct.unitsOfMeasurement}, Price
            </Text>
          </View>

          {/* Select Unit Section - Fixed positioning */}
          <View style={{ 
            marginBottom: 32,
            backgroundColor: 'white',
            zIndex: 2,
            position: 'relative'
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: 16
            }}>
              Select Unit
            </Text>
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between',
              gap: 8
            }}>
              {productVariants.map((variant) => {
                const isSelected = selectedVariant.variantId === variant.variantId;
                return (
                  <TouchableOpacity
                    key={variant.variantId}
                    onPress={() => handleVariantSelect(variant)}
                    style={{
                      flex: 1,
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 2,
                      borderColor: isSelected ? '#16a34a' : '#bbf7d0',
                      backgroundColor: isSelected ? '#dcfce7' : '#f0fdf4',
                      opacity: variant.isAvailable ? 1 : 0.5,
                      minHeight: 100, // Fixed minimum height
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                    disabled={!variant.isAvailable}
                    activeOpacity={0.7}
                  >
                    <Text style={{
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: 18,
                      color: isSelected ? '#14532d' : '#15803d',
                      marginBottom: 4
                    }}>
                      {variant.units} {variant.unitsOfMeasurement}
                    </Text>
                    {isCustomerExists && variant.price > 0 ? (
                      <>
                        <Text style={{
                          textAlign: 'center',
                          fontWeight: 'bold',
                          fontSize: 16,
                          color: isSelected ? '#166534' : '#16a34a',
                          marginBottom: 4
                        }}>
                          ₹{variant.price}
                        </Text>
                        {variant.originalPrice && (
                          <Text style={{
                            textAlign: 'center',
                            color: '#16a34a',
                            textDecorationLine: 'line-through',
                            fontSize: 14,
                            marginBottom: 4
                          }}>
                            ₹{variant.originalPrice}
                          </Text>
                        )}
                      </>
                    ) : (
                      <Text style={{
                        textAlign: 'center',
                        fontSize: 14,
                        color: '#6B7280',
                        fontStyle: 'italic',
                        marginBottom: 4
                      }}>
                        Price on request
                      </Text>
                    )}
                    {variant.minOrderQuantity > 1 && (
                      <Text style={{
                        textAlign: 'center',
                        color: '#dc2626',
                        fontSize: 12,
                        fontWeight: '500'
                      }}>
                        Min: {variant.minOrderQuantity}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Quantity and Price Section - Only show for registered users */}
          {isCustomerExists && currentProduct.price > 0 && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 24,
              backgroundColor: 'white',
              zIndex: 3
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={handleDecrease}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  borderWidth: 2,
                  borderColor: isDecreaseDisabled ? '#e5e7eb' : '#d1d5db',
                  backgroundColor: isDecreaseDisabled ? '#f3f4f6' : 'white',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                disabled={isDecreaseDisabled}
              >
                <Ionicons 
                  name="remove" 
                  size={20} 
                  color={isDecreaseDisabled ? "#9CA3AF" : "#374151"} 
                />
              </TouchableOpacity>
              
              <TextInput
                value={tempQuantity}
                onChangeText={handleTextInputChange}
                onBlur={handleTextInputBlur}
                style={{
                  marginHorizontal: 16,
                  width: 64,
                  height: 48,
                  textAlign: 'center',
                  fontSize: 20,
                  fontWeight: 'bold',
                  borderWidth: 2,
                  borderColor: '#d1d5db',
                  borderRadius: 8,
                  backgroundColor: 'white'
                }}
                keyboardType="numeric"
                maxLength={3}
                selectTextOnFocus={true}
              />
              
              <TouchableOpacity
                onPress={handleIncrease}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  borderWidth: 2,
                  borderColor: '#16a34a',
                  backgroundColor: 'white',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Ionicons 
                  name="add" 
                  size={20} 
                  color="#16a34a" 
                />
              </TouchableOpacity>
            </View>
            
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#111827'
            }}>
              ₹{(currentProduct.price * quantity).toFixed(2)}
            </Text>
          </View>
          )}

          {/* Order Quantity Info */}
          {currentProduct.minOrderQuantity > 1 && (
            <View style={{
              marginBottom: 24,
              backgroundColor: '#f9fafb',
              borderRadius: 8,
              padding: 12,
              borderLeftWidth: 4,
              borderLeftColor: '#f59e0b'
            }}>
              <Text style={{
                color: '#dc2626',
                fontSize: 14,
                fontWeight: '500'
              }}>
                ⚠️ Minimum Order Quantity: {currentProduct.minOrderQuantity}
              </Text>
            </View>
          )}

          {/* Expandable Sections */}
          <View style={{ marginTop: 16 }}>
            <TouchableOpacity
              onPress={() => toggleSection('details')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#e5e7eb'
              }}
            >
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#111827'
              }}>
                Product Detail
              </Text>
              <Ionicons
                name={expandedSection === 'details' ? "chevron-up" : "chevron-forward"}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
            {expandedSection === 'details' && (
              <View style={{ paddingBottom: 16 }}>
                <Text style={{
                  color: '#374151',
                  lineHeight: 24
                }}>
                  {currentProduct.description}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => toggleSection('nutrition')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#e5e7eb'
              }}
            >
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#111827'
              }}>
                Nutritions
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  backgroundColor: '#e5e7eb',
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 20,
                  marginRight: 8
                }}>
                  <Text style={{
                    fontSize: 14,
                    color: '#374151'
                  }}>
                    {currentProduct.nutritionInfo}
                  </Text>
                </View>
                <Ionicons
                  name={expandedSection === 'nutrition' ? "chevron-up" : "chevron-forward"}
                  size={20}
                  color="#9CA3AF"
                />
              </View>
            </TouchableOpacity>
            {expandedSection === 'nutrition' && (
              <View style={{ paddingBottom: 16 }}>
                <Text style={{
                  color: '#374151',
                  lineHeight: 24
                }}>
                  Rich in vitamins, minerals, and antioxidants. Contains natural sugars and dietary fiber.
                  Perfect for a healthy diet and natural energy boost.
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => toggleSection('review')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#e5e7eb'
              }}
            >
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#111827'
              }}>
                Review
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', marginRight: 8 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons key={star} name="star" size={16} color="#F59E0B" />
                  ))}
                </View>
                <Ionicons
                  name={expandedSection === 'review' ? "chevron-up" : "chevron-forward"}
                  size={20}
                  color="#9CA3AF"
                />
              </View>
            </TouchableOpacity>
            {expandedSection === 'review' && (
              <View style={{ paddingBottom: 16 }}>
                <Text style={{
                  color: '#374151',
                  lineHeight: 24
                }}>
                  Excellent quality product! Fresh and tasty. Highly recommended for daily use.
                  Great value for money. Will definitely order again.
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => toggleSection('other')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#e5e7eb'
              }}
            >
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#111827'
              }}>
                Other Details
              </Text>
              <Ionicons
                name={expandedSection === 'other' ? "chevron-up" : "chevron-forward"}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
            {expandedSection === 'other' && (
              <View style={{ paddingBottom: 16 }}>
                <Text style={{
                  color: '#374151',
                  lineHeight: 24
                }}>
                  {currentProduct.otherDetails}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Similar Products Section */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#111827'
            }}>
              Similar Products
            </Text>
            <TouchableOpacity>
              <Text style={{
                color: '#16a34a',
                fontWeight: '500'
              }}>
                See All
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 220 }}>
            <FlatList
              data={similarProducts}
              renderItem={renderSimilarProduct}
              keyExtractor={(item, index) => `similar_${item.productId}_${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 0 }}
            />
          </View>
        </View>
      </ScrollView>

      {/* Add To Basket Button - Only for registered users */}
      {isCustomerExists && currentProduct.price > 0 && (
        <View style={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          backgroundColor: 'white'
        }}>
          <TouchableOpacity
            onPress={handleAddToBasket}
            style={{
              backgroundColor: '#22c55e',
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3
            }}
            activeOpacity={0.9}
          >
            <Text style={{
              color: 'white',
              fontSize: 18,
              fontWeight: 'bold'
            }}>
              Add To Basket
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
