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
exports.sendOTP = sendOTP;
exports.generateTokens = generateTokens;
exports.verifyOTP = verifyOTP;
exports.saveUserAndGenerateTokens = saveUserAndGenerateTokens;
exports.checkCustomerExists = checkCustomerExists;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const msg91_1 = require("../sms/msg91");
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
// Utility function to format phone number to E.164 format
function formatPhoneNumber(phoneNumber) {
    if (!phoneNumber)
        return '';
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    // If it's a 10-digit Indian number, add +91
    if (cleaned.length === 10) {
        return `+91${cleaned}`;
    }
    // If it starts with country code 91, ensure it has + prefix
    if (cleaned.startsWith('91') && cleaned.length === 12) {
        return `+${cleaned}`;
    }
    // If we couldn't parse it, return the cleaned digits with +91 prefix as fallback
    // This handles cases where input is already formatted or has unexpected format
    return `+91${cleaned}`;
}
// export function generateOTP() {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// }
// export async function saveOTP(phoneNumber: string, otp: string, expiresAt: Date) {
//   return prisma.oTP.create({
//     data: {
//       phoneNumber,
//       otp,
//       expiresAt,
//     },
//   });
// }
function sendOTP(phoneNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('=== SEND OTP DEBUG ===');
        console.log('Input phone number:', phoneNumber);
        try {
            const formattedPhone = formatPhoneNumber(phoneNumber);
            console.log('📱 Formatted phone number:', formattedPhone);
            console.log('📱 Original phone number:', phoneNumber);
            console.log('📤 Sending verification via MSG91...');
            const result = yield (0, msg91_1.sendOtpToPhone)(formattedPhone);
            if (result.success) {
                console.log('✅ Verification sent successfully');
                console.log('📊 Verification details:', {
                    requestId: result.requestId,
                    message: result.message
                });
                return { status: 'pending', to: formattedPhone, requestId: result.requestId };
            }
            else {
                throw new Error(result.message || 'Failed to send OTP');
            }
        }
        catch (error) {
            console.error('❌ Error in sendOTP:', error);
            console.error('❌ Error message:', error.message);
            throw new Error(`Failed to send OTP: ${error.message}`);
        }
    });
}
function generateTokens(payload) {
    console.log("Generating tokens for payload:", payload);
    if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
        throw new Error('Access or refresh token secret not configured');
    }
    const accessToken = jsonwebtoken_1.default.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jsonwebtoken_1.default.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
}
function verifyOTP(phoneNumber, code) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('=== VERIFY OTP DEBUG ===');
        console.log('Input phone number:', phoneNumber);
        console.log('Input code:', code);
        try {
            const formattedPhone = formatPhoneNumber(phoneNumber);
            console.log('📱 Formatted phone number:', formattedPhone);
            console.log('📱 Original phone number:', phoneNumber);
            console.log('🔍 Attempting verification via MSG91...');
            const result = yield (0, msg91_1.verifyOtp)(formattedPhone, code);
            console.log('✅ Verification check completed');
            console.log('📊 Verification result:', {
                success: result.success,
                message: result.message
            });
            console.log('🎯 Final result - Approved:', result.success);
            return result.success;
        }
        catch (error) {
            console.error('❌ Error in verifyOTP:', error);
            console.error('❌ Error message:', error.message);
            throw new Error(`Verification failed: ${error.message}`);
        }
    });
}
function saveUserAndGenerateTokens(name, phoneNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("🔧 Creating/updating user (UserCustomerMaster):", { name, phoneNumber });
        // Normalize phone number before any DB operations
        const formattedPhone = formatPhoneNumber(phoneNumber);
        console.log('📱 saveUserAndGenerateTokens - Input:', phoneNumber, '→ Formatted:', formattedPhone);
        // Check if user already exists in USERCUSTOMERMASTER
        let user = yield prisma.uSERCUSTOMERMASTER.findFirst({
            where: { phoneNumber: formattedPhone }
        });
        if (user) {
            // Update existing user
            user = yield prisma.uSERCUSTOMERMASTER.update({
                where: { id: user.id },
                data: { name }
            });
            console.log("✅ UserCustomer updated:", user);
        }
        else {
            // Create new user in USERCUSTOMERMASTER with normalized phone
            user = yield prisma.uSERCUSTOMERMASTER.create({
                data: {
                    name,
                    phoneNumber: formattedPhone,
                }
            });
            console.log("✅ UserCustomer created:", user);
        }
        // Generate tokens using the user table id (not the legacy CUSTOMERID)
        const tokens = generateTokens({
            userId: user.id,
            phoneNumber: user.phoneNumber || formattedPhone
        });
        console.log("🎫 Tokens generated for user (id):", user.id);
        return { user, tokens };
    });
}
function checkCustomerExists(phoneNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Normalize phone number format to ensure consistent lookup
            const formattedPhone = formatPhoneNumber(phoneNumber);
            // Also prepare unformatted version (without +91) for fallback search
            const unformattedPhone = formattedPhone.replace(/^\+91/, '');
            console.log('📱 checkCustomerExists - Input:', phoneNumber);
            console.log('📱 Searching for:', formattedPhone, 'or', unformattedPhone);
            // Search for user with either format (handles inconsistent DB data)
            const user = yield prisma.uSERCUSTOMERMASTER.findFirst({
                where: {
                    OR: [
                        { phoneNumber: formattedPhone },
                        { phoneNumber: unformattedPhone }
                    ]
                },
            });
            if (user) {
                // If found with old format, update to normalized format
                if (user.phoneNumber !== formattedPhone) {
                    console.log('🔄 Normalizing phone format in DB:', user.phoneNumber, '→', formattedPhone);
                    yield prisma.uSERCUSTOMERMASTER.update({
                        where: { id: user.id },
                        data: { phoneNumber: formattedPhone }
                    });
                    user.phoneNumber = formattedPhone;
                }
                // If a legacy CUSTOMERMASTER record has been linked to this user (via USERID), return that id too
                const customer = yield prisma.cUSTOMERMASTER.findFirst({
                    where: { USERID: user.id }
                });
                return {
                    success: true,
                    exists: true,
                    message: 'User exists',
                    userId: user.id,
                    name: user.name || null,
                    customerId: customer ? customer.CUSTOMERID : null
                };
            }
            // No user found in USERCUSTOMERMASTER — treat as new
            return {
                success: true,
                exists: false,
                message: 'Customer does not exist'
            };
        }
        catch (error) {
            console.error('Error in checkCustomerExists service:', error);
            return {
                success: false,
                exists: false,
                message: 'Error checking customer existence'
            };
        }
    });
}
//# sourceMappingURL=index.js.map