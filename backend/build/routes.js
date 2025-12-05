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
const client_1 = require("@prisma/client");
const auth_1 = require("./controllers/auth");
const user_1 = require("./controllers/user");
const product_1 = require("./controllers/product");
const favourites_1 = require("./controllers/favourites");
const cart_1 = require("./controllers/cart");
const auth_2 = require("./middleware/auth");
const auth_3 = require("./controllers/auth");
const customer_1 = require("./controllers/customer");
const orders_1 = require("./controllers/orders");
const placeOrder_1 = require("./controllers/orders/placeOrder");
const prisma = new client_1.PrismaClient();
function routes(app) {
    app.get('/healthcheck', (req, res) => res.sendStatus(200));
    app.use((req, res, next) => {
        console.log("CORS Headers:", res.getHeaders()); // Log headers for each route
        next();
    });
    // Test route for DB connection and Prisma
    app.get('/test-db', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const customers = yield prisma.cUSTOMERMASTER.findMany({
                take: 10
            });
            console.log("Customers:", customers); // Log the fetched customers
            res.json({ customers });
        }
        catch (error) {
            console.error("Error fetching customers:", error);
            res.status(500).json({ error: "Database error" });
        }
    }));
    // Auth routes
    app.post("/auth/register", auth_1.register);
    // Public send-otp endpoint for frontend (no auth)
    app.post('/auth/send-otp', auth_1.sendOtpController);
    app.post("/auth/verify", auth_1.verifyPhoneNumber);
    app.post("/auth/test-otp", auth_1.testOTP); // Debug route
    // Public check-customer endpoint used by frontend before registration/login
    app.get('/auth/check-customer', auth_1.checkCustomerPublic);
    app.post("/auth/refresh", auth_1.refreshToken);
    app.post("/auth/logout", auth_1.logout);
    app.get('/auth/validate-token', auth_1.validateToken);
    // User routes
    app.post("/user/address", auth_2.authenticateToken, user_1.submitUserAddress);
    app.get("/user/addresses", auth_2.authenticateToken, user_1.getUserAddresses);
    app.put("/user/addresses/:addressId/default", auth_2.authenticateToken, user_1.setDefaultAddress);
    app.get("/user/default-address", auth_2.authenticateToken, user_1.getDefaultAddress);
    app.put("/user/addresses/:addressId", auth_2.authenticateToken, user_1.updateUserAddress);
    app.delete("/user/addresses/:addressId", auth_2.authenticateToken, user_1.deleteUserAddress);
    // Product routes (all protected with authentication)
    app.get("/products/exclusive", auth_2.authenticateToken, product_1.getExclusiveProductsList);
    app.get("/products/best-selling", auth_2.authenticateToken, product_1.getBestSelling);
    app.get("/products/newProducts", auth_2.authenticateToken, product_1.newProductsList);
    app.get("/products/buyAgain", auth_2.authenticateToken, product_1.buyAgainProductsList);
    app.get("/products/allProducts", auth_2.authenticateToken, product_1.allProductsList);
    app.get("/categories/subCategories/:categoryId", auth_2.authenticateToken, product_1.getSubCategories);
    app.get("/products/categories", auth_2.authenticateToken, product_1.getCategoryList);
    // Favourites routes
    app.get('/favourites', auth_2.authenticateToken, favourites_1.getFavourites);
    app.post('/favourites', auth_2.authenticateToken, favourites_1.postFavourite);
    app.delete('/favourites/:productId', auth_2.authenticateToken, favourites_1.deleteFavourite);
    // Cart routes
    app.get('/cart', auth_2.authenticateToken, cart_1.getCartList);
    app.post('/cart', auth_2.authenticateToken, cart_1.postCart);
    app.put('/cart/:productId', auth_2.authenticateToken, cart_1.putCartItem);
    app.delete('/cart/:productId', auth_2.authenticateToken, cart_1.deleteCartItem);
    app.post('/cart/clear', auth_2.authenticateToken, cart_1.postClearCart);
    app.get("/products/productsBySubCategory/:subCategoryId", auth_2.authenticateToken, product_1.productsBySubCategory);
    // Similar products by productId (returns other products in same CategoryID)
    app.get('/products/similar/:productId', auth_2.authenticateToken, product_1.similarProductsList);
    // Products by catalog - given a productId, return other products in same CatalogID
    app.get('/products/catalog/:productId', auth_2.authenticateToken, product_1.productsByCatalog);
    // Customer routes
    app.get('/customer/check', auth_2.authenticateToken, auth_3.checkCustomer);
    // Get stores associated with the authenticated user
    app.get('/customer/stores', auth_2.authenticateToken, customer_1.getStores);
    // Orders routes
    app.get('/orders', auth_2.authenticateToken, orders_1.getOrdersByCustomer);
    app.get('/orders/:orderId/items', auth_2.authenticateToken, orders_1.getOrderItemsByOrder);
    app.post('/orders/place', auth_2.authenticateToken, placeOrder_1.placeOrder);
    // Invoices routes
    app.get('/invoices', auth_2.authenticateToken, orders_1.getInvoicesByCustomer);
    app.get('/invoices/:invoiceId/items', auth_2.authenticateToken, orders_1.getInvoiceItemsByInvoice);
    // Maps proxy endpoints removed — using client-side keys / native SDKs instead
}
exports.default = routes;
//# sourceMappingURL=routes.js.map