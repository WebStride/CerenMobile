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
}[]>;
export declare function getCustomerPreferredProducts(customerId: number | null, priceColumn: string | null): Promise<{
    productId: any;
    productName: any;
    productUnits: any;
    unitsOfMeasurement: any;
    price: any;
    image: string | null;
}[]>;
export declare function getNewProducts(customerId: number | null, priceColumn: string | null): Promise<{
    productId: any;
    productName: any;
    productUnits: any;
    unitsOfMeasurement: any;
    price: any;
    image: string | null;
}[]>;
export declare function getBestSellingProducts(customerId: number | null, priceColumn: string | null, sortOrderLimit: number): Promise<{
    productId: any;
    productName: any;
    productUnits: any;
    unitsOfMeasurement: any;
    price: any;
    image: string | null;
}[]>;
export declare function getCategories(): Promise<{
    categoryId: number;
    categoryName: string;
    categoryImage: string | null | undefined;
}[]>;
