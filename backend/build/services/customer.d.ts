export declare function checkCustomerExists(phoneNumber: string): Promise<{
    success: boolean;
    exists: boolean;
    message: string;
}>;
export declare function getStoresForUser(userId: number): Promise<{
    success: boolean;
    stores: {
        CUSTOMERID: number;
        CUSTOMERNAME: string;
        ADDRESS: string | null;
        PINCODE: number | null;
        CITY: string | null;
    }[];
    message?: undefined;
} | {
    success: boolean;
    stores: never[];
    message: string;
}>;
