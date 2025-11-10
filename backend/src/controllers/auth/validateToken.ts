import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret';

interface TokenPayload {
  userId: number;
  phoneNumber: string;
}

function generateAccessToken(payload: TokenPayload) {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}

export const validateToken = async (req: Request, res: Response) => {
  const accessToken = req.headers.authorization?.split(' ')[1];
  const refreshToken = req.headers['x-refresh-token'] as string;

  if (!accessToken) {
    return res.status(401).json({ 
      isValid: false,
      error: 'Access token is required' 
    });
  }

  try {
    // First, try to verify the access token
    const decoded = jwt.verify(accessToken, ACCESS_TOKEN_SECRET) as TokenPayload;
    
    // Verify that the user still exists in the database
    const user = await prisma.uSERCUSTOMERMASTER.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user) {
      console.log('[validateToken] User not found in DB for userId:', decoded.userId);
      return res.status(401).json({ 
        isValid: false,
        error: 'User no longer exists',
        code: 'USER_NOT_FOUND'
      });
    }
    
    return res.status(200).json({ 
      isValid: true, 
      user: decoded 
    });
  } catch (error) {
    // If access token is expired and refresh token is provided
    if (error instanceof jwt.TokenExpiredError && refreshToken) {
      try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as TokenPayload;
        
        // Verify that the user still exists in the database
        const user = await prisma.uSERCUSTOMERMASTER.findUnique({
          where: { id: decoded.userId }
        });
        
        if (!user) {
          console.log('[validateToken] User not found in DB for userId:', decoded.userId);
          return res.status(401).json({
            isValid: false,
            error: 'User no longer exists',
            code: 'USER_NOT_FOUND'
          });
        }
        
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
      } catch (refreshError) {
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
};
