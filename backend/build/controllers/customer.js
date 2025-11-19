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
exports.checkCustomer = checkCustomer;
exports.getStores = getStores;
const customer_1 = require("../services/customer");
function checkCustomer(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const tokenPayload = req.user;
            if (!tokenPayload || !tokenPayload.phoneNumber) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number not found in token'
                });
            }
            const result = yield (0, customer_1.checkCustomerExists)(tokenPayload.phoneNumber);
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
            return res.status(200).json({
                success: result.exists, // true if customer exists, false if not
                message: result.message,
                exists: result.exists
            });
        }
        catch (error) {
            console.error('Error in checkCustomer controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    });
}
function getStores(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const payload = req.user;
            if (!payload || typeof payload.userId !== 'number') {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const userId = payload.userId;
            const result = yield (0, customer_1.getStoresForUser)(userId);
            if (!result.success) {
                return res.status(500).json({ success: false, message: result.message || 'Failed to fetch stores' });
            }
            return res.json({ success: true, stores: result.stores });
        }
        catch (error) {
            console.error('Error in getStores controller:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });
}
