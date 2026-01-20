"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.placeOrderViaExternalApi = placeOrderViaExternalApi;
const EXTERNAL_API_URL = process.env.EXTERNAL_API_URL || 'http://3.109.147.219/test/api';
const EXTERNAL_API_USERNAME = process.env.EXTERNAL_API_USERNAME || 'testuser';
const EXTERNAL_API_PASSWORD = process.env.EXTERNAL_API_PASSWORD || 'testpassword';
/**
 * Authenticate with external API and get token
 */
function getExternalApiToken() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🔐 Authenticating with external API...');
            console.log('🔗 API URL:', EXTERNAL_API_URL);
            console.log('👤 Username:', EXTERNAL_API_USERNAME);
            const response = yield fetch(`${EXTERNAL_API_URL}/accounts/login`, {
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
                const errorText = yield response.text();
                console.error('❌ External API login failed:', response.status, errorText);
                return null;
            }
            const data = yield response.json();
            console.log('📥 Login response data:', data);
            if (data.token) {
                console.log('✅ External API authentication successful');
                return data.token;
            }
            console.error('❌ No token received from external API');
            return null;
        }
        catch (error) {
            console.error('❌ Error authenticating with external API:', error);
            return null;
        }
    });
}
/**
 * Place order via external API
 */
function placeOrderViaExternalApi(customerId, customerName, orderItems, orderDate) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Step 1: Get authentication token
            const token = yield getExternalApiToken();
            if (!token) {
                return {
                    success: false,
                    message: 'Failed to authenticate with external order API',
                };
            }
            // Step 2: Prepare order payload
            // Use the orderDate provided by the user
            const payload = {
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
            const response = yield fetch(`${EXTERNAL_API_URL}/Order/CreateNewOrder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            console.log('📡 CreateNewOrder response status:', response.status);
            if (!response.ok) {
                const errorText = yield response.text();
                console.error('❌ External API CreateNewOrder failed:', response.status, errorText);
                return {
                    success: false,
                    message: `Failed to create order (${response.status}): ${errorText || response.statusText}`,
                };
            }
            const data = yield response.json();
            console.log('✅ Order created successfully via external API:', data);
            return {
                success: true,
                message: 'Order placed successfully',
                data,
            };
        }
        catch (error) {
            console.error('❌ Error placing order via external API:', error);
            return {
                success: false,
                message: error.message || 'An unexpected error occurred while placing order',
            };
        }
    });
}
//# sourceMappingURL=placeOrder.js.map