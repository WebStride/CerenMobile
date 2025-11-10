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
exports.validateToken = void 0;
exports.testOTP = testOTP;
exports.register = register;
exports.verifyPhoneNumber = verifyPhoneNumber;
exports.refreshToken = refreshToken;
exports.logout = logout;
exports.checkCustomer = checkCustomer;
exports.checkCustomerPublic = checkCustomerPublic;
exports.sendOtpController = sendOtpController;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../../service/auth");
const auth_2 = require("../../service/auth");
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret';
function testOTP(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { phoneNumber } = req.body;
        if (!phoneNumber) {
            return res.status(400).json({ error: "Missing phoneNumber" });
        }
        try {
            console.log('=== TEST OTP DEBUG ===');
            console.log('Original phone number:', phoneNumber);
            // Test phone number formatting
            const twilio = require('twilio');
            const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            // Format phone number the same way as in the service
            const formatPhoneNumber = (phone) => {
                const cleaned = phone.replace(/\D/g, '');
                if (cleaned.startsWith('91') && cleaned.length === 12) {
                    return `+${cleaned}`;
                }
                if (cleaned.length === 10) {
                    return `+91${cleaned}`;
                }
                if (phone.startsWith('+')) {
                    return phone;
                }
                return phone.startsWith('+') ? phone : `+${phone}`;
            };
            const formattedPhone = formatPhoneNumber(phoneNumber);
            console.log('Formatted phone number:', formattedPhone);
            // Test verification creation
            const verification = yield client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
                .verifications
                .create({
                to: formattedPhone,
                channel: 'sms',
            });
            console.log('Verification created:', {
                sid: verification.sid,
                status: verification.status,
                to: verification.to
            });
            res.json({
                success: true,
                message: "Test OTP sent successfully",
                debug: {
                    originalPhone: phoneNumber,
                    formattedPhone: formattedPhone,
                    verificationSid: verification.sid,
                    status: verification.status
                }
            });
        }
        catch (error) {
            console.error('Test OTP error:', error);
            res.status(500).json({
                error: "Test OTP failed",
                details: error.message,
                debug: {
                    originalPhone: phoneNumber,
                    errorCode: error.code
                }
            });
        }
    });
}
function register(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { phoneNumber, name } = req.body;
        if (!phoneNumber)
            return res.status(400).json({ error: "Missing phoneNumber" });
        try {
            yield (0, auth_1.sendOTP)(phoneNumber);
            res.json({ success: true, message: "OTP sent" });
        }
        catch (err) {
            res.status(500).json({ error: "Failed to send OTP", details: err.message });
        }
    });
}
function verifyPhoneNumber(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { phoneNumber, code, name } = req.body;
        if (!phoneNumber || !code) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        try {
            const isValid = yield (0, auth_1.verifyOTP)(phoneNumber, code);
            if (!isValid) {
                return res.status(400).json({ error: "Invalid OTP" });
            }
            const { user, tokens } = yield (0, auth_1.saveUserAndGenerateTokens)(name, phoneNumber);
            console.log("📤 Sending verification response with user data:", {
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    phoneNumber: user.phoneNumber
                }
            });
            res.json({
                success: true,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                user: {
                    id: user.id,
                    name: user.name,
                    phoneNumber: user.phoneNumber
                }
            });
        }
        catch (error) {
            res.status(500).json({ error: "Verification failed", details: error.message });
        }
    });
}
function refreshToken(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const refreshToken = req.headers['x-refresh-token'];
        if (!refreshToken) {
            return res.status(401).json({ error: "Refresh token required" });
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(refreshToken, REFRESH_TOKEN_SECRET);
            const tokens = (0, auth_1.generateTokens)({
                userId: decoded.userId,
                phoneNumber: decoded.phoneNumber
            });
            res.json({
                success: true,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            });
        }
        catch (error) {
            res.status(403).json({
                error: "Invalid refresh token",
                code: 'INVALID_REFRESH_TOKEN'
            });
        }
    });
}
function logout(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // For mobile apps, token invalidation is typically handled client-side
        // by removing the tokens from secure storage
        res.json({
            success: true,
            message: "Logout successful"
        });
    });
}
var validateToken_1 = require("./validateToken");
Object.defineProperty(exports, "validateToken", { enumerable: true, get: function () { return validateToken_1.validateToken; } });
function checkCustomer(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const tokenPayload = req.user;
            if (!tokenPayload || !tokenPayload.phoneNumber) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number not found in token'
                });
            }
            const result = yield (0, auth_2.checkCustomerExists)(tokenPayload.phoneNumber);
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
            // Include customerId and name when available so clients can behave accordingly
            return res.status(200).json({
                success: result.exists,
                message: result.message,
                exists: result.exists,
                userId: (_a = result.userId) !== null && _a !== void 0 ? _a : null,
                customerId: (_b = result.customerId) !== null && _b !== void 0 ? _b : null,
                name: (_c = result.name) !== null && _c !== void 0 ? _c : null
            });
        }
        catch (error) {
            console.error('Error in checkCustomer controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    });
}
// Public check by phone (no auth) - used by frontend to decide whether to show name field
function checkCustomerPublic(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const phone = String(req.query.phone || '').trim();
            console.log('[checkCustomerPublic] incoming phone:', phone);
            if (!phone)
                return res.status(400).json({ success: false, message: 'phone query parameter required' });
            const result = yield (0, auth_2.checkCustomerExists)(phone);
            console.log('[checkCustomerPublic] lookup result for', phone, ':', result);
            if (!result.success) {
                return res.status(500).json({ success: false, message: 'Internal server error' });
            }
            // Return name and customerId when present to help the client decide UI
            return res.status(200).json({ success: true, exists: result.exists, message: result.message, userId: (_a = result.userId) !== null && _a !== void 0 ? _a : null, customerId: (_b = result.customerId) !== null && _b !== void 0 ? _b : null, name: (_c = result.name) !== null && _c !== void 0 ? _c : null });
        }
        catch (error) {
            console.error('Error in checkCustomerPublic controller:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });
}
// Public send OTP endpoint (no auth) - accepts { phone }
function sendOtpController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { phone } = req.body;
            if (!phone)
                return res.status(400).json({ success: false, message: 'phone is required' });
            yield (0, auth_1.sendOTP)(phone);
            return res.json({ success: true, message: 'OTP sent' });
        }
        catch (error) {
            console.error('Error in sendOtpController:', error);
            return res.status(500).json({ success: false, message: (error === null || error === void 0 ? void 0 : error.message) || 'Failed to send OTP' });
        }
    });
}
