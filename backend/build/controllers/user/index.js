"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitUserAddress = submitUserAddress;
exports.getUserAddresses = getUserAddresses;
exports.setDefaultAddress = setDefaultAddress;
exports.getDefaultAddress = getDefaultAddress;
exports.updateUserAddress = updateUserAddress;
exports.deleteUserAddress = deleteUserAddress;
exports.getUserMasterAddress = getUserMasterAddress;
const client_1 = require("@prisma/client");
// import { sendUserDetailsToAdmin } from '../../service/notification'; // Disabled for now
const prisma = new client_1.PrismaClient();
function submitUserAddress(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { name, phoneNumber, city, district, houseNumber, buildingBlock, pinCode, landmark, saveAs, latitude, longitude, isDefault = false } = req.body;
        // Validate required fields
        if (!phoneNumber || !houseNumber || !buildingBlock || !pinCode) {
            return res.status(400).json({
                error: 'Missing required fields',
                fields: ['phoneNumber', 'city', 'district', 'houseNumber', 'buildingBlock', 'pinCode']
            });
        }
        try {
            // Get the authenticated user's ID
            const authenticatedUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!authenticatedUserId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            // Check if user exists in CustomerMaster
            const existingUser = yield prisma.cUSTOMERMASTER.findFirst({
                where: { PHONENO: phoneNumber }
            });
            // If setting as default, unset all other defaults first
            if (isDefault) {
                yield prisma.deliveryAddress.updateMany({
                    where: { UserID: parseInt(authenticatedUserId) },
                    data: { IsDefault: false }
                });
            }
            // Always create a new address
            const deliveryAddress = yield prisma.deliveryAddress.create({
                data: {
                    UserID: parseInt(authenticatedUserId),
                    Name: name,
                    PhoneNumber: phoneNumber,
                    HouseNumber: houseNumber,
                    BuildingBlock: buildingBlock,
                    PinCode: pinCode,
                    Landmark: landmark,
                    City: city,
                    District: district,
                    SaveAs: saveAs || 'home',
                    Latitude: latitude,
                    Longitude: longitude,
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
                yield prisma.uSERCUSTOMERMASTER.update({
                    where: { id: parseInt(authenticatedUserId) },
                    data: { address: truncatedAddress }
                });
                if (combinedAddress.length > 255) {
                    console.warn(`Address truncated for user ${authenticatedUserId}: ${combinedAddress.length} chars`);
                }
            }
            catch (addressUpdateError) {
                // Log error but don't fail the request since DeliveryAddress save succeeded
                console.error('Failed to update UserCustomerMaster address:', addressUpdateError);
            }
            return res.json({
                success: true,
                message: isDefault ? 'Address saved and set as default' : 'Address saved successfully',
                address: deliveryAddress
            });
        }
        catch (error) {
            console.error('Error in submitUserAddress:', error);
            return res.status(500).json({
                error: 'Failed to process address submission',
                details: error.message
            });
        }
    });
}
// Get all addresses for authenticated user
function getUserAddresses(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const authenticatedUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!authenticatedUserId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const addresses = yield prisma.deliveryAddress.findMany({
                where: {
                    UserID: parseInt(authenticatedUserId),
                    Active: true
                },
                orderBy: [
                    { IsDefault: 'desc' }, // Default address first
                    { CreatedAt: 'desc' } // Then by creation date
                ]
            });
            res.json({
                success: true,
                addresses
            });
        }
        catch (error) {
            console.error('Error fetching user addresses:', error);
            res.status(500).json({
                error: 'Failed to fetch addresses',
                details: error.message
            });
        }
    });
}
// Set address as default for authenticated user
function setDefaultAddress(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const authenticatedUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!authenticatedUserId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const addressId = parseInt(req.params.addressId);
            if (isNaN(addressId)) {
                return res.status(400).json({ error: 'Invalid address ID' });
            }
            // First, unset all default addresses for this user
            yield prisma.deliveryAddress.updateMany({
                where: { UserID: parseInt(authenticatedUserId) },
                data: { IsDefault: false }
            });
            // Then set the selected address as default
            const updatedAddress = yield prisma.deliveryAddress.update({
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
        }
        catch (error) {
            console.error('Error setting default address:', error);
            res.status(500).json({
                error: 'Failed to set default address',
                details: error.message
            });
        }
    });
}
// Get current default address for authenticated user
function getDefaultAddress(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const authenticatedUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!authenticatedUserId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const defaultAddress = yield prisma.deliveryAddress.findFirst({
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
        }
        catch (error) {
            console.error('Error fetching default address:', error);
            res.status(500).json({
                error: 'Failed to fetch default address',
                details: error.message
            });
        }
    });
}
// Update user address
function updateUserAddress(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { addressId } = req.params;
        const { name, phoneNumber, city, district, houseNumber, buildingBlock, pinCode, landmark, saveAs, latitude, longitude, isDefault = false } = req.body;
        // Validate required fields
        if (!phoneNumber || !city || !district || !houseNumber || !buildingBlock || !pinCode) {
            return res.status(400).json({
                error: 'Missing required fields',
                fields: ['phoneNumber', 'city', 'district', 'houseNumber', 'buildingBlock', 'pinCode']
            });
        }
        try {
            // Get the authenticated user's ID
            const authenticatedUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!authenticatedUserId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            // Check if address exists and belongs to user
            const existingAddress = yield prisma.deliveryAddress.findFirst({
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
                yield prisma.deliveryAddress.updateMany({
                    where: { UserID: parseInt(authenticatedUserId) },
                    data: { IsDefault: false }
                });
            }
            // Update the address
            const updatedAddress = yield prisma.deliveryAddress.update({
                where: { DeliveryAddressID: parseInt(addressId) },
                data: {
                    Name: name,
                    PhoneNumber: phoneNumber,
                    HouseNumber: houseNumber,
                    BuildingBlock: buildingBlock,
                    PinCode: pinCode,
                    Landmark: landmark,
                    City: city,
                    District: district,
                    SaveAs: saveAs,
                    Latitude: latitude,
                    Longitude: longitude,
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
                yield prisma.uSERCUSTOMERMASTER.update({
                    where: { id: parseInt(authenticatedUserId) },
                    data: { address: truncatedAddress }
                });
                if (combinedAddress.length > 255) {
                    console.warn(`Address truncated for user ${authenticatedUserId}: ${combinedAddress.length} chars`);
                }
            }
            catch (addressUpdateError) {
                // Log error but don't fail the request since DeliveryAddress update succeeded
                console.error('Failed to update UserCustomerMaster address:', addressUpdateError);
            }
            res.json({
                success: true,
                address: updatedAddress,
                message: 'Address updated successfully'
            });
        }
        catch (error) {
            console.error('Error updating address:', error);
            res.status(500).json({
                error: 'Failed to update address',
                details: error.message
            });
        }
    });
}
// Delete user address
function deleteUserAddress(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { addressId } = req.params;
        try {
            // Get the authenticated user's ID
            const authenticatedUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!authenticatedUserId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            // Check if address exists and belongs to user
            const existingAddress = yield prisma.deliveryAddress.findFirst({
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
            yield prisma.deliveryAddress.update({
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
        }
        catch (error) {
            console.error('Error deleting address:', error);
            res.status(500).json({
                error: 'Failed to delete address',
                details: error.message
            });
        }
    });
}
// Get USERCUSTOMERMASTER address for authenticated user
function getUserMasterAddress(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const authenticatedUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!authenticatedUserId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const userMaster = yield prisma.uSERCUSTOMERMASTER.findUnique({
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
        }
        catch (error) {
            console.error('Error fetching user master address:', error);
            res.status(500).json({
                error: 'Failed to fetch user master address',
                details: error.message
            });
        }
    });
}
//# sourceMappingURL=index.js.map