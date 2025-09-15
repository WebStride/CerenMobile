import { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { sendOTP, verifyOTP, saveUserAndGenerateTokens, generateTokens } from "../../service/auth";
import { RequestWithUser } from '../../types/express';
import {checkCustomerExists} from "../../service/auth"
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret';
export async function testOTP(req: Request, res: Response) {
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

        // Test verification creation
        const verification = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
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
    } catch (error: any) {
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

        return res.status(200).json({ 
            success: result.exists,  // true if customer exists, false if not
            message: result.message,
            exists: result.exists
        });
    } catch (error) {
        console.error('Error in checkCustomer controller:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
}