import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  Dimensions,
  FlatList
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useCart } from "../context/CartContext";
import { useFavourites } from "../context/FavouritesContext";
import { getProductsByCatalog, getSimilarProductsApi } from "@/services/api";

const { width } = Dimensions.get('window');
const defaultImage = require("../../assets/images/Banana.png");

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
  const { cart, addToCart, increase, decrease, removeFromCart } = useCart();
  const { addToFavourites, removeFromFavourites, isFavourite } = useFavourites();
  const router = useRouter();
  
  const uniqueInstanceId = `${sectionKey}_${item.productId}_${index}`;
  const cartItem = cart.find(x => x.productId === item.productId);
  const isProductFavourite = isFavourite(item.productId);
  const minOrder = item.minOrderQuantity || 1;
  
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
      addToFavourites(item);
    }
  }, [isProductFavourite, item, addToFavourites, removeFromFavourites]);

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

  // FIXED: Proper MOQ validation in input change
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

  // FIXED: Proper MOQ validation in decrease
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
      
      {/* Show MOQ info if > 1 */}
      {minOrder > 1 && (
        <Text className="text-red-500 text-xs mb-1 font-medium">
          Min: {minOrder}
        </Text>
      )}
      
      <View className="w-full mb-2">
        <Text className="font-bold text-base text-gray-900">₹{item.price}.00</Text>
      </View>
      
      {isCustomerExists ? (
        showControls ? (
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
            <Text className="text-white font-semibold text-sm">
              Add {minOrder > 1 ? `${minOrder}` : ''} to Cart
            </Text>
          </TouchableOpacity>
        )
      ) : (
        <View className="w-full bg-gray-300 rounded-full py-2 px-3 items-center justify-center">
          <Text className="text-gray-600 font-semibold text-sm">Verification Required</Text>
        </View>
      )}
    </View>
  );
});

