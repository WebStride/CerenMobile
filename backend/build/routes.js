"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
const support_1 = require("./controllers/support");
const maps_1 = require("./controllers/maps");
function routes(app) {
    app.get('/healthcheck', (req, res) => res.sendStatus(200));
    // Auth routes
    app.post("/auth/register", auth_1.register);
    // Public send-otp endpoint for frontend (no auth)
    app.post('/auth/send-otp', auth_1.sendOtpController);
    app.post("/auth/verify", auth_1.verifyPhoneNumber);
    if (process.env.NODE_ENV === 'development') {
        app.post("/auth/test-otp", auth_1.testOTP); // Debug route — dev only
    }
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
    app.get("/user/master-address", auth_2.authenticateToken, user_1.getUserMasterAddress);
    app.put("/user/addresses/:addressId", auth_2.authenticateToken, user_1.updateUserAddress);
    app.delete("/user/addresses/:addressId", auth_2.authenticateToken, user_1.deleteUserAddress);
    // Product routes (guest browsing allowed)
    app.get("/products/exclusive", product_1.getExclusiveProductsList);
    app.get("/products/best-selling", product_1.getBestSelling);
    app.get("/products/newProducts", product_1.newProductsList);
    app.get("/products/buyAgain", auth_2.authenticateToken, product_1.buyAgainProductsList);
    app.get("/products/allProducts", product_1.allProductsList);
    app.get("/categories/subCategories/:categoryId", product_1.getSubCategories);
    app.get("/products/categories", product_1.getCategoryList);
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
    app.get("/products/productsBySubCategory/:subCategoryId", product_1.productsBySubCategory);
    // Similar products by productId (returns other products in same CategoryID)
    app.get('/products/similar/:productId', product_1.similarProductsList);
    // Products by catalog - given a productId, return other products in same CatalogID
    app.get('/products/catalog/:productId', product_1.productsByCatalog);
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
    app.post('/invoices/by-customer', auth_2.authenticateToken, orders_1.getInvoicesForCustomer);
    // Support routes
    app.post('/support/contact-us', support_1.submitContactUs);
    // Maps proxy endpoints
    app.get('/maps/place-autocomplete', maps_1.placeAutocomplete);
    app.get('/maps/place-details', maps_1.placeDetails);
    app.get('/maps/geocode', maps_1.geocode);
}
exports.default = routes;
//# sourceMappingURL=routes.js.map