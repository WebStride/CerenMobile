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
const client_1 = require("@prisma/client");
const notification_1 = require("../../service/notification");
const prisma = new client_1.PrismaClient();
function submitUserAddress(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { name, phoneNumber, city, district, houseNumber, buildingBlock, pinCode, landmark } = req.body;
        // Validate required fields
        if (!phoneNumber) {
            return res.status(400).json({
                error: 'Missing required fields',
                fields: ['phoneNumber', 'name', 'city', 'district', 'houseNumber', 'buildingBlock', 'pinCode']
            });
        }
        try {
            // Check if user exists in CustomerMaster
            const existingUser = yield prisma.cUSTOMERMASTER.findFirst({
                where: { PHONENO: phoneNumber }
            });
            // If user doesn't exist, send WhatsApp message to admin
            if (!existingUser) {
                yield (0, notification_1.sendUserDetailsToAdmin)({
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
            const updatedUser = yield prisma.uSERCUSTOMERMASTER.update({
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
