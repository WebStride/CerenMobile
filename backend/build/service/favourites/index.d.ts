export declare function getUserFavourites(userId: number): Promise<{
    id: number;
    productId: number;
    productName: string;
    image: string | null;
    productUnits: number | null;
    unitsOfMeasurement: string | null;
    price: number | null;
    userId: number;
    minOrderQuantity: number | null;
    addedAt: Date;
}[]>;
export declare function addUserFavourite(userId: number, product: any): Promise<{
    id: number;
    productId: number;
    productName: string;
    image: string | null;
    productUnits: number | null;
    unitsOfMeasurement: string | null;
    price: number | null;
    userId: number;
    minOrderQuantity: number | null;
    addedAt: Date;
}>;
export declare function removeUserFavourite(userId: number, productId: number): Promise<import("@prisma/client").Prisma.BatchPayload>;
