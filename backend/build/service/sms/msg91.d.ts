/**
 * Format phone number for MSG91 API (requires digits only, no + prefix)
 * Input: +919845188888 or 919845188888 or 9845188888
 * Output: 919845188888
 */
export declare function formatPhoneForMsg91(phoneNumber: string): string;
/**
 * Check if a phone number is in the test bypass list
 */
export declare function isTestPhoneNumber(phoneNumber: string): boolean;
/**
 * Send OTP to phone number via MSG91
 * @param phoneNumber - Phone number in any format (will be normalized)
 * @param hashCode - Optional hash code for auto-read on Android
 * @returns Promise<{ success: boolean; message: string; requestId?: string }>
 */
export declare function sendOtpToPhone(phoneNumber: string, hashCode?: string): Promise<{
    success: boolean;
    message: string;
    requestId?: string;
}>;
/**
 * Verify OTP via MSG91
 * @param phoneNumber - Phone number in any format
 * @param otp - OTP code entered by user
 * @returns Promise<{ success: boolean; message: string }>
 */
export declare function verifyOtp(phoneNumber: string, otp: string): Promise<{
    success: boolean;
    message: string;
}>;
/**
 * Resend OTP via MSG91
 * @param phoneNumber - Phone number in any format
 * @param retryType - 'text' for SMS, 'voice' for voice call
 * @returns Promise<{ success: boolean; message: string }>
 */
export declare function resendOtp(phoneNumber: string, retryType?: 'text' | 'voice'): Promise<{
    success: boolean;
    message: string;
}>;
