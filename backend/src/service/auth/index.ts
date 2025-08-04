import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import dotenv from 'dotenv';

dotenv.config();
import twilio from 'twilio';
import jwt from 'jsonwebtoken';
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;


const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

interface TokenPayload {
    userId: number;
    phoneNumber: string;
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

export async function sendOTP(phoneNumber: string) {
  if (!verifyServiceSid) {
    throw new Error('TWILIO_VERIFY_SERVICE_SID is not defined in environment variables');
  }
  try {
    const verification = await client.verify.v2.services(verifyServiceSid)
      .verifications
      .create({
        to: phoneNumber,
        channel: 'sms',
      });

    console.log('Verification SID:', verification.sid);
    return verification;
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw new Error('Failed to send OTP');
  }
}
export function generateTokens(payload: TokenPayload) {
    console.log("Generating tokens for payload:", payload);
    if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
        throw new Error('Access or refresh token secret not configured');
    }
    const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    
    return { accessToken, refreshToken };
}

export async function verifyOTP(phoneNumber: string, code: string) {
    if (!verifyServiceSid) {
        throw new Error('Twilio service SID not configured');
    }
    
    const verificationCheck = await client.verify.v2.services(verifyServiceSid)
        .verificationChecks
        .create({
            to: phoneNumber,
            code: code
        });
    
    return verificationCheck.status === 'approved';
}

export async function saveUserAndGenerateTokens(name: string, phoneNumber: string) {
    // Create or update user
    const user = await prisma.uSERCUSTOMERMASTER.upsert({
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
}


export async function checkCustomerExists(phoneNumber: string) {
    try {
        const customer = await prisma.cUSTOMERMASTER.findFirst({
            where: { PHONENO: phoneNumber },
        });

        return {
            success: true,
            exists: !!customer,
            message: customer ? 'Customer exists' : 'Customer does not exist'
        };
    } catch (error) {
        console.error('Error in checkCustomerExists service:', error);
        return {
            success: false,
            exists: false,
            message: 'Error checking customer existence'
        };
    }
}