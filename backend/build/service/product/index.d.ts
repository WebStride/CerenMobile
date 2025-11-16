/**
 * Get customer pricing info based on userId and optional selectedCustomerId
 * Priority: selectedCustomerId > userId lookup
 * @param userId - User ID from token
 * @param selectedCustomerId - Optional selected customer/store ID
 * @returns Pricing information including whether to show prices
 */
export declare function getCustomerPricingInfo(userId: number, selectedCustomerId?: number | null): Promise<{
    customerPresent: boolean;
    customerId: number;
    priceColumn: string;
    showPricing: boolean;
} | {
    customerPresent: boolean;
    customerId: null;
    priceColumn: null;
    showPricing: boolean;
}>;
export declare function getExclusiveProducts(customerId: number | null, priceColumn: string | null, showPricing?: boolean): Promise<{
    productId: any;
    productName: any;
    productUnits: any;
    unitsOfMeasurement: any;
    price: any;
    image: string | null;
    minimumOrderQuantity: any;
    showPricing: boolean;
}[]>;
export declare function getCustomerPreferredProducts(customerId: number | null, priceColumn: string | null, showPricing?: boolean): Promise<{
    productId: any;
    productName: any;
    productUnits: any;
    unitsOfMeasurement: any;
    price: any;
    image: string | null;
    minimumOrderQuantity: any;
    showPricing: boolean;
}[]>;
export declare function getAllProducts(customerId: number | null, priceColumn: string | null, showPricing?: boolean): Promise<{
    productId: any;
    productName: any;
    productUnits: any;
    unitsOfMeasurement: any;
    price: any;
    image: string | null;
    minimumOrderQuantity: any;
    showPricing: boolean;
}[]>;
export declare function getNewProducts(customerId: number | null, priceColumn: string | null, showPricing?: boolean): Promise<{
    productId: any;
    productName: any;
    productUnits: any;
    unitsOfMeasurement: any;
    price: any;
    image: string | null;
    minimumOrderQuantity: any;
    showPricing: boolean;
}[]>;
export declare function getBestSellingProducts(customerId: number | null, priceColumn: string | null, sortOrderLimit: number, showPricing?: boolean): Promise<{
    productId: any;
    productName: any;
    productUnits: any;
    unitsOfMeasurement: any;
    price: any;
    image: string | null;
    minimumOrderQuantity: any;
    showPricing: boolean;
}[]>;
export declare function getCategories(): Promise<{
    categoryId: number;
    categoryName: string;
    categoryImage: string | null | undefined;
}[]>;
export declare function getSubCategoriesByCategoryId(categoryId: number): Promise<{
    subCategoryId: number;
    subCategoryName: string;
    description: string;
    subCategoryImage: string | null;
}[]>;
export declare function getProductsBySubCategory(subCategoryId: number, priceColumn: string | null): Promise<{
    productId: any;
    productName: any;
    productUnits: any;
    unitsOfMeasurement: any;
    price: any;
    catalogId: any;
    image: string | null;
    minimumOrderQuantity: any;
}[]>;
export declare function getProductsByCatalogOfProduct(productId: number, priceColumn: string | null): Promise<{
    productId: any;
    productName: any;
    productUnits: any;
    unitsOfMeasurement: any;
    price: any;
    catalogId: any;
    image: string | null;
    minimumOrderQuantity: any;
}[]>;
export declare function getSimilarProducts(productId: number, priceColumn: string | null): Promise<{
    productId: any;
    productName: any;
    productUnits: any;
    unitsOfMeasurement: any;
    price: any;
    image: string | null;
    minimumOrderQuantity: any;
}[]>;
