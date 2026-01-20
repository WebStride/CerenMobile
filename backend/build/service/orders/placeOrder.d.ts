interface PlaceOrderResponse {
    success: boolean;
    message?: string;
    orderId?: number;
    data?: any;
}
/**
 * Place order via external API
 */
export declare function placeOrderViaExternalApi(customerId: number, customerName: string, orderItems: Array<{
    productId: number;
    productName: string;
    quantity: number;
    price: number;
}>, orderDate: string): Promise<PlaceOrderResponse>;
export {};
