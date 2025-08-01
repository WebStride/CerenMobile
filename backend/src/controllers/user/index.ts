import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendUserDetailsToAdmin } from '../../service/notification';

const prisma = new PrismaClient();

export async function submitUserAddress(req: Request, res: Response) {
    const {
        name,
        phoneNumber,
        city,
        district,
        houseNumber,
        buildingBlock,
        pinCode,
        landmark
    } = req.body;

    // Validate required fields
    if (!phoneNumber) {
        return res.status(400).json({
            error: 'Missing required fields',
            fields: ['phoneNumber', 'name', 'city', 'district', 'houseNumber', 'buildingBlock', 'pinCode']
        });
    }

    try {
        // Check if user exists in CustomerMaster
        const existingUser = await prisma.cUSTOMERMASTER.findFirst({
            where: { PHONENO: phoneNumber }
        });

        // If user doesn't exist, send WhatsApp message to admin
        if (!existingUser) {
            await sendUserDetailsToAdmin({
                name,
                phoneNumber,
                city,
                district,
                houseNumber,
                buildingBlock,
                pinCode,
                landmark
            });

            return res.json({
                success: true,
                message: 'User details sent to admin for verification'
            });
        }

        // If user exists, update their address details
        const updatedUser = await prisma.uSERCUSTOMERMASTER.update({
            where: { phoneNumber },
            data: {
                address: `${houseNumber}, ${buildingBlock}, ${landmark || ''}, ${city}, ${district}, ${pinCode}`.trim()
            }
        });

        return res.json({
            success: true,
            message: 'Address updated successfully',
            user: updatedUser
        });

    } catch (error: any) {
        console.error('Error in submitUserAddress:', error);
        return res.status(500).json({
            error: 'Failed to process address submission',
            details: error.message
        });
    }
}
