import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

        return {
            success: true,
            orders
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

        return {
            success: true,
            orderItems
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

        // Convert any BigInt fields (Prisma may return BigInt for large integer DB cols)
        const serializable = invoices.map(inv => ({
            ...inv,
            // OrderID in your schema is BigInt - convert to number if safe, otherwise to string
            OrderID: typeof inv.OrderID === 'bigint' ? (Number(inv.OrderID) <= Number.MAX_SAFE_INTEGER ? Number(inv.OrderID) : String(inv.OrderID)) : inv.OrderID
        }));

        return {
            success: true,
            invoices: serializable
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

        return {
            success: true,
            invoiceItems
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
