import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// External API URL for invoices
const EXTERNAL_API_URL = process.env.EXTERNAL_API_URL || 'http://3.109.147.219/test/api';
const EXTERNAL_INVOICE_API_URL = process.env.EXTERNAL_INVOICE_API_URL || 'http://3.109.147.219/test/api/Invoice/GetInvoicesForCustomer';
const EXTERNAL_API_USERNAME = process.env.EXTERNAL_API_USERNAME || 'testuser';
const EXTERNAL_API_PASSWORD = process.env.EXTERNAL_API_PASSWORD || 'testpassword';

// Helper function to safely convert BigInt and Date to serializable format for JSON
const serializeForJson = (value: any): any => {
    if (value === null || value === undefined) return value;
    
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
        const result: Record<string, any> = {};
        for (const key in value) {
            result[key] = serializeForJson(value[key]);
        }
        return result;
    }
    
    return value;
};

export async function getOrdersByCustomerId(customerId: number) {
    try {
        console.log('🔍 Querying orders for CustomerID:', customerId);

        const orders = await prisma.orders.findMany({
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
        console.log('🔍 [getOrderItemsByOrderId] START - OrderID:', orderId);

        const orderItems = await prisma.orderItems.findMany({
            where: { OrderID: orderId }
        });

        console.log('📊 [getOrderItemsByOrderId] Found order items count:', orderItems.length);
        console.log('📊 [getOrderItemsByOrderId] Raw order items:', JSON.stringify(orderItems, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        // Get product names from ProductMaster table
        const productIds = orderItems.map(item => item.ProductID).filter((id): id is number => id !== null);
        console.log('🆔 [getOrderItemsByOrderId] Product IDs to lookup:', productIds);
        
        let productNameMap = new Map<number, string>();
        let productImageMap = new Map<number, string | null>();
        
        if (productIds.length > 0) {
            const products = await prisma.productMaster.findMany({
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
            const productImages = await prisma.productImages.findMany({
                where: { ProductID: { in: productIds } },
                select: { ProductID: true, ImageID: true }
            });
            console.log('🖼️ [getOrderItemsByOrderId] Product images found:', JSON.stringify(productImages));

            if (productImages.length > 0) {
                const imageIds = productImages.map(pi => pi.ImageID);
                const images = await prisma.imageMaster.findMany({
                    where: { ImageID: { in: imageIds } },
                    select: { ImageID: true, Url: true }
                });
                console.log('🎨 [getOrderItemsByOrderId] Images found from ImageMaster:', JSON.stringify(images));

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
                    console.log(`🖼️ [getOrderItemsByOrderId] ProductID ${pi.ProductID} -> Image: ${imageUrl}`);
                });
            }
        } else {
            console.log('⚠️ [getOrderItemsByOrderId] No valid ProductIDs found in order items');
        }

        // Enrich order items with product names and images
        const orderItemsWithNames = orderItems.map(item => {
            const productName = item.ProductID ? (productNameMap.get(item.ProductID) || `Product #${item.ProductID}`) : 'Unknown Product';
            const productImage = item.ProductID ? (productImageMap.get(item.ProductID) || null) : null;
            console.log(`🏷️ [getOrderItemsByOrderId] OrderItemID ${item.OrderItemID}: ProductID=${item.ProductID} -> ProductName="${productName}", ProductImage="${productImage}"`);
            return {
                ...item,
                ProductName: productName,
                ProductImage: productImage
            };
        });

        // Convert BigInt and Date values to serializable format
        const serializedOrderItems = serializeForJson(orderItemsWithNames);
        console.log('✅ [getOrderItemsByOrderId] Final serialized order items:', JSON.stringify(serializedOrderItems));

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

export async function getInvoicesByCustomerId(customerId: number) {
    try {
        console.log('🔍 Querying invoices for CustomerID:', customerId);

        const invoices = await prisma.invoices.findMany({
            where: { CustomerID: customerId },
            orderBy: { InvoiceDate: 'desc' },
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
        
        console.log('📊 Found invoices count:', invoices.length);

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

        // Convert BigInt and Date values to serializable format
        const serializedInvoices = serializeForJson(invoicesWithOrderNumber);

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
        console.log('🔍 [getInvoiceItemsByInvoiceId] START - InvoiceID:', invoiceId);

        const invoiceItems = await prisma.invoiceItems.findMany({
            where: { InvoiceID: invoiceId }
        });
        
        console.log('📊 [getInvoiceItemsByInvoiceId] Found invoice items count:', invoiceItems.length);
        console.log('📊 [getInvoiceItemsByInvoiceId] Raw invoice items:', JSON.stringify(invoiceItems, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        // Get product names and images from ProductMaster table
        const productIds = invoiceItems.map(item => item.ProductID).filter((id): id is number => id !== null);
        console.log('🆔 [getInvoiceItemsByInvoiceId] Product IDs to lookup:', productIds);
        
        let productNameMap = new Map<number, string>();
        let productImageMap = new Map<number, string | null>();
        
        if (productIds.length > 0) {
            const products = await prisma.productMaster.findMany({
                where: { ProductID: { in: productIds } },
                select: { ProductID: true, ProductName: true, DisplayName: true }
            });
            console.log('📦 [getInvoiceItemsByInvoiceId] Products found from ProductMaster:', JSON.stringify(products));
            
            products.forEach(p => {
                const name = p.DisplayName || p.ProductName || `Product #${p.ProductID}`;
                console.log(`📝 [getInvoiceItemsByInvoiceId] Mapping ProductID ${p.ProductID} -> "${name}"`);
                productNameMap.set(p.ProductID, name);
            });

            // Fetch product images from ProductImages and ImageMaster tables
            const productImages = await prisma.productImages.findMany({
                where: { ProductID: { in: productIds } },
                select: { ProductID: true, ImageID: true }
            });
            console.log('🖼️ [getInvoiceItemsByInvoiceId] Product images found:', JSON.stringify(productImages));

            if (productImages.length > 0) {
                const imageIds = productImages.map(pi => pi.ImageID);
                const images = await prisma.imageMaster.findMany({
                    where: { ImageID: { in: imageIds } },
                    select: { ImageID: true, Url: true }
                });
                console.log('🎨 [getInvoiceItemsByInvoiceId] Images found from ImageMaster:', JSON.stringify(images));

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
                    console.log(`🖼️ [getInvoiceItemsByInvoiceId] ProductID ${pi.ProductID} -> Image: ${imageUrl}`);
                });
            }
        } else {
            console.log('⚠️ [getInvoiceItemsByInvoiceId] No valid ProductIDs found in invoice items');
        }

        // Enrich invoice items with product names and images
        const invoiceItemsWithNames = invoiceItems.map(item => {
            const productName = item.ProductID ? (productNameMap.get(item.ProductID) || `Product #${item.ProductID}`) : 'Unknown Product';
            const productImage = item.ProductID ? (productImageMap.get(item.ProductID) || null) : null;
            console.log(`🏷️ [getInvoiceItemsByInvoiceId] InvoiceItemID ${item.InvoiceItemID}: ProductID=${item.ProductID} -> ProductName="${productName}", ProductImage="${productImage}"`);
            return {
                ...item,
                ProductName: productName,
                ProductImage: productImage
            };
        });

        // Convert BigInt and Date values to serializable format
        const serializedInvoiceItems = serializeForJson(invoiceItemsWithNames);
        console.log('✅ [getInvoiceItemsByInvoiceId] Final serialized invoice items:', JSON.stringify(serializedInvoiceItems));

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
        console.log('🔐 Authenticating with external API for invoices...');
        console.log('🔗 API URL:', `${EXTERNAL_API_URL}/accounts/login`);
        console.log('👤 Username:', EXTERNAL_API_USERNAME);
        
        const response = await axios.post(`${EXTERNAL_API_URL}/accounts/login`, {
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
        
        if (response.data?.token) {
            console.log('✅ External API authentication successful');
            return response.data.token;
        }

        console.error('❌ No token received from external API');
        return null;
    } catch (error: any) {
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

        console.log('📊 Received invoices count:', Array.isArray(invoices) ? invoices.length : 'non-array response');
        
        // Log first invoice to see field structure
        if (Array.isArray(invoices) && invoices.length > 0) {
            console.log('📋 Sample invoice fields:', Object.keys(invoices[0]));
            console.log('📋 First invoice data:', JSON.stringify(invoices[0], null, 2));
        }

        // Enrich external API data with InvoiceStatus and NetInvoiceAmount from our database
        if (Array.isArray(invoices) && invoices.length > 0) {
            console.log('🔄 Enriching invoice data from local database...');
            
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

                console.log('✅ Fetched', dbInvoices.length, 'invoices from local database');

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
                        console.log(`📝 Enriched Invoice ${inv.invoiceID}: Status=${dbData.InvoiceStatus}, NetAmount=${dbData.NetInvoiceAmount}, OrderID=${inv.OrderID}, OrderNumber=${inv.OrderNumber}`);
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
