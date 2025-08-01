interface UserAddressData {
    name: string;
    phoneNumber: string;
    city: string;
    district: string;
    houseNumber: string;
    buildingBlock: string;
    pinCode: string;
    landmark?: string;
}
export declare function sendUserDetailsToAdmin(userData: UserAddressData): Promise<import("twilio/lib/rest/api/v2010/account/message").MessageInstance>;
export {};
