import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret';

interface TokenPayload {
  userId: string;
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
