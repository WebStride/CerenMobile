import { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { sendOTP, verifyOTP, saveUserAndGenerateTokens, generateTokens } from "../../service/auth";
import { RequestWithUser } from '../../types/express';
import {checkCustomerExists} from "../../service/auth"
import { sendOtpToPhone, verifyOtp } from "../../service/sms/msg91";

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret';

export async function testOTP(req: Request, res: Response) {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({ error: "Missing phoneNumber" });
    }

    try {
        console.log('=== TEST OTP DEBUG (MSG91) ===');
        console.log('Original phone number:', phoneNumber);

        // Format phone number
        const formatPhoneNumber = (phone: string) => {
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

        // Send OTP via MSG91
        const result = await sendOtpToPhone(formattedPhone);

        console.log('OTP send result:', result);

        if (result.success) {
            res.json({
                success: true,
                message: "Test OTP sent successfully via MSG91",
                debug: {
                    originalPhone: phoneNumber,
                    formattedPhone: formattedPhone,
                    requestId: result.requestId,
                    provider: 'MSG91'
                }
            });
        } else {
            res.status(500).json({
                error: "Test OTP failed",
                details: result.message,
                debug: {
                    originalPhone: phoneNumber,
                    formattedPhone: formattedPhone,
                    provider: 'MSG91'
                }
            });
        }
    } catch (error: any) {
        console.error('Test OTP error:', error);
        res.status(500).json({
            error: "Test OTP failed",
            details: error.message,
            debug: {
                originalPhone: phoneNumber,
                errorCode: error.code,
                provider: 'MSG91'
            }
        });
    }
}


export async function register(req: Request, res: Response) {
    const { phoneNumber, name } = req.body;
    if (!phoneNumber)
        return res.status(400).json({ error: "Missing phoneNumber" });
    try {
        await sendOTP(phoneNumber);
        res.json({ success: true, message: "OTP sent" });
    } catch (err : any) {
        res.status(500).json({ error: "Failed to send OTP", details: err.message });
    }

}


export async function verifyPhoneNumber(req: Request, res: Response) {
    const { phoneNumber, code, name } = req.body;

    if (!phoneNumber || !code) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const isValid = await verifyOTP(phoneNumber, code);
        
        if (!isValid) {
            return res.status(400).json({ error: "Invalid OTP" });
        }

        const { user, tokens } = await saveUserAndGenerateTokens(name, phoneNumber);

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
    } catch (error: any) {
        res.status(500).json({ error: "Verification failed", details: error.message });
    }
}

export async function refreshToken(req: Request, res: Response) {
    const refreshToken = req.headers['x-refresh-token'] as string;

    if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token required" });
    }

    try {
        const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as {
            userId: number;
            phoneNumber: string;
        };

        const tokens = generateTokens({ 
            userId: decoded.userId, 
            phoneNumber: decoded.phoneNumber 
        });

        res.json({ 
            success: true,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });
    } catch (error) {
        res.status(403).json({ 
            error: "Invalid refresh token",
            code: 'INVALID_REFRESH_TOKEN'
        });
    }
}

export async function logout(req: Request, res: Response) {
    // For mobile apps, token invalidation is typically handled client-side
    // by removing the tokens from secure storage
    res.json({ 
        success: true,
        message: "Logout successful"
    });
}

export { validateToken } from './validateToken';

export async function checkCustomer(req: RequestWithUser, res: Response) {
    try {
        const tokenPayload = req.user;

        if (!tokenPayload || !tokenPayload.phoneNumber) {
            return res.status(400).json({ 
                success: false, 
                message: 'Phone number not found in token' 
            });
        }

        const result = await checkCustomerExists(tokenPayload.phoneNumber);

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
            userId: result.userId ?? null,
            customerId: result.customerId ?? null,
            name: result.name ?? null
        });
    } catch (error) {
        console.error('Error in checkCustomer controller:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
}

// Public check by phone (no auth) - used by frontend to decide whether to show name field
export async function checkCustomerPublic(req: Request, res: Response) {
    try {
        const phone = String(req.query.phone || '').trim();
        console.log('[checkCustomerPublic] incoming phone:', phone);
        if (!phone) return res.status(400).json({ success: false, message: 'phone query parameter required' });

        const result = await checkCustomerExists(phone);
        console.log('[checkCustomerPublic] lookup result for', phone, ':', result);
        if (!result.success) {
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }

        // Return name and customerId when present to help the client decide UI
        return res.status(200).json({
            success: true,
            exists: result.exists,
            message: result.message,
            userId: result.userId ?? null,
            customerId: result.customerId ?? null,
            name: result.name ?? null
        });
    } catch (error) {
        console.error('Error in checkCustomerPublic controller:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// Public send OTP endpoint (no auth) - accepts { phone }
export async function sendOtpController(req: Request, res: Response) {
    try {
        const { phone } = req.body as { phone?: string };
        if (!phone) return res.status(400).json({ success: false, message: 'phone is required' });

        await sendOTP(phone);
        return res.json({ success: true, message: 'OTP sent' });
    } catch (error: any) {
        console.error('Error in sendOtpController:', error);
        return res.status(500).json({ success: false, message: error?.message || 'Failed to send OTP' });
    }
}