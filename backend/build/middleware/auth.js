"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret';
function generateAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const accessToken = authHeader && authHeader.split(' ')[1];
    const refreshToken = req.headers['x-refresh-token'];
    if (!accessToken) {
        return res.status(401).json({ error: 'Access token required' });
    }
    try {
        // First, try to verify the access token
        const decoded = jsonwebtoken_1.default.verify(accessToken, ACCESS_TOKEN_SECRET);
        req.user = decoded;
        next();
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
                // Set the new access token in response header
                res.setHeader('X-New-Access-Token', newAccessToken);
                // Continue with the request
                req.user = decoded;
                next();
            }
            catch (refreshError) {
                // If refresh token is also invalid, require re-authentication
                return res.status(401).json({
                    error: 'Session expired',
                    code: 'SESSION_EXPIRED'
                });
            }
        }
        else {
            return res.status(403).json({ error: 'Invalid access token' });
        }
    }
}
