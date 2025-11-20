export declare function getUserFavourites(customerId: number): Promise<{
    id: number;
    userId: number;
    productId: number;
    productName: string;
    image: string | null;
    productUnits: number | null;
    unitsOfMeasurement: string | null;
    price: number | null;
    minOrderQuantity: number | null;
    addedAt: Date;
}[]>;
export declare function addUserFavourite(customerId: number, product: any): Promise<{
    id: number;
    userId: number;
    productId: number;
    productName: string;
    image: string | null;
    productUnits: number | null;
    unitsOfMeasurement: string | null;
    price: number | null;
    minOrderQuantity: number | null;
    addedAt: Date;
}>;
export declare function removeUserFavourite(customerId: number, productId: number): Promise<import("@prisma/client").Prisma.BatchPayload>;
