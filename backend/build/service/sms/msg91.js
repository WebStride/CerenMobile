"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPhoneForMsg91 = formatPhoneForMsg91;
exports.isTestPhoneNumber = isTestPhoneNumber;
exports.sendOtpToPhone = sendOtpToPhone;
exports.verifyOtp = verifyOtp;
exports.resendOtp = resendOtp;
const axios_1 = __importDefault(require("axios"));
// MSG91 Configuration from environment variables
const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || '';
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID || '';
const MSG91_OTP_LENGTH = process.env.MSG91_OTP_LENGTH || '4';
const MSG91_OTP_EXPIRY = process.env.MSG91_OTP_EXPIRY || '3'; // minutes
const MSG91_OTP_SEND_URL = 'https://control.msg91.com/api/v5/otp';
const MSG91_OTP_VERIFY_URL = 'https://control.msg91.com/api/v5/otp/verify';
// Test phone numbers that bypass OTP verification (comma separated in env)
const TEST_PHONE_NUMBERS = (process.env.TEST_PHONE_NUMBERS || '').split(',').map(p => p.trim()).filter(Boolean);
/**
 * Format phone number for MSG91 API (requires digits only, no + prefix)
 * Input: +919845188888 or 919845188888 or 9845188888
 * Output: 919845188888
 */
function formatPhoneForMsg91(phoneNumber) {
    // Remove all non-digit characters
    let digits = phoneNumber.replace(/\D/g, '');
    // If starts with 91 and has 12 digits (91 + 10 digit number), it's correct
    if (digits.startsWith('91') && digits.length === 12) {
        return digits;
    }
    // If 10 digits, prepend 91 (India country code)
    if (digits.length === 10) {
        return '91' + digits;
    }
    // Return as-is if already formatted correctly
    return digits;
}
/**
 * Check if a phone number is in the test bypass list
 */
function isTestPhoneNumber(phoneNumber) {
    if (TEST_PHONE_NUMBERS.length === 0)
        return false;
    const formattedInput = formatPhoneForMsg91(phoneNumber);
    return TEST_PHONE_NUMBERS.some(testPhone => {
        const formattedTest = formatPhoneForMsg91(testPhone);
        return formattedInput === formattedTest;
    });
}
/**
 * Send OTP to phone number via MSG91
 * @param phoneNumber - Phone number in any format (will be normalized)
 * @param hashCode - Optional hash code for auto-read on Android
 * @returns Promise<{ success: boolean; message: string; requestId?: string }>
 */
function sendOtpToPhone(phoneNumber, hashCode) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const formattedPhone = formatPhoneForMsg91(phoneNumber);
        // Check if test phone number - skip actual SMS but return success
        if (isTestPhoneNumber(phoneNumber)) {
            console.log(`📱 Test phone number detected: ${formattedPhone} - Skipping actual OTP send`);
            return {
                success: true,
                message: 'Test phone number - OTP send simulated',
                requestId: 'test-request-id'
            };
        }
        if (!MSG91_AUTH_KEY || !MSG91_TEMPLATE_ID) {
            console.error('❌ MSG91 configuration missing: AUTH_KEY or TEMPLATE_ID not set');
            return {
                success: false,
                message: 'SMS service not configured properly'
            };
        }
        try {
            console.log(`📤 Sending OTP to ${formattedPhone} via MSG91...`);
            const payload = {
                template_id: MSG91_TEMPLATE_ID,
                mobile: formattedPhone,
                otp_length: MSG91_OTP_LENGTH,
                otp_expiry: MSG91_OTP_EXPIRY
            };
            // Add hash code for Android auto-read if provided
            if (hashCode) {
                payload.hash = hashCode;
            }
            const response = yield axios_1.default.post(MSG91_OTP_SEND_URL, payload, {
                headers: {
                    'authkey': MSG91_AUTH_KEY,
                    'Content-Type': 'application/json'
                }
            });
            console.log('📨 MSG91 Send OTP Response:', response.data);
            // MSG91 returns { type: 'success', request_id: '...' } on success
            if (((_a = response.data) === null || _a === void 0 ? void 0 : _a.type) === 'success') {
                return {
                    success: true,
                    message: 'OTP sent successfully',
                    requestId: response.data.request_id
                };
            }
            return {
                success: false,
                message: ((_b = response.data) === null || _b === void 0 ? void 0 : _b.message) || 'Failed to send OTP'
            };
        }
        catch (error) {
            console.error('❌ MSG91 Send OTP Error:', ((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) || error.message);
            return {
                success: false,
                message: ((_e = (_d = error.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.message) || error.message || 'Failed to send OTP'
            };
        }
    });
}
/**
 * Verify OTP via MSG91
 * @param phoneNumber - Phone number in any format
 * @param otp - OTP code entered by user
 * @returns Promise<{ success: boolean; message: string }>
 */
