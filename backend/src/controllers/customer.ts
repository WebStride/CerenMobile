
import { Response } from 'express';
import { RequestWithUser } from '../types/express';
import { getStoresForUser } from '../services/customer';

import { checkCustomerExists } from '../services/customer';

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
export async function getStores(req: RequestWithUser, res: Response) {
  try {
    const payload = req.user;
    if (!payload || typeof payload.userId !== 'number') {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userId = payload.userId;
    const result = await getStoresForUser(userId);
    if (!result.success) {
      return res.status(500).json({ success: false, message: result.message || 'Failed to fetch stores' });
    }

    return res.json({ success: true, stores: result.stores });
  } catch (error: any) {
    console.error('Error in getStores controller:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

