import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { getOrdersByCustomerId, getOrderItemsByOrderId, getInvoicesByCustomerId, getInvoiceItemsByInvoiceId, getInvoicesByCustomerAndDateRange } from '../../service/orders';
import prisma from '../../lib/prisma';

export async function getInvoicesByCustomer(req: AuthRequest, res: Response) {
    try {
        const queryCustomerId = req.query.customerid as string;
        let customerId: number;

        if (queryCustomerId) {
            const parsed = parseInt(queryCustomerId);
            if (!req.user?.userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const owned = await prisma.cUSTOMERMASTER.findFirst({
                where: { CUSTOMERID: parsed, USERID: parseInt(req.user.userId) },
                select: { CUSTOMERID: true },
            });
            if (!owned) {
                return res.status(403).json({ success: false, error: 'Access denied.' });
            }
            customerId = parsed;
            console.log('🔍 Using query customerId for invoices:', customerId);
        } else {
            if (!req.user?.userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            customerId = parseInt(req.user.userId);
            console.log('🔍 Using JWT customerId for invoices:', customerId);
        }

        const result = await getInvoicesByCustomerId(customerId);

        if (!result.success) {
            return res.status(500).json({ error: 'Failed to fetch invoices', details: result.message });
        }

        res.json({ success: true, invoices: result.invoices });
    } catch (error: any) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ error: 'Failed to fetch invoices', details: error.message });
    }
}

export async function getOrdersByCustomer(req: AuthRequest, res: Response) {
    try {
        // Allow customerid query parameter for testing, otherwise use JWT
        const queryCustomerId = req.query.customerid as string;
        let customerId: number;

        if (queryCustomerId) {
            const parsed = parseInt(queryCustomerId);
            if (!req.user?.userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const owned = await prisma.cUSTOMERMASTER.findFirst({
                where: { CUSTOMERID: parsed, USERID: parseInt(req.user.userId) },
                select: { CUSTOMERID: true },
            });
            if (!owned) {
                return res.status(403).json({ success: false, error: 'Access denied.' });
            }
            customerId = parsed;
            console.log('🔍 Using query customerId:', customerId);
        } else {
            if (!req.user?.userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            customerId = parseInt(req.user.userId);
            console.log('🔍 Using JWT customerId:', customerId);
        }

        const result = await getOrdersByCustomerId(customerId);

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
    } catch (error: any) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            error: 'Failed to fetch orders',
            details: error.message
        });
    }
}

export async function getOrderItemsByOrder(req: AuthRequest, res: Response) {
    try {
        const orderId = parseInt(req.params.orderId);
        if (isNaN(orderId)) {
            return res.status(400).json({ error: 'Invalid orderId' });
        }

        console.log('🔍 Fetching order items for OrderID:', orderId);

        const result = await getOrderItemsByOrderId(orderId);

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
    } catch (error: any) {
        console.error('Error fetching order items:', error);
        res.status(500).json({
            error: 'Failed to fetch order items',
            details: error.message
        });
    }
}

export async function getInvoiceItemsByInvoice(req: AuthRequest, res: Response) {
    try {
        const invoiceId = parseInt(req.params.invoiceId);
        if (isNaN(invoiceId)) {
            return res.status(400).json({ error: 'Invalid invoiceId' });
        }

        console.log('🔍 Fetching invoice items for InvoiceID:', invoiceId);

        const result = await getInvoiceItemsByInvoiceId(invoiceId);

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
    } catch (error: any) {
        console.error('Error fetching invoice items:', error);
        res.status(500).json({
            error: 'Failed to fetch invoice items',
            details: error.message
        });
    }
}

/**
 * Get invoices for a customer within a date range
 * POST /invoices/by-customer
 * Body: { FromDateTime: string (Unix ms), ToDateTime: string (Unix ms), CustomerID: number }
 * Calls external API: http://3.109.147.219/test/api/Invoice/GetInvoicesForCustomer
 */
export async function getInvoicesForCustomer(req: AuthRequest, res: Response) {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }

        const { FromDateTime, ToDateTime, CustomerID } = req.body;

        // Validate required fields
        if (!FromDateTime || !ToDateTime || !CustomerID) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: FromDateTime, ToDateTime, CustomerID'
            });
        }

        // Verify the requesting user owns the CustomerID
        const owned = await prisma.cUSTOMERMASTER.findFirst({
            where: { CUSTOMERID: parseInt(CustomerID), USERID: parseInt(req.user!.userId) },
            select: { CUSTOMERID: true },
        });
        if (!owned) {
            return res.status(403).json({ success: false, error: 'Access denied.' });
        }

        console.log('🔍 Fetching invoices for CustomerID:', CustomerID, 'from:', FromDateTime, 'to:', ToDateTime);

        const result = await getInvoicesByCustomerAndDateRange(
            parseInt(CustomerID),
            FromDateTime.toString(),
            ToDateTime.toString()
        );

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch invoices',
                details: result.message
            });
        }

        // Return with success wrapper to match frontend expectations
        res.json({
            success: true,
            invoices: result.invoices
        });
    } catch (error: any) {
        console.error('Error fetching invoices for customer:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch invoices',
            details: error.message
        });
    }
}
