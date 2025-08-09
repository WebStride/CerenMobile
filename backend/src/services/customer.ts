import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
