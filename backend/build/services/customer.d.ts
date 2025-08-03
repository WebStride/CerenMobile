export declare function checkCustomerExists(phoneNumber: string): Promise<{
    success: boolean;
    exists: boolean;
    message: string;
}>;