function verifyOtp(phoneNumber, otp) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g;
        const formattedPhone = formatPhoneForMsg91(phoneNumber);
        // Test bypass: Accept '123456' OTP for any phone in development
        if (otp === '123456') {
            console.log('🎯 Test OTP 123456 accepted - bypassing MSG91 verification');
            return {
                success: true,
                message: 'Test OTP verified'
            };
        }
        // Test phone numbers with any 4-digit OTP (based on OTP_LENGTH)
        if (isTestPhoneNumber(phoneNumber)) {
            const expectedLength = parseInt(MSG91_OTP_LENGTH, 10);
            if (otp.length === expectedLength && /^\d+$/.test(otp)) {
                console.log(`📱 Test phone number ${formattedPhone} - accepting any ${expectedLength}-digit OTP`);
                return {
                    success: true,
                    message: 'Test phone OTP verified'
                };
            }
        }
        if (!MSG91_AUTH_KEY) {
            console.error('❌ MSG91 configuration missing: AUTH_KEY not set');
            return {
                success: false,
                message: 'SMS service not configured properly'
            };
        }
        try {
            console.log(`🔐 Verifying OTP for ${formattedPhone} via MSG91...`);
            // MSG91 verify endpoint uses GET with query params
            const response = yield axios_1.default.get(MSG91_OTP_VERIFY_URL, {
                params: {
                    mobile: formattedPhone,
                    otp: otp
                },
                headers: {
                    'authkey': MSG91_AUTH_KEY
                }
            });
            console.log('✅ MSG91 Verify OTP Response:', response.data);
            // MSG91 returns { type: 'success', message: 'OTP verified successfully' } on success
            if (((_a = response.data) === null || _a === void 0 ? void 0 : _a.type) === 'success') {
                return {
                    success: true,
                    message: 'OTP verified successfully'
                };
            }
            return {
                success: false,
                message: ((_b = response.data) === null || _b === void 0 ? void 0 : _b.message) || 'Invalid OTP'
            };
        }
        catch (error) {
            console.error('❌ MSG91 Verify OTP Error:', ((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) || error.message);
            // MSG91 returns 4xx status for invalid OTP
            if (((_d = error.response) === null || _d === void 0 ? void 0 : _d.status) === 400 || ((_e = error.response) === null || _e === void 0 ? void 0 : _e.status) === 401) {
                return {
                    success: false,
                    message: 'Invalid or expired OTP'
                };
            }
            return {
                success: false,
                message: ((_g = (_f = error.response) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g.message) || error.message || 'OTP verification failed'
            };
        }
    });
}
/**
 * Resend OTP via MSG91
 * @param phoneNumber - Phone number in any format
 * @param retryType - 'text' for SMS, 'voice' for voice call
 * @returns Promise<{ success: boolean; message: string }>
 */
function resendOtp(phoneNumber_1) {
    return __awaiter(this, arguments, void 0, function* (phoneNumber, retryType = 'text') {
        var _a, _b, _c, _d, _e;
        const formattedPhone = formatPhoneForMsg91(phoneNumber);
        // Test phone bypass
        if (isTestPhoneNumber(phoneNumber)) {
            console.log(`📱 Test phone number detected: ${formattedPhone} - Skipping actual resend`);
            return {
                success: true,
                message: 'Test phone number - OTP resend simulated'
            };
        }
        if (!MSG91_AUTH_KEY) {
            console.error('❌ MSG91 configuration missing: AUTH_KEY not set');
            return {
                success: false,
                message: 'SMS service not configured properly'
            };
        }
        try {
            console.log(`🔄 Resending OTP to ${formattedPhone} via MSG91 (${retryType})...`);
            const response = yield axios_1.default.get(`${MSG91_OTP_SEND_URL}/retry`, {
                params: {
                    mobile: formattedPhone,
                    retrytype: retryType
                },
                headers: {
                    'authkey': MSG91_AUTH_KEY
                }
            });
            console.log('📨 MSG91 Resend OTP Response:', response.data);
            if (((_a = response.data) === null || _a === void 0 ? void 0 : _a.type) === 'success') {
                return {
                    success: true,
                    message: 'OTP resent successfully'
                };
            }
            return {
                success: false,
                message: ((_b = response.data) === null || _b === void 0 ? void 0 : _b.message) || 'Failed to resend OTP'
            };
        }
        catch (error) {
            console.error('❌ MSG91 Resend OTP Error:', ((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) || error.message);
            return {
                success: false,
                message: ((_e = (_d = error.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.message) || error.message || 'Failed to resend OTP'
            };
        }
    });
}
//# sourceMappingURL=msg91.js.map