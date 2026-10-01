import React, { useEffect, useState, useCallback, useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getCategories } from "@/services/api";
import { SearchInput } from "@/components/SearchInput";
import { resolveCategoryImageSource } from "@/utils/productImage";

// Blurhash for smooth placeholder (light gray)
const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

// Types
interface Category {
    categoryId: number;
    categoryName: string;
    categoryImage: string | null;
}

const CATEGORY_BG = [
    "bg-amber-100",
    "bg-green-100",
    "bg-blue-100",
    "bg-purple-100",
    "bg-pink-100",
    "bg-orange-100",
    "bg-red-100",
    "bg-indigo-100",
];

const categoryBgClass = (categoryId: number) =>
    CATEGORY_BG[categoryId % CATEGORY_BG.length];

// Category Card Component (Grid Layout)
const CategoryCard = ({ item, onPress }: { item: Category; onPress: () => void }) => {
        const imageSource = resolveCategoryImageSource(item.categoryImage);

        return (
            <TouchableOpacity
                onPress={onPress}
                className={`rounded-xl flex-col items-center justify-start m-2 px-4 py-3 flex-1 ${categoryBgClass(item.categoryId)} min-h-[120px]`}
                activeOpacity={0.8}
            >
                <Image 
                    source={imageSource} 
                    placeholder={blurhash}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                    style={{ width: 64, height: 64, marginBottom: 8, backgroundColor: 'transparent' }}
                />
                <Text className="font-semibold text-sm text-gray-800 flex-1" numberOfLines={2} ellipsizeMode="tail">
                    {item.categoryName}
                </Text>
            </TouchableOpacity>
        );
};

type AllCategoriesScreenProps = {
    embeddedInTab?: boolean;
};

const AllCategoriesScreen = ({ embeddedInTab = false }: AllCategoriesScreenProps) => {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fullCategoryList = useRef<Category[]>([]);

    const loadInitialData = useCallback(async (options?: { silent?: boolean }) => {
        const silent = options?.silent ?? false;
        if (!silent) {
            setLoading(true);
        }
        try {
            const res = await getCategories();
            if (!res.success) {
                console.error("getCategories failed:", res.message);
                Alert.alert("Error", res.message || "Failed to fetch categories");
                setCategories([]);
                setFilteredCategories([]);
                fullCategoryList.current = [];
                return;
            }

            const fetchedCategories: Category[] = res.categories || [];
            fullCategoryList.current = fetchedCategories;
            setCategories(fetchedCategories);
            setFilteredCategories(fetchedCategories);
        } catch (error) {
            console.error("Error fetching categories:", error);
            Alert.alert("Error", "Failed to load categories");
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadInitialData({ silent: true });
        setRefreshing(false);
    }, [loadInitialData]);

    // Filter categories when search changes
    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredCategories(categories);
        } else {
            const filtered = fullCategoryList.current.filter((category) =>
                category.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredCategories(filtered);
        }
    }, [searchQuery, categories]);

    const handleCategoryPress = useCallback(
        (category: Category) => {
            router.push({
                pathname: "/products/CategoryProductsScreen",
                params: {
                    categoryId: category.categoryId.toString(),
                    categoryName: category.categoryName,
                },
            });
        },
        [router]
    );

    const renderCategory = useCallback(
        ({ item }: { item: Category }) => <CategoryCard item={item} onPress={() => handleCategoryPress(item)} />,
        [handleCategoryPress]
    );

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

    const listBottomPadding = embeddedInTab ? 120 : 100;

    return (
        <SafeAreaView className="flex-1 bg-white" edges={embeddedInTab ? ["top"] : undefined}>
            <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
                {!embeddedInTab ? (
                    <TouchableOpacity onPress={() => router.back()} className="mr-3">
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>
                ) : null}
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                    {embeddedInTab ? "Categories" : "All Categories"}
                </Text>
            </View>

            <SearchInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search categories..."
                containerClassName="flex-row items-center bg-gray-100 rounded-xl mx-4 mt-3 px-3 h-12"
            />

            <FlatList
                data={filteredCategories}
                renderItem={renderCategory}
                keyExtractor={(item) => item.categoryId.toString()}
                columnWrapperStyle={{ justifyContent: "space-between" }}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: listBottomPadding, flexGrow: 1 }}
                ListEmptyComponent={renderEmpty}
                initialNumToRender={16}
                maxToRenderPerBatch={12}
                windowSize={8}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />
                }
            />
        </SafeAreaView>
    );
};

export default AllCategoriesScreen;
