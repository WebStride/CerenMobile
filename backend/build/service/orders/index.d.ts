export declare function getOrdersByCustomerId(customerId: number): Promise<{
    success: boolean;
    orders: any;
    message?: undefined;
} | {
    success: boolean;
    orders: never[];
    message: string;
}>;
export declare function getOrderItemsByOrderId(orderId: number): Promise<{
    success: boolean;
    orderItems: any;
    message?: undefined;
} | {
    success: boolean;
    orderItems: never[];
    message: string;
}>;
export declare function getInvoicesByCustomerId(customerId: number): Promise<{
    success: boolean;
    invoices: any;
    message?: undefined;
} | {
    success: boolean;
    invoices: never[];
    message: string;
}>;
export declare function getInvoiceItemsByInvoiceId(invoiceId: number): Promise<{
    success: boolean;
    invoiceItems: any;
    message?: undefined;
} | {
    success: boolean;
    invoiceItems: never[];
    message: string;
}>;
