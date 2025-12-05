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
// Helper function to safely convert BigInt and Date to serializable format for JSON
const serializeForJson = (value) => {
    if (value === null || value === undefined)
        return value;
    // Handle BigInt - convert to number if safe, otherwise to string
    if (typeof value === 'bigint') {
        return Number(value) <= Number.MAX_SAFE_INTEGER ? Number(value) : String(value);
    }
    // Handle Date objects - convert to ISO string
    if (value instanceof Date) {
        return value.toISOString();
    }
    // Handle arrays recursively
    if (Array.isArray(value)) {
        return value.map(serializeForJson);
    }
    // Handle objects recursively
    if (typeof value === 'object' && value !== null) {
        const result = {};
        for (const key in value) {
            result[key] = serializeForJson(value[key]);
        }
        return result;
    }
    return value;
};
function getOrdersByCustomerId(customerId, status) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🔍 Querying orders for CustomerID:', customerId, 'status:', status || 'all');
            const whereClause = { CustomerID: customerId };
            if (status) {
                // Use case-insensitive equality where supported to tolerate case differences
                whereClause.OrderStatus = { equals: status, mode: 'insensitive' };
            }
            const orders = yield prisma.orders.findMany({
                where: whereClause,
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
            // Convert BigInt and Date values to serializable format
            const serializedOrders = serializeForJson(orders);
            return {
                success: true,
                orders: serializedOrders
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
            console.log('🔍 [getOrderItemsByOrderId] START - OrderID:', orderId);
            const orderItems = yield prisma.orderItems.findMany({
                where: { OrderID: orderId }
            });
            console.log('📊 [getOrderItemsByOrderId] Found order items count:', orderItems.length);
            console.log('📊 [getOrderItemsByOrderId] Raw order items:', JSON.stringify(orderItems, (key, value) => typeof value === 'bigint' ? value.toString() : value));
            // Get product names from ProductMaster table
            const productIds = orderItems.map(item => item.ProductID).filter((id) => id !== null);
            console.log('🆔 [getOrderItemsByOrderId] Product IDs to lookup:', productIds);
            let productNameMap = new Map();
            if (productIds.length > 0) {
                const products = yield prisma.productMaster.findMany({
                    where: { ProductID: { in: productIds } },
                    select: { ProductID: true, ProductName: true, DisplayName: true }
                });
                console.log('📦 [getOrderItemsByOrderId] Products found from ProductMaster:', JSON.stringify(products));
                products.forEach(p => {
                    const name = p.DisplayName || p.ProductName || `Product #${p.ProductID}`;
                    console.log(`📝 [getOrderItemsByOrderId] Mapping ProductID ${p.ProductID} -> "${name}"`);
                    productNameMap.set(p.ProductID, name);
                });
            }
            else {
                console.log('⚠️ [getOrderItemsByOrderId] No valid ProductIDs found in order items');
            }
            // Enrich order items with product names
            const orderItemsWithNames = orderItems.map(item => {
                const productName = item.ProductID ? (productNameMap.get(item.ProductID) || `Product #${item.ProductID}`) : 'Unknown Product';
                console.log(`🏷️ [getOrderItemsByOrderId] OrderItemID ${item.OrderItemID}: ProductID=${item.ProductID} -> ProductName="${productName}"`);
                return Object.assign(Object.assign({}, item), { ProductName: productName });
            });
            // Convert BigInt and Date values to serializable format
            const serializedOrderItems = serializeForJson(orderItemsWithNames);
            console.log('✅ [getOrderItemsByOrderId] Final serialized order items:', JSON.stringify(serializedOrderItems));
            return {
                success: true,
                orderItems: serializedOrderItems
            };
        }
        catch (error) {
            console.error('❌ [getOrderItemsByOrderId] Error:', error);
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
            // Convert BigInt and Date values to serializable format
            const serializedInvoices = serializeForJson(invoices);
            return {
                success: true,
                invoices: serializedInvoices
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
            // Convert BigInt and Date values to serializable format
            const serializedInvoiceItems = serializeForJson(invoiceItems);
            return {
                success: true,
                invoiceItems: serializedInvoiceItems
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