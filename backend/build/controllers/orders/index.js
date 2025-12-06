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
exports.getInvoicesByCustomer = getInvoicesByCustomer;
exports.getOrdersByCustomer = getOrdersByCustomer;
exports.getOrderItemsByOrder = getOrderItemsByOrder;
exports.getInvoiceItemsByInvoice = getInvoiceItemsByInvoice;
const orders_1 = require("../../service/orders");
function getInvoicesByCustomer(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const queryCustomerId = req.query.customerid;
            let customerId;
            if (queryCustomerId) {
                customerId = parseInt(queryCustomerId);
                console.log('🔍 Using query customerId for invoices:', customerId);
            }
            else {
                if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
                    return res.status(401).json({ error: 'User not authenticated' });
                }
                customerId = parseInt(req.user.userId);
                console.log('🔍 Using JWT customerId for invoices:', customerId);
            }
            const result = yield (0, orders_1.getInvoicesByCustomerId)(customerId);
            if (!result.success) {
                return res.status(500).json({ error: 'Failed to fetch invoices', details: result.message });
            }
            res.json({ success: true, invoices: result.invoices });
        }
        catch (error) {
            console.error('Error fetching invoices:', error);
            res.status(500).json({ error: 'Failed to fetch invoices', details: error.message });
        }
    });
}
function getOrdersByCustomer(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            // Allow customerid query parameter for testing, otherwise use JWT
            const queryCustomerId = req.query.customerid;
            let customerId;
            if (queryCustomerId) {
                customerId = parseInt(queryCustomerId);
                console.log('🔍 Using query customerId:', customerId);
            }
            else {
                if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
                    return res.status(401).json({ error: 'User not authenticated' });
                }
                customerId = parseInt(req.user.userId);
                console.log('🔍 Using JWT customerId:', customerId);
            }
            const result = yield (0, orders_1.getOrdersByCustomerId)(customerId);
            console.log('📊 Orders result:', result);
            if (!result.success) {
                return res.status(500).json({
                    error: 'Failed to fetch orders',
                    details: result.message
                });
            }
            res.json({
                success: true,
                orders: result.orders
            });
        }
        catch (error) {
            console.error('Error fetching orders:', error);
            res.status(500).json({
                error: 'Failed to fetch orders',
                details: error.message
            });
        }
    });
}
function getOrderItemsByOrder(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const orderId = parseInt(req.params.orderId);
            if (isNaN(orderId)) {
                return res.status(400).json({ error: 'Invalid orderId' });
            }
            console.log('🔍 Fetching order items for OrderID:', orderId);
            const result = yield (0, orders_1.getOrderItemsByOrderId)(orderId);
            if (!result.success) {
                return res.status(500).json({
                    error: 'Failed to fetch order items',
                    details: result.message
                });
            }
            res.json({
                success: true,
                orderItems: result.orderItems
            });
        }
        catch (error) {
            console.error('Error fetching order items:', error);
            res.status(500).json({
                error: 'Failed to fetch order items',
                details: error.message
            });
        }
    });
}
function getInvoiceItemsByInvoice(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const invoiceId = parseInt(req.params.invoiceId);
            if (isNaN(invoiceId)) {
                return res.status(400).json({ error: 'Invalid invoiceId' });
            }
            console.log('🔍 Fetching invoice items for InvoiceID:', invoiceId);
            const result = yield (0, orders_1.getInvoiceItemsByInvoiceId)(invoiceId);
            if (!result.success) {
                return res.status(500).json({
                    error: 'Failed to fetch invoice items',
                    details: result.message
                });
            }
            res.json({
                success: true,
                invoiceItems: result.invoiceItems
            });
        }
        catch (error) {
            console.error('Error fetching invoice items:', error);
            res.status(500).json({
                error: 'Failed to fetch invoice items',
                details: error.message
            });
        }
    });
}
//# sourceMappingURL=index.js.map