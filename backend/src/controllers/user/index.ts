import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth';
// import { sendUserDetailsToAdmin } from '../../service/notification'; // Disabled for now

const prisma = new PrismaClient();

export async function submitUserAddress(req: AuthRequest, res: Response) {
    const {
        name,
        phoneNumber,
        city,
        district,
        houseNumber,
        buildingBlock,
        pinCode,
        landmark,
        saveAs,
        isDefault = false
    } = req.body;

    // Validate required fields
    if (!phoneNumber  || !houseNumber || !buildingBlock || !pinCode) {
        return res.status(400).json({
            error: 'Missing required fields',
            fields: ['phoneNumber', 'city', 'district', 'houseNumber', 'buildingBlock', 'pinCode']
        });
    }

    try {
        // Get the authenticated user's ID
        const authenticatedUserId = req.user?.userId;
        if (!authenticatedUserId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Check if user exists in CustomerMaster
        const existingUser = await prisma.cUSTOMERMASTER.findFirst({
            where: { PHONENO: phoneNumber }
        });



        // If setting as default, unset all other defaults first
        if (isDefault) {
            await prisma.deliveryAddress.updateMany({
                where: { UserID: parseInt(authenticatedUserId) },
                data: { IsDefault: false }
            });
        }

        // Always create a new address
        const deliveryAddress = await prisma.deliveryAddress.create({
            data: {
                UserID: parseInt(authenticatedUserId),
                HouseNumber: houseNumber,
                BuildingBlock: buildingBlock,
                PinCode: pinCode,
                Landmark: landmark,
                City: city,
                District: district,
                SaveAs: saveAs || 'home',
                IsDefault: isDefault,
                Active: true,
                UpdatedAt: new Date()
            }
        });

        // Combine address components and save to UserCustomerMaster
        const addressParts = [
            houseNumber,
            buildingBlock,
            landmark || null,
            city,
            district,
            pinCode
        ].filter(part => part); // Remove null/undefined values
        
        const combinedAddress = addressParts.join(', ');
        
        // Update USERCUSTOMERMASTER with combined address (max 255 chars)
        try {
            const truncatedAddress = combinedAddress.length > 255 
                ? combinedAddress.substring(0, 252) + '...' 
                : combinedAddress;
                
            await prisma.uSERCUSTOMERMASTER.update({
                where: { id: parseInt(authenticatedUserId) },
                data: { address: truncatedAddress }
            });
            
            if (combinedAddress.length > 255) {
                console.warn(`Address truncated for user ${authenticatedUserId}: ${combinedAddress.length} chars`);
            }
        } catch (addressUpdateError: any) {
            // Log error but don't fail the request since DeliveryAddress save succeeded
            console.error('Failed to update UserCustomerMaster address:', addressUpdateError);
        }

        return res.json({
            success: true,
            message: isDefault ? 'Address saved and set as default' : 'Address saved successfully',
            address: deliveryAddress
        });

    } catch (error: any) {
        console.error('Error in submitUserAddress:', error);
        return res.status(500).json({
            error: 'Failed to process address submission',
            details: error.message
        });
    }
}

// Get all addresses for authenticated user
export async function getUserAddresses(req: AuthRequest, res: Response) {
    try {
        const authenticatedUserId = req.user?.userId;
        if (!authenticatedUserId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const addresses = await prisma.deliveryAddress.findMany({
            where: {
                UserID: parseInt(authenticatedUserId),
                Active: true
            },
            orderBy: [
                { IsDefault: 'desc' }, // Default address first
                { CreatedAt: 'desc' }  // Then by creation date
            ]
        });

        res.json({
            success: true,
            addresses
        });
    } catch (error: any) {
        console.error('Error fetching user addresses:', error);
        res.status(500).json({
            error: 'Failed to fetch addresses',
            details: error.message
        });
    }
}

// Set address as default for authenticated user
export async function setDefaultAddress(req: AuthRequest, res: Response) {
    try {
        const authenticatedUserId = req.user?.userId;
        if (!authenticatedUserId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const addressId = parseInt(req.params.addressId);
        if (isNaN(addressId)) {
            return res.status(400).json({ error: 'Invalid address ID' });
        }

        // First, unset all default addresses for this user
        await prisma.deliveryAddress.updateMany({
            where: { UserID: parseInt(authenticatedUserId) },
            data: { IsDefault: false }
        });

        // Then set the selected address as default
        const updatedAddress = await prisma.deliveryAddress.update({
            where: {
                DeliveryAddressID: addressId,
                UserID: parseInt(authenticatedUserId) // Ensure user owns this address
            },
            data: { IsDefault: true }
        });

        res.json({
            success: true,
            message: 'Default address updated successfully',
            address: updatedAddress
        });
    } catch (error: any) {
        console.error('Error setting default address:', error);
        res.status(500).json({
            error: 'Failed to set default address',
            details: error.message
        });
    }
}

// Get current default address for authenticated user
export async function getDefaultAddress(req: AuthRequest, res: Response) {
    try {
        const authenticatedUserId = req.user?.userId;
        if (!authenticatedUserId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const defaultAddress = await prisma.deliveryAddress.findFirst({
            where: {
                UserID: parseInt(authenticatedUserId),
                IsDefault: true,
                Active: true
            }
        });

        if (!defaultAddress) {
            return res.json({
                success: true,
                address: null,
                message: 'No default address set'
            });
        }

        res.json({
            success: true,
            address: defaultAddress
        });
    } catch (error: any) {
        console.error('Error fetching default address:', error);
        res.status(500).json({
            error: 'Failed to fetch default address',
            details: error.message
        });
    }
}

// Update user address
export async function updateUserAddress(req: AuthRequest, res: Response) {
    const { addressId } = req.params;
    const {
        name,
        phoneNumber,
        city,
        district,
        houseNumber,
        buildingBlock,
        pinCode,
        landmark,
        saveAs,
        isDefault = false
    } = req.body;

    // Validate required fields
    if (!phoneNumber || !city || !district || !houseNumber || !buildingBlock || !pinCode) {
        return res.status(400).json({
            error: 'Missing required fields',
            fields: ['phoneNumber', 'city', 'district', 'houseNumber', 'buildingBlock', 'pinCode']
        });
    }

    try {
        // Get the authenticated user's ID
        const authenticatedUserId = req.user?.userId;
        if (!authenticatedUserId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Check if address exists and belongs to user
        const existingAddress = await prisma.deliveryAddress.findFirst({
            where: {
                DeliveryAddressID: parseInt(addressId),
                UserID: parseInt(authenticatedUserId),
                Active: true
            }
        });

        if (!existingAddress) {
            return res.status(404).json({ error: 'Address not found' });
        }

        // If setting as default, unset all other defaults first
        if (isDefault) {
            await prisma.deliveryAddress.updateMany({
                where: { UserID: parseInt(authenticatedUserId) },
                data: { IsDefault: false }
            });
        }

        // Update the address
        const updatedAddress = await prisma.deliveryAddress.update({
            where: { DeliveryAddressID: parseInt(addressId) },
            data: {
                HouseNumber: houseNumber,
                BuildingBlock: buildingBlock,
                PinCode: pinCode,
                Landmark: landmark,
                City: city,
                District: district,
                SaveAs: saveAs,
                IsDefault: isDefault,
                UpdatedAt: new Date()
            }
        });

        // Combine address components and save to UserCustomerMaster
        const addressParts = [
            houseNumber,
            buildingBlock,
            landmark || null,
            city,
            district,
            pinCode
        ].filter(part => part); // Remove null/undefined values
        
        const combinedAddress = addressParts.join(', ');
        
        // Update USERCUSTOMERMASTER with combined address (max 255 chars)
        try {
            const truncatedAddress = combinedAddress.length > 255 
                ? combinedAddress.substring(0, 252) + '...' 
                : combinedAddress;
                
            await prisma.uSERCUSTOMERMASTER.update({
                where: { id: parseInt(authenticatedUserId) },
                data: { address: truncatedAddress }
            });
            
            if (combinedAddress.length > 255) {
                console.warn(`Address truncated for user ${authenticatedUserId}: ${combinedAddress.length} chars`);
            }
        } catch (addressUpdateError: any) {
            // Log error but don't fail the request since DeliveryAddress update succeeded
            console.error('Failed to update UserCustomerMaster address:', addressUpdateError);
        }

        res.json({
            success: true,
            address: updatedAddress,
            message: 'Address updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating address:', error);
        res.status(500).json({
            error: 'Failed to update address',
            details: error.message
        });
    }
}

// Delete user address
export async function deleteUserAddress(req: AuthRequest, res: Response) {
    const { addressId } = req.params;

    try {
        // Get the authenticated user's ID
        const authenticatedUserId = req.user?.userId;
        if (!authenticatedUserId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Check if address exists and belongs to user
        const existingAddress = await prisma.deliveryAddress.findFirst({
            where: {
                DeliveryAddressID: parseInt(addressId),
                UserID: parseInt(authenticatedUserId),
                Active: true
            }
        });

        if (!existingAddress) {
            return res.status(404).json({ error: 'Address not found' });
        }

        // Soft delete the address
        await prisma.deliveryAddress.update({
            where: { DeliveryAddressID: parseInt(addressId) },
            data: {
                Active: false,
                UpdatedAt: new Date()
            }
        });

        res.json({
            success: true,
            message: 'Address deleted successfully'
        });
    } catch (error: any) {
        console.error('Error deleting address:', error);
        res.status(500).json({
            error: 'Failed to delete address',
            details: error.message
        });
    }
}

// Get USERCUSTOMERMASTER address for authenticated user
export async function getUserMasterAddress(req: AuthRequest, res: Response) {
    try {
        const authenticatedUserId = req.user?.userId;
        if (!authenticatedUserId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const userMaster = await prisma.uSERCUSTOMERMASTER.findUnique({
            where: { id: parseInt(authenticatedUserId) },
            select: {
                address: true,
                name: true,
                phoneNumber: true
            }
        });

        if (!userMaster) {
            return res.status(404).json({ 
                success: false,
                error: 'User not found' 
            });
        }

        res.json({
            success: true,
            address: userMaster.address || null,
            name: userMaster.name,
            phoneNumber: userMaster.phoneNumber
        });
    } catch (error: any) {
        console.error('Error fetching user master address:', error);
        res.status(500).json({
            error: 'Failed to fetch user master address',
            details: error.message
        });
    }
}
