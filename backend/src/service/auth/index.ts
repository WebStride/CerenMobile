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

// Utility function to format phone number to E.164 format
function formatPhoneNumber(phoneNumber: string): string {
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

export async function sendOTP(phoneNumber: string) {
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
    const verification = await client.verify.v2.services(verifyServiceSid)
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
  } catch (error: any) {
    console.error('❌ Error in sendOTP:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error code:', error.code);
    throw new Error(`Failed to send OTP: ${error.message}`);
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

    console.log('=== VERIFY OTP DEBUG ===');
    console.log('Input phone number:', phoneNumber);
    console.log('Input code:', code);
    console.log('Service SID:', verifyServiceSid);

    try {
        const formattedPhone = formatPhoneNumber(phoneNumber);
        console.log('📱 Formatted phone number:', formattedPhone);
        console.log('📱 Original phone number:', phoneNumber);

        console.log('🔍 Attempting verification check...');
        const verificationCheck = await client.verify.v2.services(verifyServiceSid)
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
    } catch (error: any) {
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
}export async function saveUserAndGenerateTokens(name: string, phoneNumber: string) {
    console.log("🔧 Creating/updating user:", { name, phoneNumber });

    // Check if user already exists
    let user = await prisma.cUSTOMERMASTER.findFirst({
        where: { PHONENO: phoneNumber }
    });

    if (user) {
        // Update existing user
        user = await prisma.cUSTOMERMASTER.update({
            where: { CUSTOMERID: user.CUSTOMERID },
            data: { CUSTOMERNAME: name }
        });
        console.log("✅ User updated:", user);
    } else {
        // Create new user
        user = await prisma.cUSTOMERMASTER.create({
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