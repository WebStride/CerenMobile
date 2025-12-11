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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrdersByCustomerId = getOrdersByCustomerId;
exports.getOrderItemsByOrderId = getOrderItemsByOrderId;
exports.getInvoicesByCustomerId = getInvoicesByCustomerId;
exports.getInvoiceItemsByInvoiceId = getInvoiceItemsByInvoiceId;
exports.getInvoicesByCustomerAndDateRange = getInvoicesByCustomerAndDateRange;
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const prisma = new client_1.PrismaClient();
// External API URL for invoices
const EXTERNAL_API_URL = process.env.EXTERNAL_API_URL || 'http://3.109.147.219/test/api';
const EXTERNAL_INVOICE_API_URL = process.env.EXTERNAL_INVOICE_API_URL || 'http://3.109.147.219/test/api/Invoice/GetInvoicesForCustomer';
const EXTERNAL_API_USERNAME = process.env.EXTERNAL_API_USERNAME || 'testuser';
const EXTERNAL_API_PASSWORD = process.env.EXTERNAL_API_PASSWORD || 'testpassword';
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
            let productImageMap = new Map();
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
                // Fetch product images from ProductImages and ImageMaster tables
                const productImages = yield prisma.productImages.findMany({
                    where: { ProductID: { in: productIds } },
                    select: { ProductID: true, ImageID: true }
                });
                console.log('🖼️ [getOrderItemsByOrderId] Product images found:', JSON.stringify(productImages));
                if (productImages.length > 0) {
                    const imageIds = productImages.map(pi => pi.ImageID);
                    const images = yield prisma.imageMaster.findMany({
                        where: { ImageID: { in: imageIds } },
                        select: { ImageID: true, Url: true }
                    });
                    console.log('🎨 [getOrderItemsByOrderId] Images found from ImageMaster:', JSON.stringify(images));
                    const imageIdToUrlMap = new Map();
                    const imageBaseUrl = process.env.IMAGE_BASE_URL || 'https://cerenpune.com/';
                    images.forEach(img => {
                        if (img.Url) {
                            // Check if URL is already absolute
                            const imageUrl = img.Url.startsWith('http://') || img.Url.startsWith('https://')
                                ? img.Url
                                : `${imageBaseUrl}${img.Url}`;
                            imageIdToUrlMap.set(img.ImageID, imageUrl);
                        }
                    });
                    productImages.forEach(pi => {
                        const imageUrl = imageIdToUrlMap.get(pi.ImageID) || null;
                        productImageMap.set(pi.ProductID, imageUrl);
                        console.log(`🖼️ [getOrderItemsByOrderId] ProductID ${pi.ProductID} -> Image: ${imageUrl}`);
                    });
                }
            }
            else {
                console.log('⚠️ [getOrderItemsByOrderId] No valid ProductIDs found in order items');
            }
            // Enrich order items with product names and images
            const orderItemsWithNames = orderItems.map(item => {
                const productName = item.ProductID ? (productNameMap.get(item.ProductID) || `Product #${item.ProductID}`) : 'Unknown Product';
                const productImage = item.ProductID ? (productImageMap.get(item.ProductID) || null) : null;
                console.log(`🏷️ [getOrderItemsByOrderId] OrderItemID ${item.OrderItemID}: ProductID=${item.ProductID} -> ProductName="${productName}", ProductImage="${productImage}"`);
                return Object.assign(Object.assign({}, item), { ProductName: productName, ProductImage: productImage });
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
/**
 * Authenticate with external API and get token
 */
function getExternalApiToken() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            console.log('🔐 Authenticating with external API for invoices...');
            console.log('🔗 API URL:', `${EXTERNAL_API_URL}/accounts/login`);
            console.log('👤 Username:', EXTERNAL_API_USERNAME);
            const response = yield axios_1.default.post(`${EXTERNAL_API_URL}/accounts/login`, {
                username: EXTERNAL_API_USERNAME,
                password: EXTERNAL_API_PASSWORD,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 15000
            });
            console.log('📡 Login response status:', response.status);
            console.log('📥 Login response data:', response.data);
            if ((_a = response.data) === null || _a === void 0 ? void 0 : _a.token) {
                console.log('✅ External API authentication successful');
                return response.data.token;
            }
            console.error('❌ No token received from external API');
            return null;
        }
        catch (error) {
            console.error('❌ Error authenticating with external API:', (_d = (_c = (_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.data) !== null && _c !== void 0 ? _c : error.message) !== null && _d !== void 0 ? _d : error);
            return null;
        }
    });
}
/**
 * Get invoices for a customer within a date range by calling external API
 * @param customerId - The customer ID
 * @param fromDateTime - Start date/time as Unix milliseconds string
 * @param toDateTime - End date/time as Unix milliseconds string
 */
function getInvoicesByCustomerAndDateRange(customerId, fromDateTime, toDateTime) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g;
        try {
            // Step 1: Get authentication token from external API
            const token = yield getExternalApiToken();
            if (!token) {
                return {
                    success: false,
                    invoices: [],
                    message: 'Failed to authenticate with external invoice API'
                };
            }
            console.log('🔍 Calling external invoice API for CustomerID:', customerId, 'from:', fromDateTime, 'to:', toDateTime);
            // Build request body for external API
            const requestBody = {
                FromDateTime: fromDateTime,
                ToDateTime: toDateTime,
                CustomerID: customerId
            };
            console.log('➡️ GET to external API:', EXTERNAL_INVOICE_API_URL);
            console.log('📤 Request body:', JSON.stringify(requestBody));
            // Step 2: Call invoice API with the token (using GET with data in body)
            const response = yield (0, axios_1.default)({
                method: 'GET',
                url: EXTERNAL_INVOICE_API_URL,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                data: requestBody,
                timeout: 15000
            });
            const invoices = response.data;
            console.log('📊 Received invoices count:', Array.isArray(invoices) ? invoices.length : 'non-array response');
            return {
                success: true,
                invoices: invoices
            };
        }
        catch (error) {
            console.error('Error calling external invoice API:', (_c = (_b = (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : error.message) !== null && _c !== void 0 ? _c : error);
            return {
                success: false,
                invoices: [],
                message: (_g = (_f = (_e = (_d = error === null || error === void 0 ? void 0 : error.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.message) !== null && _f !== void 0 ? _f : error.message) !== null && _g !== void 0 ? _g : 'Error fetching invoices from external API'
            };
        }
    });
}
//# sourceMappingURL=index.js.map