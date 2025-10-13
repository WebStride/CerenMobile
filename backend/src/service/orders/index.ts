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

        // Enrich items with product name and image (from ProductMaster and productImages->imageMaster)
        const productIds = Array.from(new Set(orderItems.map(oi => oi.ProductID).filter(Boolean)));

        let productNameMap: Record<number, string | null> = {};
        let productImageMap: Record<number, string | null> = {};

        if (productIds.length > 0) {
            const products = await prisma.productMaster.findMany({
                where: { ProductID: { in: productIds } },
                select: { ProductID: true, ProductName: true }
            });

            products.forEach(p => {
                productNameMap[p.ProductID] = p.ProductName || null;
            });

            // find images associated with these products
            const productImages = await prisma.productImages.findMany({
                where: { ProductID: { in: productIds } },
                select: { ProductID: true, ImageID: true }
            });

            const imageIds = Array.from(new Set(productImages.map(pi => pi.ImageID).filter(Boolean)));
            let imageUrlMap: Record<number, string | null> = {};
            if (imageIds.length > 0) {
                const images = await prisma.imageMaster.findMany({
                    where: { ImageID: { in: imageIds } },
                    select: { ImageID: true, Url: true }
                });
                images.forEach(img => { imageUrlMap[img.ImageID] = img.Url || null; });
            }

            // map product -> first image url (if any)
            productImages.forEach(pi => {
                if (!productImageMap[pi.ProductID]) {
                    productImageMap[pi.ProductID] = imageUrlMap[pi.ImageID] || null;
                }
            });
        }

        const augmented = orderItems.map(item => ({
            ...item,
            ProductName: productNameMap[item.ProductID] || null,
            ProductImage: productImageMap[item.ProductID] || null
        }));

        // Debug logs: product ids and maps + sample JSON response for inspection
        console.log('🔎 OrderItem ProductIDs:', productIds);
        console.log('🔎 ProductNameMap:', productNameMap);
        console.log('🔎 ProductImageMap:', productImageMap);
        try {
            console.log('🔁 Returning augmented order items (sample):', JSON.stringify(augmented));
        } catch (e) {
            console.log('🔁 Returning augmented order items (could not stringify, showing length):', augmented.length);
        }

        return {
            success: true,
            orderItems: augmented
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

        // Enrich items with product name and image (from ProductMaster and productImages->imageMaster)
        const productIds = Array.from(new Set(invoiceItems.map(ii => ii.ProductID).filter(Boolean)));

        let productNameMap: Record<number, string | null> = {};
        let productImageMap: Record<number, string | null> = {};

        if (productIds.length > 0) {
            const products = await prisma.productMaster.findMany({
                where: { ProductID: { in: productIds } },
                select: { ProductID: true, ProductName: true }
            });

            products.forEach(p => {
                productNameMap[p.ProductID] = p.ProductName || null;
            });

            // find images associated with these products
            const productImages = await prisma.productImages.findMany({
                where: { ProductID: { in: productIds } },
                select: { ProductID: true, ImageID: true }
            });

            const imageIds = Array.from(new Set(productImages.map(pi => pi.ImageID).filter(Boolean)));
            let imageUrlMap: Record<number, string | null> = {};
            if (imageIds.length > 0) {
                const images = await prisma.imageMaster.findMany({
                    where: { ImageID: { in: imageIds } },
                    select: { ImageID: true, Url: true }
                });
                images.forEach(img => { imageUrlMap[img.ImageID] = img.Url || null; });
            }

            // map product -> first image url (if any)
            productImages.forEach(pi => {
                if (!productImageMap[pi.ProductID]) {
                    productImageMap[pi.ProductID] = imageUrlMap[pi.ImageID] || null;
                }
            });
        }

        const augmented = invoiceItems.map(item => ({
            ...item,
            ProductName: productNameMap[item.ProductID] || null,
            ProductImage: productImageMap[item.ProductID] || null
        }));

        // Debug logs: product ids and maps + sample JSON response for inspection
        console.log('🔎 InvoiceItem ProductIDs:', productIds);
        console.log('🔎 ProductNameMap:', productNameMap);
        console.log('🔎 ProductImageMap:', productImageMap);
        try {
            console.log('🔁 Returning augmented invoice items (sample):', JSON.stringify(augmented.slice(0, 2)));
        } catch (e) {
            console.log('🔁 Returning augmented invoice items (could not stringify, showing length):', augmented.length);
        }

        return {
            success: true,
            invoiceItems: augmented
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
