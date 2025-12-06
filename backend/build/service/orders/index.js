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
exports.getOrdersByCustomerId = getOrdersByCustomerId;
exports.getOrderItemsByOrderId = getOrderItemsByOrderId;
exports.getInvoicesByCustomerId = getInvoicesByCustomerId;
exports.getInvoiceItemsByInvoiceId = getInvoiceItemsByInvoiceId;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function getOrdersByCustomerId(customerId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🔍 Querying orders for CustomerID:', customerId);
            const orders = yield prisma.orders.findMany({
                where: { CustomerID: customerId },
                orderBy: { OrderDate: 'desc' },
                select: {
                    OrderID: true,
                    OrderNumber: true,
                    OrderDate: true,
                    OrderItemCount: true,
                    EstimateOrderAmount: true,
                    OrderStatus: true,
                    DateDelivered: true,
                    DateInvoiceCreated: true,
                    CreationDate: true,
                    LastUpdatedDate: true
                }
            });
            console.log('📊 Found orders count:', orders.length);
            return {
                success: true,
                orders
            };
        }
        catch (error) {
            console.error('Error in getOrdersByCustomerId service:', error);
            return {
                success: false,
                orders: [],
                message: 'Error fetching orders'
            };
        }
    });
}
function getOrderItemsByOrderId(orderId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🔍 Querying order items for OrderID:', orderId);
            const orderItems = yield prisma.orderItems.findMany({
                where: { OrderID: orderId }
            });
            console.log('📊 Found order items count:', orderItems.length);
            return {
                success: true,
                orderItems
            };
        }
        catch (error) {
            console.error('Error in getOrderItemsByOrderId service:', error);
            return {
                success: false,
                orderItems: [],
                message: 'Error fetching order items'
            };
        }
    });
}
function getInvoicesByCustomerId(customerId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🔍 Querying invoices for CustomerID:', customerId);
            const invoices = yield prisma.invoices.findMany({
                where: { CustomerID: customerId },
                orderBy: { InvoiceDate: 'desc' }
            });
            console.log('📊 Found invoices count:', invoices.length);
            // Convert any BigInt fields (Prisma may return BigInt for large integer DB cols)
            const serializable = invoices.map(inv => (Object.assign(Object.assign({}, inv), { 
                // OrderID in your schema is BigInt - convert to number if safe, otherwise to string
                OrderID: typeof inv.OrderID === 'bigint' ? (Number(inv.OrderID) <= Number.MAX_SAFE_INTEGER ? Number(inv.OrderID) : String(inv.OrderID)) : inv.OrderID })));
            return {
                success: true,
                invoices: serializable
            };
        }
        catch (error) {
            console.error('Error in getInvoicesByCustomerId service:', error);
            return {
                success: false,
                invoices: [],
                message: 'Error fetching invoices'
            };
        }
    });
}
function getInvoiceItemsByInvoiceId(invoiceId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🔍 Querying invoice items for InvoiceID:', invoiceId);
            const invoiceItems = yield prisma.invoiceItems.findMany({
                where: { InvoiceID: invoiceId }
            });
            console.log('📊 Found invoice items count:', invoiceItems.length);
            return {
                success: true,
                invoiceItems
            };
        }
        catch (error) {
            console.error('Error in getInvoiceItemsByInvoiceId service:', error);
            return {
                success: false,
                invoiceItems: [],
                message: 'Error fetching invoice items'
            };
        }
    });
}
//# sourceMappingURL=index.js.map