import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    phoneNumber: string;
  };
}

interface TokenPayload {
  userId: string;
  phoneNumber: string;
}

function generateAccessToken(payload: TokenPayload) {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}


export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const accessToken = authHeader && authHeader.split(' ')[1];
  const refreshToken = req.headers['x-refresh-token'] as string;

  if (!accessToken) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // First, try to verify the access token
    const decoded = jwt.verify(accessToken, ACCESS_TOKEN_SECRET) as TokenPayload;
    req.user = decoded;
    next();
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

        // Set the new access token in response header
        res.setHeader('X-New-Access-Token', newAccessToken);
        
        // Continue with the request
        req.user = decoded;
        next();
      } catch (refreshError) {
        // If refresh token is also invalid, require re-authentication
        return res.status(401).json({ 
          error: 'Session expired', 
          code: 'SESSION_EXPIRED'
        });
      }
    } else {
      return res.status(403).json({ error: 'Invalid access token' });
    }
  }
}