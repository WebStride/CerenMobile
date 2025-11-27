interface ExternalLoginResponse {
    token?: string;
    success?: boolean;
    message?: string;
}

interface OrderItem {
    ProductID: number;
    ProductName: string;
    OrderQty: number;
    Price: number;
}

interface PlaceOrderPayload {
    OrderDate: string;
    CustomerID: number;
    CustomerName: string;
    ListOrderItems: OrderItem[];
    OrderItemCount: number;
}

interface PlaceOrderResponse {
    success: boolean;
    message?: string;
    orderId?: number;
    data?: any;
}

const EXTERNAL_API_URL = process.env.EXTERNAL_API_URL || 'http://3.109.147.219/test/api';
const EXTERNAL_API_USERNAME = process.env.EXTERNAL_API_USERNAME || 'testuser';
const EXTERNAL_API_PASSWORD = process.env.EXTERNAL_API_PASSWORD || 'testpassword';

/**
 * Authenticate with external API and get token
 */
async function getExternalApiToken(): Promise<string | null> {
    try {
        console.log('🔐 Authenticating with external API...');
        console.log('🔗 API URL:', EXTERNAL_API_URL);
        console.log('👤 Username:', EXTERNAL_API_USERNAME);
        
        const response = await fetch(`${EXTERNAL_API_URL}/accounts/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: EXTERNAL_API_USERNAME,
                password: EXTERNAL_API_PASSWORD,
            }),
        });

        console.log('📡 Login response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ External API login failed:', response.status, errorText);
            return null;
        }

        const data: ExternalLoginResponse = await response.json();
        console.log('📥 Login response data:', data);
        
        if (data.token) {
            console.log('✅ External API authentication successful');
            return data.token;
        }

        console.error('❌ No token received from external API');
        return null;
    } catch (error) {
        console.error('❌ Error authenticating with external API:', error);
        return null;
    }
}

/**
 * Place order via external API
 */
export async function placeOrderViaExternalApi(
    customerId: number,
    customerName: string,
    orderItems: Array<{
        productId: number;
        productName: string;
        quantity: number;
        price: number;
    }>
): Promise<PlaceOrderResponse> {
    try {
        // Step 1: Get authentication token
        const token = await getExternalApiToken();
        
        if (!token) {
            return {
                success: false,
                message: 'Failed to authenticate with external order API',
            };
        }

        // Step 2: Prepare order payload
        const orderDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
        
        const payload: PlaceOrderPayload = {
            OrderDate: orderDate,
            CustomerID: customerId,
            CustomerName: customerName,
            ListOrderItems: orderItems.map(item => ({
                ProductID: item.productId,
                ProductName: item.productName,
                OrderQty: item.quantity,
                Price: item.price,
            })),
            OrderItemCount: orderItems.length,
        };

        console.log('📦 Placing order via external API:', JSON.stringify(payload, null, 2));

        // Step 3: Create order
        const response = await fetch(`${EXTERNAL_API_URL}/Order/CreateNewOrder`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        console.log('📡 CreateNewOrder response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ External API CreateNewOrder failed:', response.status, errorText);
            return {
                success: false,
                message: `Failed to create order (${response.status}): ${errorText || response.statusText}`,
            };
        }

        const data = await response.json();
        console.log('✅ Order created successfully via external API:', data);

        return {
            success: true,
            message: 'Order placed successfully',
            data,
        };
    } catch (error: any) {
        console.error('❌ Error placing order via external API:', error);
        return {
            success: false,
            message: error.message || 'An unexpected error occurred while placing order',
        };
    }
}
