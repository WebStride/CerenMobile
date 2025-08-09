import { Response } from 'express';
import { RequestWithUser } from '../types/express';
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
