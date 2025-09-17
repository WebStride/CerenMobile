export declare function getUserFavourites(userId: number): Promise<{
    productId: number;
    productName: string;
    image: string | null;
    productUnits: number | null;
    unitsOfMeasurement: string | null;
    price: number | null;
    userId: number;
    id: number;
    minOrderQuantity: number | null;
    addedAt: Date;
}[]>;
export declare function addUserFavourite(userId: number, product: any): Promise<{
    productId: number;
    productName: string;
    image: string | null;
    productUnits: number | null;
    unitsOfMeasurement: string | null;
    price: number | null;
    userId: number;
    id: number;
    minOrderQuantity: number | null;
    addedAt: Date;
}>;
export declare function removeUserFavourite(userId: number, productId: number): Promise<import("@prisma/client").Prisma.BatchPayload>;
