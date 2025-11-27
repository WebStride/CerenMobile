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
exports.placeOrder = placeOrder;
const placeOrder_1 = require("../../service/orders/placeOrder");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function placeOrder(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
                return res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
            }
            const { customerId, customerName, orderItems } = req.body;
            // Validate request
            if (!customerId || !customerName || !orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: customerId, customerName, and orderItems are required',
                });
            }
            // Validate order items
            for (const item of orderItems) {
                if (!item.productId || !item.productName || !item.quantity || !item.price) {
                    return res.status(400).json({
                        success: false,
                        error: 'Each order item must have productId, productName, quantity, and price',
                    });
                }
            }
            console.log('📦 Processing place order request:', {
                userId: req.user.userId,
                customerId,
                customerName,
                itemCount: orderItems.length,
            });
            // Place order via external API
            const result = yield (0, placeOrder_1.placeOrderViaExternalApi)(customerId, customerName, orderItems);
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: result.message || 'Failed to place order',
                });
            }
            // Optional: Clear cart after successful order
            // You can uncomment this if you want to auto-clear cart
            // try {
            //     await prisma.cart.deleteMany({
            //         where: { CustomerID: customerId }
            //     });
            //     console.log('🗑️ Cart cleared after successful order');
            // } catch (cartError) {
            //     console.warn('⚠️ Failed to clear cart after order:', cartError);
            // }
            res.json({
                success: true,
                message: 'Order placed successfully',
                data: result.data,
            });
        }
        catch (error) {
            console.error('❌ Error in placeOrder controller:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to place order',
                details: error.message,
            });
        }
    });
}
