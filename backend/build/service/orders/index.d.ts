export declare function getOrdersByCustomerId(customerId: number): Promise<{
    success: boolean;
    orders: {
        OrderID: number;
        OrderNumber: string;
        OrderDate: Date;
        OrderItemCount: number | null;
        EstimateOrderAmount: number | null;
        OrderStatus: string | null;
        DateDelivered: Date | null;
        DateInvoiceCreated: Date | null;
        CreationDate: Date | null;
        LastUpdatedDate: Date | null;
    }[];
    message?: undefined;
} | {
    success: boolean;
    orders: never[];
    message: string;
}>;
export declare function getOrderItemsByOrderId(orderId: number): Promise<{
    success: boolean;
    orderItems: {
        ProductName: string | null;
        ProductImage: string | null;
        ProductID: number;
        OrderID: number;
        DeliveryLineID: number | null;
        OrderItemID: number;
        OrderQty: number | null;
        Price: number | null;
        OrderItemStatus: string | null;
        Comments: string | null;
    }[];
    message?: undefined;
} | {
    success: boolean;
    orderItems: never[];
    message: string;
}>;
export declare function getInvoicesByCustomerId(customerId: number): Promise<{
    success: boolean;
    invoices: {
        OrderID: string | number;
        CustomerID: number;
        CreationDate: Date | null;
        LastUpdatedDate: Date | null;
        DeliveryLineID: number | null;
        InvoiceID: number;
        InvoiceNumber: string;
        InvoiceDate: Date;
        InvoiceItemCount: number | null;
        GrossInvoiceAmount: number | null;
        DiscountAmount: number | null;
        NetInvoiceAmount: number | null;
        InvoiceStatus: string | null;
        BalanceAmount: number | null;
    }[];
    message?: undefined;
} | {
    success: boolean;
    invoices: never[];
    message: string;
}>;
export declare function getInvoiceItemsByInvoiceId(invoiceId: number): Promise<{
    success: boolean;
    invoiceItems: {
        ProductName: string | null;
        ProductImage: string | null;
        Discount: number | null;
        ProductID: number;
        OrderQty: string | null;
        Price: number | null;
        InvoiceID: number;
        InvoiceItemID: number;
        SaleQty: number | null;
        TaxableValue: number | null;
        CGST: number | null;
        SGST: number | null;
        IGST: number | null;
        NetTotal: number | null;
        InvoiceItemStatus: string | null;
    }[];
    message?: undefined;
} | {
    success: boolean;
    invoiceItems: never[];
    message: string;
}>;
