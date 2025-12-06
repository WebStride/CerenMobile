import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import dotenv from 'dotenv';

dotenv.config();
import jwt from 'jsonwebtoken';
import { sendOtpToPhone, verifyOtp as verifyOtpMsg91 } from '../sms/msg91';



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
  console.log('=== SEND OTP DEBUG ===');
  console.log('Input phone number:', phoneNumber);

  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    console.log('📱 Formatted phone number:', formattedPhone);
    console.log('📱 Original phone number:', phoneNumber);

    console.log('📤 Sending verification via MSG91...');
    const result = await sendOtpToPhone(formattedPhone);

    if (result.success) {
      console.log('✅ Verification sent successfully');
      console.log('📊 Verification details:', {
        requestId: result.requestId,
        message: result.message
      });
      return { status: 'pending', to: formattedPhone, requestId: result.requestId };
    } else {
      throw new Error(result.message || 'Failed to send OTP');
    }
  } catch (error: any) {
    console.error('❌ Error in sendOTP:', error);
    console.error('❌ Error message:', error.message);
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
    console.log('=== VERIFY OTP DEBUG ===');
    console.log('Input phone number:', phoneNumber);
    console.log('Input code:', code);

    try {
        const formattedPhone = formatPhoneNumber(phoneNumber);
        console.log('📱 Formatted phone number:', formattedPhone);
        console.log('📱 Original phone number:', phoneNumber);

        console.log('🔍 Attempting verification via MSG91...');
        const result = await verifyOtpMsg91(formattedPhone, code);

        console.log('✅ Verification check completed');
        console.log('📊 Verification result:', {
            success: result.success,
            message: result.message
        });

        console.log('🎯 Final result - Approved:', result.success);

        return result.success;
    } catch (error: any) {
        console.error('❌ Error in verifyOTP:', error);
        console.error('❌ Error message:', error.message);
        throw new Error(`Verification failed: ${error.message}`);
    }
}
export async function saveUserAndGenerateTokens(name: string, phoneNumber: string) {
    console.log("🔧 Creating/updating user (UserCustomerMaster):", { name, phoneNumber });

    // Check if user already exists in USERCUSTOMERMASTER
    let user = await prisma.uSERCUSTOMERMASTER.findFirst({
        where: { phoneNumber: phoneNumber }
    });

    if (user) {
        // Update existing user
        user = await prisma.uSERCUSTOMERMASTER.update({
            where: { id: user.id },
            data: { name }
        });
        console.log("✅ UserCustomer updated:", user);
    } else {
        // Create new user in USERCUSTOMERMASTER
        user = await prisma.uSERCUSTOMERMASTER.create({
            data: {
                name,
                phoneNumber,
            }
        });
        console.log("✅ UserCustomer created:", user);
    }

    // Generate tokens using the user table id (not the legacy CUSTOMERID)
    const tokens = generateTokens({
        userId: user.id,
        phoneNumber: user.phoneNumber || phoneNumber
    });

    console.log("🎫 Tokens generated for user (id):", user.id);

    return { user, tokens };
}


export async function checkCustomerExists(phoneNumber: string) {
    try {
        // First, check if a user record exists in USERCUSTOMERMASTER (new auth table)
        const user = await prisma.uSERCUSTOMERMASTER.findFirst({
            where: { phoneNumber: phoneNumber },
        });

        if (user) {
            // If a legacy CUSTOMERMASTER record has been linked to this user (via USERID), return that id too
            const customer = await prisma.cUSTOMERMASTER.findFirst({
                where: { USERID: user.id }
            });

            return {
                success: true,
                exists: true,
                message: 'User exists',
                userId: user.id,
                name: user.name || null,
                customerId: customer ? customer.CUSTOMERID : null
            };
        }

        // No user found in USERCUSTOMERMASTER — treat as new
        return {
            success: true,
            exists: false,
            message: 'Customer does not exist'
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