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
const twilio_1 = __importDefault(require("twilio"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
// Utility function to format phone number to E.164 format
function formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    // If it starts with country code, ensure it has + prefix
    if (cleaned.startsWith('91') && cleaned.length === 12) {
        return `+${cleaned}`;
    }
    // If it's a 10-digit Indian number, add +91
    if (cleaned.length === 10) {
        return `+91${cleaned}`;
    }
    // If it already has + prefix, return as is
    if (phoneNumber.startsWith('+')) {
        return phoneNumber;
    }
    // Default: add + prefix if not present
    return phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
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
        if (!verifyServiceSid) {
            throw new Error('TWILIO_VERIFY_SERVICE_SID is not defined in environment variables');
        }
        console.log('=== SEND OTP DEBUG ===');
        console.log('Input phone number:', phoneNumber);
        console.log('Service SID:', verifyServiceSid);
        try {
            const formattedPhone = formatPhoneNumber(phoneNumber);
            console.log('📱 Formatted phone number:', formattedPhone);
            console.log('📱 Original phone number:', phoneNumber);
            console.log('📤 Sending verification...');
            const verification = yield client.verify.v2.services(verifyServiceSid)
                .verifications
                .create({
                to: formattedPhone,
                channel: 'sms',
            });
            console.log('✅ Verification sent successfully');
            console.log('📊 Verification details:', {
                sid: verification.sid,
                status: verification.status,
                to: verification.to,
                channel: verification.channel
            });
            return verification;
        }
        catch (error) {
            console.error('❌ Error in sendOTP:', error);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error code:', error.code);
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
        if (!verifyServiceSid) {
            throw new Error('Twilio service SID not configured');
        }
        console.log('=== VERIFY OTP DEBUG ===');
        console.log('Input phone number:', phoneNumber);
        console.log('Input code:', code);
        console.log('Service SID:', verifyServiceSid);
        try {
            const formattedPhone = formatPhoneNumber(phoneNumber);
            console.log('📱 Formatted phone number:', formattedPhone);
            console.log('📱 Original phone number:', phoneNumber);
            console.log('🔍 Attempting verification check...');
            const verificationCheck = yield client.verify.v2.services(verifyServiceSid)
                .verificationChecks
                .create({
                to: formattedPhone,
                code: code
            });
            console.log('✅ Verification check completed');
            console.log('📊 Verification result:', {
                sid: verificationCheck.sid,
                status: verificationCheck.status,
                valid: verificationCheck.valid,
                to: verificationCheck.to
            });
            const isApproved = verificationCheck.status === 'approved';
            console.log('🎯 Final result - Approved:', isApproved);
            return isApproved;
        }
        catch (error) {
            console.error('❌ Error in verifyOTP:', error);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error code:', error.code);
            console.error('❌ Error status:', error.status);
            // Log more details about the error
            if (error.moreInfo) {
                console.error('❌ More info:', error.moreInfo);
            }
            throw new Error(`Verification failed: ${error.message}`);
        }
    });
}
function saveUserAndGenerateTokens(name, phoneNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("🔧 Creating/updating user:", { name, phoneNumber });
        // Check if user already exists
        let user = yield prisma.cUSTOMERMASTER.findFirst({
            where: { PHONENO: phoneNumber }
        });
        if (user) {
            // Update existing user
            user = yield prisma.cUSTOMERMASTER.update({
                where: { CUSTOMERID: user.CUSTOMERID },
                data: { CUSTOMERNAME: name }
            });
            console.log("✅ User updated:", user);
        }
        else {
            // Create new user
            user = yield prisma.cUSTOMERMASTER.create({
                data: {
                    CUSTOMERNAME: name,
                    PHONENO: phoneNumber,
                }
            });
            console.log("✅ User created:", user);
        }
        // Generate tokens
        const tokens = generateTokens({
            userId: user.CUSTOMERID,
            phoneNumber: user.PHONENO || phoneNumber
        });
        console.log("🎫 Tokens generated for user:", user.CUSTOMERID);
        return { user, tokens };
    });
}
function checkCustomerExists(phoneNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const customer = yield prisma.cUSTOMERMASTER.findFirst({
                where: { PHONENO: phoneNumber },
            });
            return {
                success: true,
                exists: !!customer,
                message: customer ? 'Customer exists' : 'Customer does not exist'
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
