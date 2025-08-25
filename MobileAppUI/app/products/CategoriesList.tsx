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
import { useRouter } from "expo-router";

// Types
interface Category {
    categoryId: number;
    categoryName: string;
    categoryImage: string | null;
}

const defaultImage = require("../../assets/images/Banana.png");

// Mock data for 50+ categories
const generateMockCategories = (count: number): Category[] => {
    const categoryNames = [
        "Fresh Fruits", "Vegetables", "Dairy Products", "Meat & Fish", "Bakery Items",
        "Beverages", "Snacks", "Frozen Foods", "Organic Products", "Spices & Herbs",
        "Cereals & Grains", "Canned Foods", "Personal Care", "Household Items", "Baby Care",
        "Health & Wellness", "Pet Supplies", "Kitchen Essentials", "Cleaning Supplies", "Breakfast Items",
        "Condiments & Sauces", "Nuts & Dry Fruits", "International Foods", "Ready to Cook", "Instant Foods",
        "Protein Supplements", "Energy Drinks", "Tea & Coffee", "Cooking Oil", "Sugar & Salt",
        "Ice Cream", "Chocolates", "Biscuits & Cookies", "Pasta & Noodles", "Rice & Pulses",
        "Pickle & Chutneys", "Sweets & Desserts", "Juice & Smoothies", "Water & Soft Drinks", "Wine & Beer",
        "Seasonal Fruits", "Exotic Vegetables", "Regional Specialties", "Gourmet Foods", "Diet Foods",
        "Vegan Products", "Gluten Free", "Sugar Free", "Low Fat", "Artisanal Products"
    ];

    return Array.from({ length: count }, (_, index) => ({
        categoryId: index + 1,
        categoryName: categoryNames[index % categoryNames.length],
        categoryImage: defaultImage
    }));
};

// Category Card Component (Grid Layout)
const CategoryCard = ({ item, onPress }: { item: Category, onPress: () => void }) => {
    const getRandomColor = () => {
        const colors = ['bg-amber-100', 'bg-green-100', 'bg-blue-100', 'bg-purple-100', 'bg-pink-100', 'bg-orange-100', 'bg-red-100', 'bg-indigo-100'];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            className={`rounded-xl flex-col items-center justify-start m-2 px-4 py-3 flex-1 ${getRandomColor()} min-h-[120px]`}
            activeOpacity={0.7}
        >
            <Image
                source={item.categoryImage || defaultImage}
                className="w-16 h-16 mb-2"
                resizeMode="contain"
            />
            <Text
                className="font-semibold text-sm text-gray-800 flex-1"
                numberOfLines={2}
                ellipsizeMode="tail"
            >
                {item.categoryName}
            </Text>
        </TouchableOpacity>
    );
};

const AllCategoriesScreen = () => {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMoreData, setHasMoreData] = useState(true);

    const ITEMS_PER_PAGE = 20;
    const mockData = generateMockCategories(50); // Generate 50 mock categories

    // Initial load
    useEffect(() => {
        loadInitialData();
    }, []);

    // Filter categories when search changes
    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredCategories(categories);
        } else {
            const filtered = categories.filter(category =>
                category.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredCategories(filtered);
        }
    }, [searchQuery, categories]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            const initialCategories = mockData.slice(0, ITEMS_PER_PAGE);
            setCategories(initialCategories);
            setCurrentPage(1);
            setHasMoreData(mockData.length > ITEMS_PER_PAGE);
        } catch (error) {
            console.error("Error loading initial data:", error);
            Alert.alert("Error", "Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    const loadMoreData = async () => {
        if (loadingMore || !hasMoreData || searchQuery.trim() !== "") return;

        setLoadingMore(true);
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 800));

            const nextPage = currentPage + 1;
            const startIndex = (nextPage - 1) * ITEMS_PER_PAGE;
            const endIndex = startIndex + ITEMS_PER_PAGE;
            const newCategories = mockData.slice(startIndex, endIndex);

            if (newCategories.length > 0) {
                setCategories(prev => [...prev, ...newCategories]);
                setCurrentPage(nextPage);
                setHasMoreData(endIndex < mockData.length);
            } else {
                setHasMoreData(false);
            }
        } catch (error) {
            console.error("Error loading more data:", error);
        } finally {
            setLoadingMore(false);
        }
    };

  const handleCategoryPress = useCallback((category: Category) => {
    router.push({
      pathname: "/products/CategoryProductsScreen",
      params: {
        categoryId: category.categoryId.toString(),
        categoryName: category.categoryName,
      },
    });
  }, [router]);

    const renderCategory = useCallback(({ item }: { item: Category }) => (
        <CategoryCard
            item={item}
            onPress={() => handleCategoryPress(item)}
        />
    ), [handleCategoryPress]);

    const renderFooter = () => {
        if (!loadingMore) return null;

        return (
            <View className="py-4">
                <ActivityIndicator size="small" color="#16a34a" />
                <Text className="text-center text-gray-500 mt-2">Loading more categories...</Text>
            </View>
        );
    };

    const renderEmpty = () => (
        <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="grid" size={64} color="#d1d5db" />
            <Text className="text-gray-500 text-lg mt-4">No categories found</Text>
            <Text className="text-gray-400 text-sm mt-1">Try adjusting your search</Text>
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
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                    All Categories
                </Text>
                <TouchableOpacity>
                    <Ionicons name="grid" size={24} color="#374151" />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View className="px-4 py-3">
                <View className="flex-row items-center bg-gray-100 rounded-xl px-3 h-12">
                    <Ionicons name="search" size={20} color="#6b7280" />
                    <TextInput
                        className="flex-1 ml-2 text-base text-gray-900"
                        placeholder="Search categories..."
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

            {/* Categories List */}
            <FlatList
                data={filteredCategories}
                renderItem={renderCategory}
                keyExtractor={(item) => item.categoryId.toString()}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingHorizontal: 8,
                    paddingBottom: 100,
                    flexGrow: 1
                }}
                onEndReached={loadMoreData}
                onEndReachedThreshold={0.1}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={renderEmpty}
                maxToRenderPerBatch={10}
                windowSize={10}
                initialNumToRender={20}
                removeClippedSubviews={true}
                getItemLayout={(data, index) => ({
                    length: 86, // Approximate item height (70px + margins)
                    offset: 86 * index,
                    index,
                })}
            />

            {/* Results Count */}
            {filteredCategories.length > 0 && (
                <View className="absolute bottom-4 left-4 right-4">
                    <View className="bg-black/80 rounded-full px-4 py-2 self-center">
                        <Text className="text-white text-sm">
                            {searchQuery ? `${filteredCategories.length} results` : `${categories.length} of ${mockData.length} categories`}
                        </Text>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
};

export default AllCategoriesScreen;
