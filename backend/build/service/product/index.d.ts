export declare function getCustomerPricingInfo(userId: number): Promise<{
    customerId: number;
    priceColumn: string;
}>;
export declare function getExclusiveProducts(customerId: number, priceColumn: string): Promise<{
    productId: never;
    productName: never;
    productUnits: never;
    unitsOfMeasurement: never;
    price: never;
    image: string | null;
}[]>;
export declare function getBestSellingProducts(customerId: number, priceColumn: string, sortOrderLimit: number): Promise<{
    productId: never;
    productName: never;
    productUnits: never;
    unitsOfMeasurement: never;
    price: never;
    image: string | null;
}[]>;
export declare function getCategories(): Promise<{
    categoryId: number;
    categoryName: string;
    categoryImage: string | null | undefined;
}[]>;