export default function ProductDetailsScreen() {
  const router = useRouter();
  const rawParams = useLocalSearchParams();
  const { addToCart } = useCart();
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [isCustomerExists] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const isProductFavourite = isFavourite(currentProduct.productId);

  // Update quantity when variant changes
  useEffect(() => {
    setQuantity(selectedVariant.minOrderQuantity);
  }, [selectedVariant.minOrderQuantity]);

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
          setSimilarProducts((simRes.products || []) as Product[]);
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
      addToFavourites(currentProduct);
    }
  }, [isProductFavourite, currentProduct, addToFavourites, removeFromFavourites]);

  // FIXED: Proper MOQ validation for main quantity input
  const handleTextInputChange = useCallback((text: string) => {
    if (text === '') {
      return;
    }

    const numValue = parseInt(text, 10);
    
    if (isNaN(numValue)) {
      setQuantity(currentProduct.minOrderQuantity);
      Alert.alert("Invalid Input", "Please enter a valid number");
      return;
    }
    
    if (numValue < currentProduct.minOrderQuantity) {
      setQuantity(currentProduct.minOrderQuantity);
      Alert.alert(
        "Below Minimum Quantity", 
        `Minimum order quantity is ${currentProduct.minOrderQuantity}. Quantity adjusted to minimum.`
      );
      return;
    }
    
    setQuantity(numValue);
  }, [currentProduct.minOrderQuantity]);

  const handleTextInputBlur = useCallback(() => {
    if (quantity < currentProduct.minOrderQuantity) {
      setQuantity(currentProduct.minOrderQuantity);
    }
  }, [quantity, currentProduct.minOrderQuantity]);

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
  }, [quantity, currentProduct.minOrderQuantity]);

  const handleIncrease = useCallback(() => {
    setQuantity(quantity + 1);
  }, [quantity]);

  const handleAddToBasket = useCallback(() => {
    if (quantity < currentProduct.minOrderQuantity) {
      Alert.alert("Error", `Minimum order quantity is ${currentProduct.minOrderQuantity}`);
      setQuantity(currentProduct.minOrderQuantity);
      return;
    }

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
    Alert.alert("Success", `${quantity} ${currentProduct.productName} (${currentProduct.productUnits}${currentProduct.unitsOfMeasurement}) added to cart!`);
  }, [quantity, currentProduct, addToCart]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  }, [expandedSection]);

  const renderImageItem = useCallback(({ item, index }: { item: string, index: number }) => (
    <View style={{ width, height: 300, justifyContent: 'center', alignItems: 'center' }}>
      <Image
        source={getImageSource(item)}
        style={{ width: '80%', height: '80%' }}
        resizeMode="contain"
      />
    </View>
  ), [getImageSource]);

  const renderSimilarProduct = useCallback(({ item, index }: { item: Product, index: number }) => (
    <ProductCard
      item={item}
      isCustomerExists={isCustomerExists}
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

        {/* Product Info */}
        <View className="px-4 py-4">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            {currentProduct.productName}
          </Text>
          <Text className="text-gray-600 text-base mb-4">
            {currentProduct.productUnits}{currentProduct.unitsOfMeasurement}, Price
          </Text>

          {/* Select Unit Section */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">Select Unit</Text>
            <View className="flex-row justify-between">
              {productVariants.map((variant) => {
                const isSelected = selectedVariant.variantId === variant.variantId;
                return (
                  <TouchableOpacity
                    key={variant.variantId}
                    onPress={() => handleVariantSelect(variant)}
                    className={`flex-1 mx-1 rounded-2xl p-3 border-2 ${
                      isSelected 
                        ? 'bg-green-200 border-green-600' 
                        : 'bg-green-50 border-green-300'
                    } ${!variant.isAvailable ? 'opacity-50' : ''}`}
                    disabled={!variant.isAvailable}
                    activeOpacity={0.7}
                  >
                    <Text className={`text-center font-bold text-lg ${
                      isSelected ? 'text-green-900' : 'text-green-700'
                    }`}>
                      {variant.units} {variant.unitsOfMeasurement}
                    </Text>
                    <Text className={`text-center font-bold text-base mt-1 ${
                      isSelected ? 'text-green-800' : 'text-green-600'
                    }`}>
                      ₹{variant.price}
                    </Text>
                    {variant.originalPrice && (
                      <Text className="text-center text-green-500 line-through text-sm mt-0.5">
                        ₹{variant.originalPrice}
                      </Text>
                    )}
                    {/* Show MOQ for each variant */}
                    {variant.minOrderQuantity > 1 && (
                      <Text className="text-center text-red-500 text-xs mt-1">
                        Min: {variant.minOrderQuantity}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Quantity and Price */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={handleDecrease}
                className={`w-12 h-12 rounded-full border-2 items-center justify-center ${
                  isDecreaseDisabled
                    ? 'border-gray-200 bg-gray-100' 
                    : 'border-gray-300 bg-white'
                }`}
                disabled={isDecreaseDisabled}
              >
                <Ionicons 
                  name="remove" 
                  size={20} 
                  color={isDecreaseDisabled ? "#9CA3AF" : "#374151"} 
                />
              </TouchableOpacity>
              
              <TextInput
                value={String(quantity)}
                onChangeText={handleTextInputChange}
                onBlur={handleTextInputBlur}
                className="mx-4 w-16 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg"
                keyboardType="numeric"
                maxLength={3}
                selectTextOnFocus={true}
              />
              
              <TouchableOpacity
                onPress={handleIncrease}
                className="w-12 h-12 rounded-full border-2 border-green-600 bg-white items-center justify-center"
              >
                <Ionicons 
                  name="add" 
                  size={20} 
                  color="#16a34a" 
                />
              </TouchableOpacity>
            </View>
            
            <Text className="text-2xl font-bold text-gray-900">
              ₹{(currentProduct.price * quantity).toFixed(2)}
            </Text>
          </View>

          {/* Order Quantity Info */}
          {currentProduct.minOrderQuantity > 1 && (
            <View className="mb-4 bg-gray-50 rounded-lg p-3">
              <Text className="text-red-500 text-sm font-medium">
                ⚠️ Minimum Order Quantity: {currentProduct.minOrderQuantity}
              </Text>
            </View>
          )}

          {/* Expandable Sections */}
          <View className="space-y-4">
            <TouchableOpacity
              onPress={() => toggleSection('details')}
              className="flex-row items-center justify-between py-4 border-b border-gray-200"
            >
              <Text className="text-lg font-semibold text-gray-900">Product Detail</Text>
              <Ionicons
                name={expandedSection === 'details' ? "chevron-up" : "chevron-forward"}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
            {expandedSection === 'details' && (
              <View className="pb-4">
                <Text className="text-gray-700 leading-6">{currentProduct.description}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => toggleSection('nutrition')}
              className="flex-row items-center justify-between py-4 border-b border-gray-200"
            >
              <Text className="text-lg font-semibold text-gray-900">Nutritions</Text>
              <View className="flex-row items-center">
                <View className="bg-gray-200 px-3 py-1 rounded-full mr-2">
                  <Text className="text-sm text-gray-700">{currentProduct.nutritionInfo}</Text>
                </View>
                <Ionicons
                  name={expandedSection === 'nutrition' ? "chevron-up" : "chevron-forward"}
                  size={20}
                  color="#9CA3AF"
                />
              </View>
            </TouchableOpacity>
            {expandedSection === 'nutrition' && (
              <View className="pb-4">
                <Text className="text-gray-700 leading-6">
                  Rich in vitamins, minerals, and antioxidants. Contains natural sugars and dietary fiber.
                  Perfect for a healthy diet and natural energy boost.
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => toggleSection('review')}
              className="flex-row items-center justify-between py-4 border-b border-gray-200"
            >
              <Text className="text-lg font-semibold text-gray-900">Review</Text>
              <View className="flex-row items-center">
                <View className="flex-row mr-2">
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
              <View className="pb-4">
                <Text className="text-gray-700 leading-6">
                  Excellent quality product! Fresh and tasty. Highly recommended for daily use.
                  Great value for money. Will definitely order again.
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => toggleSection('other')}
              className="flex-row items-center justify-between py-4 border-b border-gray-200"
            >
              <Text className="text-lg font-semibold text-gray-900">Other Details</Text>
              <Ionicons
                name={expandedSection === 'other' ? "chevron-up" : "chevron-forward"}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
            {expandedSection === 'other' && (
              <View className="pb-4">
                <Text className="text-gray-700 leading-6">{currentProduct.otherDetails}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Similar Products Section */}
        <View className="px-4 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-900">Similar Products</Text>
            <TouchableOpacity>
              <Text className="text-green-600 font-medium">See All</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={similarProducts}
            renderItem={renderSimilarProduct}
            keyExtractor={(item, index) => `similar_${item.productId}_${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 0 }}
          />
        </View>
      </ScrollView>

      {/* Add To Basket Button */}
      <View className="px-4 py-4 border-t border-gray-200">
        <TouchableOpacity
          onPress={handleAddToBasket}
          className="bg-green-500 rounded-2xl py-4 items-center justify-center shadow-lg"
          activeOpacity={0.9}
        >
          <Text className="text-white text-lg font-bold">Add To Basket</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
