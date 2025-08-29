export declare function getCustomerPricingInfo(userId: number): Promise<{
    customerPresent: boolean;
    customerId: null;
    priceColumn: null;
} | {
    customerPresent: boolean;
    customerId: number;
    priceColumn: string;
}>;
export declare function getExclusiveProducts(customerId: number | null, priceColumn: string | null): Promise<{
    productId: any;
    productName: any;
    productUnits: any;
    unitsOfMeasurement: any;
    price: any;
    image: string | null;
    minimumOrderQuantity: any;
}[]>;
export declare function getCustomerPreferredProducts(customerId: number | null, priceColumn: string | null): Promise<{
    productId: any;
    productName: any;
    productUnits: any;
    unitsOfMeasurement: any;
    price: any;
    image: string | null;
    minimumOrderQuantity: any;
}[]>;
export declare function getAllProducts(customerId: number | null, priceColumn: string | null): Promise<{
    productId: any;
    productName: any;
    productUnits: any;
    unitsOfMeasurement: any;
    price: any;
    image: string | null;
    minimumOrderQuantity: any;
}[]>;
export declare function getNewProducts(customerId: number | null, priceColumn: string | null): Promise<{
    productId: any;
    productName: any;
    productUnits: any;
    unitsOfMeasurement: any;
    price: any;
    image: string | null;
    minimumOrderQuantity: any;
}[]>;
export declare function getBestSellingProducts(customerId: number | null, priceColumn: string | null, sortOrderLimit: number): Promise<{
    productId: any;
    productName: any;
    productUnits: any;
    unitsOfMeasurement: any;
    price: any;
    image: string | null;
    minimumOrderQuantity: any;
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
