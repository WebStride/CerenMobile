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
        try {
            const verification = yield client.verify.v2.services(verifyServiceSid)
                .verifications
                .create({
                to: phoneNumber,
                channel: 'sms',
            });
            console.log('Verification SID:', verification.sid);
            return verification;
        }
        catch (error) {
            console.error('Error sending OTP:', error);
            throw new Error('Failed to send OTP');
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
        const verificationCheck = yield client.verify.v2.services(verifyServiceSid)
            .verificationChecks
            .create({
            to: phoneNumber,
            code: code
        });
        return verificationCheck.status === 'approved';
    });
}
function saveUserAndGenerateTokens(name, phoneNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        // Create or update user
        const user = yield prisma.uSERCUSTOMERMASTER.upsert({
            where: { phoneNumber },
            update: { name },
            create: {
                name,
                phoneNumber,
            },
        });
        // Generate tokens
        const tokens = generateTokens({
            userId: user.id,
            phoneNumber: user.phoneNumber
        });
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
