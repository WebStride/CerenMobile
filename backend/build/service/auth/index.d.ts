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
        id: number;
        name: string;
        phoneNumber: string;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
    };
    tokens: {
        accessToken: string;
        refreshToken: string;
    };
}>;
export {};
