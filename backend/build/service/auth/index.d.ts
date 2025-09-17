interface TokenPayload {
    userId: number;
    phoneNumber: string;
}
export declare function sendOTP(phoneNumber: string): Promise<import("twilio/lib/rest/verify/v2/service/verification").VerificationInstance>;
export declare function generateTokens(payload: TokenPayload): {
    accessToken: string;
    refreshToken: string;
};
export declare function verifyOTP(phoneNumber: string, code: string): Promise<boolean>;
export declare function saveUserAndGenerateTokens(name: string, phoneNumber: string): Promise<{
    user: {
        CUSTOMERID: number;
        CUSTOMERNAME: string;
        ADDRESS: string | null;
        PHONENO: string | null;
        CUSTOMERTYPEID: number;
        StoreAreaInSFT: bigint | null;
        AvgDailySales: bigint | null;
        ContactPersonName: string | null;
        LINEID: number | null;
        PRICEGROUPID: number | null;
        DISCOUNTGROUPID: number | null;
        GSTIN: string | null;
        STATEID: string | null;
        ADDEDDATE: Date | null;
        LASTUPDATEDATE: Date | null;
        ACTIVE: boolean | null;
        ORDERDAYS: string;
        PINCODE: number | null;
        CITY: string | null;
        USERID: number | null;
    };
    tokens: {
        accessToken: string;
        refreshToken: string;
    };
}>;
export declare function checkCustomerExists(phoneNumber: string): Promise<{
    success: boolean;
    exists: boolean;
    message: string;
}>;
export {};
