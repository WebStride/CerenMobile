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
const prisma_1 = __importDefault(require("../../lib/prisma"));
const axios_1 = __importDefault(require("axios"));
// External API URL for invoices
const EXTERNAL_API_URL = process.env.EXTERNAL_API_URL || 'http://3.109.147.219/test/api';
const EXTERNAL_INVOICE_API_URL = process.env.EXTERNAL_INVOICE_API_URL || 'http://3.109.147.219/test/api/Invoice/GetInvoicesForCustomer';
const EXTERNAL_API_USERNAME = process.env.EXTERNAL_API_USERNAME || 'testuser';
const EXTERNAL_API_PASSWORD = process.env.EXTERNAL_API_PASSWORD || 'testpassword';
const EXTERNAL_TOKEN_TTL_MS = 10 * 60 * 1000;
let cachedExternalToken = null;
let externalTokenExpiresAt = 0;
const jsonReplacer = (_, v) => typeof v === 'bigint' ? (v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : String(v)) : v;
function getOrdersByCustomerId(customerId_1) {
    return __awaiter(this, arguments, void 0, function* (customerId, take = 100, skip = 0) {
        try {
            const orders = yield prisma_1.default.orders.findMany({
                where: { CustomerID: customerId },
                orderBy: { OrderDate: 'desc' },
                take,
                skip,
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
            const serializedOrders = JSON.parse(JSON.stringify(orders, jsonReplacer));
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
            const orderItems = yield prisma_1.default.orderItems.findMany({
                where: { OrderID: orderId },
                select: {
                    OrderItemID: true,
                    OrderID: true,
                    ProductID: true,
                    OrderQty: true,
                    Price: true,
                    DeliveryLineID: true,
                    OrderItemStatus: true,
                    Comments: true
                }
            });
            // Get product names from ProductMaster table
            const productIds = orderItems.map(item => item.ProductID).filter((id) => id !== null);
            let productNameMap = new Map();
            let productImageMap = new Map();
            if (productIds.length > 0) {
                const [products, productImages] = yield Promise.all([
                    prisma_1.default.productMaster.findMany({
                        where: { ProductID: { in: productIds } },
                        select: { ProductID: true, ProductName: true, DisplayName: true }
                    }),
                    prisma_1.default.productImages.findMany({
                        where: { ProductID: { in: productIds } },
                        select: { ProductID: true, ImageID: true }
                    })
                ]);
                products.forEach(p => {
                    const name = p.DisplayName || p.ProductName || `Product #${p.ProductID}`;
                    productNameMap.set(p.ProductID, name);
                });
                if (productImages.length > 0) {
                    const imageIds = productImages.map(pi => pi.ImageID);
                    const images = yield prisma_1.default.imageMaster.findMany({
                        where: { ImageID: { in: imageIds } },
                        select: { ImageID: true, Url: true }
                    });
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
                    });
                }
            }
            // Enrich order items with product names and images
            const orderItemsWithNames = orderItems.map(item => {
                const productName = item.ProductID ? (productNameMap.get(item.ProductID) || `Product #${item.ProductID}`) : 'Unknown Product';
                const productImage = item.ProductID ? (productImageMap.get(item.ProductID) || null) : null;
                return Object.assign(Object.assign({}, item), { ProductName: productName, ProductImage: productImage });
            });
            const serializedOrderItems = JSON.parse(JSON.stringify(orderItemsWithNames, jsonReplacer));
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
function getInvoicesByCustomerId(customerId_1) {
    return __awaiter(this, arguments, void 0, function* (customerId, take = 100, skip = 0) {
        try {
            const invoices = yield prisma_1.default.invoices.findMany({
                where: { CustomerID: customerId },
                orderBy: { InvoiceDate: 'desc' },
                take,
                skip,
                select: {
                    InvoiceID: true,
                    InvoiceNumber: true,
                    InvoiceDate: true,
                    CustomerID: true,
                    OrderID: true,
                    InvoiceItemCount: true,
                    GrossInvoiceAmount: true,
                    DiscountAmount: true,
                    NetInvoiceAmount: true,
                    InvoiceStatus: true,
                    BalanceAmount: true,
                    DeliveryLineID: true,
                    CreationDate: true,
                    LastUpdatedDate: true
                }
            });
            // Get unique OrderIDs to fetch OrderNumbers
            const orderIds = [...new Set(invoices.map(inv => inv.OrderID).filter(id => id !== null))];
            // Fetch OrderNumbers for all orders
            let orderNumberMap = new Map();
            if (orderIds.length > 0) {
                const orders = yield prisma_1.default.orders.findMany({
                    where: { OrderID: { in: orderIds } },
                    select: { OrderID: true, OrderNumber: true }
                });
                orders.forEach(order => {
                    orderNumberMap.set(order.OrderID.toString(), order.OrderNumber);
                });
            }
            // Add OrderNumber to each invoice
            const invoicesWithOrderNumber = invoices.map(inv => (Object.assign(Object.assign({}, inv), { OrderNumber: inv.OrderID ? orderNumberMap.get(inv.OrderID.toString()) || null : null })));
            const serializedInvoices = JSON.parse(JSON.stringify(invoicesWithOrderNumber, jsonReplacer));
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
            const invoiceItems = yield prisma_1.default.invoiceItems.findMany({
                where: { InvoiceID: invoiceId },
                select: {
                    InvoiceItemID: true,
                    InvoiceID: true,
                    ProductID: true,
                    OrderQty: true,
                    SaleQty: true,
                    Price: true,
                    TaxableValue: true,
                    CGST: true,
                    SGST: true,
                    IGST: true,
                    NetTotal: true,
                    InvoiceItemStatus: true,
                    Discount: true
                }
            });
            // Get product names and images from ProductMaster table
            const productIds = invoiceItems.map(item => item.ProductID).filter((id) => id !== null);
            let productNameMap = new Map();
            let productImageMap = new Map();
            if (productIds.length > 0) {
                const [products, productImages] = yield Promise.all([
                    prisma_1.default.productMaster.findMany({
                        where: { ProductID: { in: productIds } },
                        select: { ProductID: true, ProductName: true, DisplayName: true }
                    }),
                    prisma_1.default.productImages.findMany({
                        where: { ProductID: { in: productIds } },
                        select: { ProductID: true, ImageID: true }
                    })
                ]);
                products.forEach(p => {
                    const name = p.DisplayName || p.ProductName || `Product #${p.ProductID}`;
                    productNameMap.set(p.ProductID, name);
                });
                if (productImages.length > 0) {
                    const imageIds = productImages.map(pi => pi.ImageID);
                    const images = yield prisma_1.default.imageMaster.findMany({
                        where: { ImageID: { in: imageIds } },
                        select: { ImageID: true, Url: true }
                    });
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
                    });
                }
            }
            // Enrich invoice items with product names and images
            const invoiceItemsWithNames = invoiceItems.map(item => {
                const productName = item.ProductID ? (productNameMap.get(item.ProductID) || `Product #${item.ProductID}`) : 'Unknown Product';
                const productImage = item.ProductID ? (productImageMap.get(item.ProductID) || null) : null;
                return Object.assign(Object.assign({}, item), { ProductName: productName, ProductImage: productImage });
            });
            const serializedInvoiceItems = JSON.parse(JSON.stringify(invoiceItemsWithNames, jsonReplacer));
            return {
                success: true,
                invoiceItems: serializedInvoiceItems
            };
        }
        catch (error) {
            console.error('❌ [getInvoiceItemsByInvoiceId] Error:', error);
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
            if (cachedExternalToken && Date.now() < externalTokenExpiresAt) {
                return cachedExternalToken;
            }
            const response = yield axios_1.default.post(`${EXTERNAL_API_URL}/accounts/login`, {
                username: EXTERNAL_API_USERNAME,
                password: EXTERNAL_API_PASSWORD,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 15000
            });
            if ((_a = response.data) === null || _a === void 0 ? void 0 : _a.token) {
                cachedExternalToken = response.data.token;
                externalTokenExpiresAt = Date.now() + EXTERNAL_TOKEN_TTL_MS;
                return cachedExternalToken;
            }
            console.error('❌ No token received from external API');
            return null;
        }
        catch (error) {
            cachedExternalToken = null;
            externalTokenExpiresAt = 0;
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
            // Build request body for external API
            const requestBody = {
                FromDateTime: fromDateTime,
                ToDateTime: toDateTime,
                CustomerID: customerId
            };
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
            // Enrich external API data with InvoiceStatus and NetInvoiceAmount from our database
            if (Array.isArray(invoices) && invoices.length > 0) {
                // Get all invoice IDs from external API response
                const invoiceIds = invoices
                    .map((inv) => inv.invoiceID)
                    .filter((id) => id !== null && id !== undefined);
                if (invoiceIds.length > 0) {
                    // Fetch InvoiceStatus, NetInvoiceAmount, and OrderID from our database
                    const dbInvoices = yield prisma_1.default.invoices.findMany({
                        where: {
                            InvoiceID: { in: invoiceIds }
                        },
                        select: {
                            InvoiceID: true,
                            InvoiceStatus: true,
                            NetInvoiceAmount: true,
                            InvoiceNumber: true,
                            OrderID: true
                        }
                    });
                    // Get unique OrderIDs to fetch OrderNumbers
                    const orderIds = [...new Set(dbInvoices.map(inv => inv.OrderID).filter(id => id !== null))];
                    // Fetch OrderNumbers for all orders
                    let orderNumberMap = new Map();
                    if (orderIds.length > 0) {
                        const orders = yield prisma_1.default.orders.findMany({
                            where: { OrderID: { in: orderIds } },
                            select: { OrderID: true, OrderNumber: true }
                        });
                        orders.forEach(order => {
                            orderNumberMap.set(order.OrderID.toString(), order.OrderNumber);
                        });
                    }
                    // Create a map for quick lookup
                    const dbInvoiceMap = new Map(dbInvoices.map(inv => [inv.InvoiceID, inv]));
                    // Enrich each invoice with database data
                    invoices.forEach((inv) => {
                        const dbData = dbInvoiceMap.get(inv.invoiceID);
                        if (dbData) {
                            inv.InvoiceStatus = dbData.InvoiceStatus;
                            inv.NetInvoiceAmount = dbData.NetInvoiceAmount;
                            inv.InvoiceNumber = dbData.InvoiceNumber;
                            inv.OrderID = dbData.OrderID ? Number(dbData.OrderID) : null;
                            inv.OrderNumber = dbData.OrderID ? orderNumberMap.get(dbData.OrderID.toString()) || null : null;
                        }
                    });
                }
            }
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