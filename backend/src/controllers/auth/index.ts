import { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { sendOTP, verifyOTP, saveUserAndGenerateTokens, generateTokens } from "../../service/auth";

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret';


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

