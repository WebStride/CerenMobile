import prisma from '../../lib/prisma';
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
    if (!phoneNumber) return '';
    
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // If it's a 10-digit Indian number, add +91
    if (cleaned.length === 10) {
        return `+91${cleaned}`;
    }

    // If it starts with country code 91, ensure it has + prefix
    if (cleaned.startsWith('91') && cleaned.length === 12) {
        return `+${cleaned}`;
    }

    // If we couldn't parse it, return the cleaned digits with +91 prefix as fallback
    // This handles cases where input is already formatted or has unexpected format
    return `+91${cleaned}`;
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
export async function saveUserAndGenerateTokens(name: string | undefined, phoneNumber: string) {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    const normalizedName = typeof name === 'string' ? name.trim() : '';

    const user = await prisma.uSERCUSTOMERMASTER.upsert({
        where: { phoneNumber: formattedPhone },
        update: normalizedName ? { name: normalizedName } : {},
        create: {
            name: normalizedName || `User ${formattedPhone.slice(-4)}`,
            phoneNumber: formattedPhone
        }
    });

    const tokens = generateTokens({
        userId: user.id,
        phoneNumber: user.phoneNumber || formattedPhone
    });

    return { user, tokens };
}


export async function checkCustomerExists(phoneNumber: string) {
    try {
        // Normalize phone number format to ensure consistent lookup
        const formattedPhone = formatPhoneNumber(phoneNumber);
        // Also prepare unformatted version (without +91) for fallback search
        const unformattedPhone = formattedPhone.replace(/^\+91/, '');
        
        console.log('📱 checkCustomerExists - Input:', phoneNumber);
        console.log('📱 Searching for:', formattedPhone, 'or', unformattedPhone);

        // Search for user with either format (handles inconsistent DB data)
        const user = await prisma.uSERCUSTOMERMASTER.findFirst({
            where: {
                OR: [
                    { phoneNumber: formattedPhone },
                    { phoneNumber: unformattedPhone }
                ]
            },
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