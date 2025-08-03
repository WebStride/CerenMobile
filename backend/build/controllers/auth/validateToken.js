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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret';
function generateAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}
const validateToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const accessToken = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    const refreshToken = req.headers['x-refresh-token'];
    if (!accessToken) {
        return res.status(401).json({
            isValid: false,
            error: 'Access token is required'
        });
    }
    try {
        // First, try to verify the access token
        const decoded = jsonwebtoken_1.default.verify(accessToken, ACCESS_TOKEN_SECRET);
        return res.status(200).json({
            isValid: true,
            user: decoded
        });
    }
    catch (error) {
        // If access token is expired and refresh token is provided
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError && refreshToken) {
            try {
                // Verify refresh token
                const decoded = jsonwebtoken_1.default.verify(refreshToken, REFRESH_TOKEN_SECRET);
                // Generate new access token
                const newAccessToken = generateAccessToken({
                    userId: decoded.userId,
                    phoneNumber: decoded.phoneNumber
                });
                // Return new access token along with validation success
                return res.status(200).json({
                    isValid: true,
                    user: decoded,
                    newAccessToken
                });
            }
            catch (refreshError) {
                // If refresh token is also invalid
                return res.status(401).json({
                    isValid: false,
                    error: 'Session expired',
                    code: 'SESSION_EXPIRED'
                });
            }
        }
        // For any other error with access token
        return res.status(401).json({
            isValid: false,
            error: 'Invalid token'
        });
    }
});
exports.validateToken = validateToken;
