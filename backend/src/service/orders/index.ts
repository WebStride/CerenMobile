import prisma from '../../lib/prisma';
import axios from 'axios';

// External API URL for invoices
const EXTERNAL_API_URL = process.env.EXTERNAL_API_URL || 'http://3.109.147.219/test/api';
const EXTERNAL_INVOICE_API_URL = process.env.EXTERNAL_INVOICE_API_URL || 'http://3.109.147.219/test/api/Invoice/GetInvoicesForCustomer';
const EXTERNAL_API_USERNAME = process.env.EXTERNAL_API_USERNAME || 'testuser';
const EXTERNAL_API_PASSWORD = process.env.EXTERNAL_API_PASSWORD || 'testpassword';
const EXTERNAL_TOKEN_TTL_MS = 10 * 60 * 1000;

let cachedExternalToken: string | null = null;
let externalTokenExpiresAt = 0;

const jsonReplacer = (_: string, v: unknown) =>
    typeof v === 'bigint' ? (v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : String(v)) : v;

export async function getOrdersByCustomerId(customerId: number, take = 100, skip = 0) {
    try {
        const orders = await prisma.orders.findMany({
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
    } catch (error) {
        console.error('Error in getOrdersByCustomerId service:', error);
        return {
            success: false,
            orders: [],
            message: 'Error fetching orders'
        };
    }
}

export async function getOrderItemsByOrderId(orderId: number) {
    try {
        const orderItems = await prisma.orderItems.findMany({
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
        const productIds = orderItems.map(item => item.ProductID).filter((id): id is number => id !== null);
        
        let productNameMap = new Map<number, string>();
        let productImageMap = new Map<number, string | null>();
        
        if (productIds.length > 0) {
            const [products, productImages] = await Promise.all([
                prisma.productMaster.findMany({
                    where: { ProductID: { in: productIds } },
                    select: { ProductID: true, ProductName: true, DisplayName: true }
                }),
                prisma.productImages.findMany({
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
                const images = await prisma.imageMaster.findMany({
                    where: { ImageID: { in: imageIds } },
                    select: { ImageID: true, Url: true }
                });

                const imageIdToUrlMap = new Map<number, string>();
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
            return {
                ...item,
                ProductName: productName,
                ProductImage: productImage
            };
        });

        const serializedOrderItems = JSON.parse(JSON.stringify(orderItemsWithNames, jsonReplacer));

        return {
            success: true,
            orderItems: serializedOrderItems
        };
    } catch (error) {
        console.error('❌ [getOrderItemsByOrderId] Error:', error);
        return {
            success: false,
            orderItems: [],
            message: 'Error fetching order items'
        };
    }
}

export async function getInvoicesByCustomerId(customerId: number, take = 100, skip = 0) {
    try {
        const invoices = await prisma.invoices.findMany({
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
        let orderNumberMap = new Map<string, string>();
        if (orderIds.length > 0) {
            const orders = await prisma.orders.findMany({
                where: { OrderID: { in: orderIds } },
                select: { OrderID: true, OrderNumber: true }
            });
            orders.forEach(order => {
                orderNumberMap.set(order.OrderID.toString(), order.OrderNumber);
            });
        }

        // Add OrderNumber to each invoice
        const invoicesWithOrderNumber = invoices.map(inv => ({
            ...inv,
            OrderNumber: inv.OrderID ? orderNumberMap.get(inv.OrderID.toString()) || null : null
        }));

        const serializedInvoices = JSON.parse(JSON.stringify(invoicesWithOrderNumber, jsonReplacer));

        return {
            success: true,
            invoices: serializedInvoices
        };
    } catch (error) {
        console.error('Error in getInvoicesByCustomerId service:', error);
        return {
            success: false,
            invoices: [],
            message: 'Error fetching invoices'
        };
    }
}

export async function getInvoiceItemsByInvoiceId(invoiceId: number) {
    try {
        const invoiceItems = await prisma.invoiceItems.findMany({
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
        const productIds = invoiceItems.map(item => item.ProductID).filter((id): id is number => id !== null);
        
        let productNameMap = new Map<number, string>();
        let productImageMap = new Map<number, string | null>();
        
        if (productIds.length > 0) {
            const [products, productImages] = await Promise.all([
                prisma.productMaster.findMany({
                    where: { ProductID: { in: productIds } },
                    select: { ProductID: true, ProductName: true, DisplayName: true }
                }),
                prisma.productImages.findMany({
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
                const images = await prisma.imageMaster.findMany({
                    where: { ImageID: { in: imageIds } },
                    select: { ImageID: true, Url: true }
                });

                const imageIdToUrlMap = new Map<number, string>();
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
            return {
                ...item,
                ProductName: productName,
                ProductImage: productImage
            };
        });

        const serializedInvoiceItems = JSON.parse(JSON.stringify(invoiceItemsWithNames, jsonReplacer));

        return {
            success: true,
            invoiceItems: serializedInvoiceItems
        };
    } catch (error) {
        console.error('❌ [getInvoiceItemsByInvoiceId] Error:', error);
        return {
            success: false,
            invoiceItems: [],
            message: 'Error fetching invoice items'
        };
    }
}

/**
 * Authenticate with external API and get token
 */
async function getExternalApiToken(): Promise<string | null> {
    try {
        if (cachedExternalToken && Date.now() < externalTokenExpiresAt) {
            return cachedExternalToken;
        }

        const response = await axios.post(`${EXTERNAL_API_URL}/accounts/login`, {
            username: EXTERNAL_API_USERNAME,
            password: EXTERNAL_API_PASSWORD,
        }, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 15000
        });

        if (response.data?.token) {
            cachedExternalToken = response.data.token;
            externalTokenExpiresAt = Date.now() + EXTERNAL_TOKEN_TTL_MS;
            return cachedExternalToken;
        }

        console.error('❌ No token received from external API');
        return null;
    } catch (error: any) {
        cachedExternalToken = null;
        externalTokenExpiresAt = 0;
        console.error('❌ Error authenticating with external API:', error?.response?.data ?? error.message ?? error);
        return null;
    }
}

/**
 * Get invoices for a customer within a date range by calling external API
 * @param customerId - The customer ID
 * @param fromDateTime - Start date/time as Unix milliseconds string
 * @param toDateTime - End date/time as Unix milliseconds string
 */
export async function getInvoicesByCustomerAndDateRange(
    customerId: number,
    fromDateTime: string,
    toDateTime: string
) {
    try {
        // Step 1: Get authentication token from external API
        const token = await getExternalApiToken();
        
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
        const response = await axios({
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
                .map((inv: any) => inv.invoiceID)
                .filter((id: any) => id !== null && id !== undefined);

            if (invoiceIds.length > 0) {
                // Fetch InvoiceStatus, NetInvoiceAmount, and OrderID from our database
                const dbInvoices = await prisma.invoices.findMany({
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
                const orderIds = [...new Set(dbInvoices.map(inv => inv.OrderID).filter(id => id !== null))] as bigint[];
                
                // Fetch OrderNumbers for all orders
                let orderNumberMap = new Map<string, string>();
                if (orderIds.length > 0) {
                    const orders = await prisma.orders.findMany({
                        where: { OrderID: { in: orderIds } },
                        select: { OrderID: true, OrderNumber: true }
                    });
                    orders.forEach(order => {
                        orderNumberMap.set(order.OrderID.toString(), order.OrderNumber);
                    });
                }

                // Create a map for quick lookup
                const dbInvoiceMap = new Map(
                    dbInvoices.map(inv => [inv.InvoiceID, inv])
                );

                // Enrich each invoice with database data
                invoices.forEach((inv: any) => {
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
    } catch (error: any) {
        console.error('Error calling external invoice API:', error?.response?.data ?? error.message ?? error);
        return {
            success: false,
            invoices: [],
            message: error?.response?.data?.message ?? error.message ?? 'Error fetching invoices from external API'
        };
    }
}
