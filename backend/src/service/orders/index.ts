import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
        console.log('🔍 Querying order items for OrderID:', orderId);

        const orderItems = await prisma.orderItems.findMany({
            where: { OrderID: orderId }
        });

        console.log('📊 Found order items count:', orderItems.length);

        // Convert BigInt and Date values to serializable format
        const serializedOrderItems = serializeForJson(orderItems);

        return {
            success: true,
            orderItems: serializedOrderItems
        };
    } catch (error) {
        console.error('Error in getOrderItemsByOrderId service:', error);
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
            orderBy: { InvoiceDate: 'desc' }
        });
        
        console.log('📊 Found invoices count:', invoices.length);

        // Convert BigInt and Date values to serializable format
        const serializedInvoices = serializeForJson(invoices);

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
        console.log('🔍 Querying invoice items for InvoiceID:', invoiceId);

        const invoiceItems = await prisma.invoiceItems.findMany({
            where: { InvoiceID: invoiceId }
        });
        
        console.log('📊 Found invoice items count:', invoiceItems.length);

        // Convert BigInt and Date values to serializable format
        const serializedInvoiceItems = serializeForJson(invoiceItems);

        return {
            success: true,
            invoiceItems: serializedInvoiceItems
        };
    } catch (error) {
        console.error('Error in getInvoiceItemsByInvoiceId service:', error);
        return {
            success: false,
            invoiceItems: [],
            message: 'Error fetching invoice items'
        };
    }
}
