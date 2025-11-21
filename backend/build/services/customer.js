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
exports.checkCustomerExists = checkCustomerExists;
exports.getStoresForUser = getStoresForUser;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function checkCustomerExists(phoneNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const customer = yield prisma.cUSTOMERMASTER.findFirst({
                where: { PHONENO: phoneNumber },
            });
            return {
                success: true,
                exists: !!customer,
                message: customer ? 'Customer exists' : 'Customer does not exist'
            };
        }
        catch (error) {
            console.error('Error in checkCustomerExists service:', error);
            return {
                success: false,
                exists: false,
                message: 'Error checking customer existence'
            };
        }
    });
}
function getStoresForUser(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const stores = yield prisma.cUSTOMERMASTER.findMany({
                where: { USERID: userId },
                select: {
                    CUSTOMERID: true,
                    CUSTOMERNAME: true,
                    ADDRESS: true,
                    CITY: true,
                    PINCODE: true,
                },
            });
            return { success: true, stores };
        }
        catch (error) {
            console.error('Error in getStoresForUser service:', error);
            return { success: false, stores: [], message: 'Error fetching stores' };
        }
    });
}
