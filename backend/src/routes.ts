import { Express, Request, Response } from "express";
import { PrismaClient } from '@prisma/client';
import { register, verifyPhoneNumber, refreshToken, logout, validateToken, testOTP, checkCustomerPublic, sendOtpController } from "./controllers/auth";
import { submitUserAddress, getUserAddresses, setDefaultAddress, getDefaultAddress, updateUserAddress, deleteUserAddress, getUserMasterAddress } from "./controllers/user";
import {
    getExclusiveProductsList,
    getBestSelling,
    getCategoryList,
    newProductsList,
    buyAgainProductsList,
    allProductsList,
    getSubCategories,
    productsBySubCategory,
    similarProductsList,
    productsByCatalog
} from "./controllers/product";
import { getFavourites, postFavourite, deleteFavourite } from "./controllers/favourites";
import { getCartList, postCart, putCartItem, deleteCartItem, postClearCart } from "./controllers/cart";
import { authenticateToken } from "./middleware/auth";
import { checkCustomer } from "./controllers/auth";
import { getStores } from "./controllers/customer";
import { getOrdersByCustomer, getOrderItemsByOrder, getInvoicesByCustomer, getInvoiceItemsByInvoice, getInvoicesForCustomer } from "./controllers/orders";
import { placeOrder } from "./controllers/orders/placeOrder";
import { submitContactUs } from "./controllers/support";
const prisma = new PrismaClient();

function routes(app: Express) {

    app.get('/healthcheck', (req: Request, res: Response) => res.sendStatus(200));

    app.use((req: Request, res: Response, next) => {
        console.log("CORS Headers:", res.getHeaders()); // Log headers for each route
        next();
    });

    // Test route for DB connection and Prisma
    app.get('/test-db', async (req: Request, res: Response) => {
        try {
            const customers = await prisma.cUSTOMERMASTER.findMany({
                take: 10
            });
            console.log("Customers:", customers); // Log the fetched customers
            res.json({ customers });
        } catch (error) {
            console.error("Error fetching customers:", error);
            res.status(500).json({ error: "Database error" });
        }
    });


    // Auth routes
    app.post("/auth/register", register);
    // Public send-otp endpoint for frontend (no auth)
    app.post('/auth/send-otp', sendOtpController);
    app.post("/auth/verify", verifyPhoneNumber);
    app.post("/auth/test-otp", testOTP); // Debug route
    // Public check-customer endpoint used by frontend before registration/login
    app.get('/auth/check-customer', checkCustomerPublic);
    app.post("/auth/refresh", refreshToken);
    app.post("/auth/logout", logout);
    app.get('/auth/validate-token', validateToken);

    // User routes
    app.post("/user/address", authenticateToken, submitUserAddress);
    app.get("/user/addresses", authenticateToken, getUserAddresses);
    app.put("/user/addresses/:addressId/default", authenticateToken, setDefaultAddress);
    app.get("/user/default-address", authenticateToken, getDefaultAddress);
    app.get("/user/master-address", authenticateToken, getUserMasterAddress);
    app.put("/user/addresses/:addressId", authenticateToken, updateUserAddress);
    app.delete("/user/addresses/:addressId", authenticateToken, deleteUserAddress);

    // Product routes (guest browsing allowed)
    app.get("/products/exclusive", getExclusiveProductsList);
    app.get("/products/best-selling", getBestSelling);
    app.get("/products/newProducts", newProductsList);
    app.get("/products/buyAgain", authenticateToken, buyAgainProductsList);
    app.get("/products/allProducts", allProductsList);


    app.get("/categories/subCategories/:categoryId", getSubCategories);
    app.get("/products/categories", getCategoryList);

    // Favourites routes
    app.get('/favourites', authenticateToken, getFavourites);
    app.post('/favourites', authenticateToken, postFavourite);
    app.delete('/favourites/:productId', authenticateToken, deleteFavourite);

    // Cart routes
    app.get('/cart', authenticateToken, getCartList);
    app.post('/cart', authenticateToken, postCart);
    app.put('/cart/:productId', authenticateToken, putCartItem);
    app.delete('/cart/:productId', authenticateToken, deleteCartItem);
    app.post('/cart/clear', authenticateToken, postClearCart);

    app.get(
  "/products/productsBySubCategory/:subCategoryId",
  productsBySubCategory
);

        // Similar products by productId (returns other products in same CategoryID)
        app.get('/products/similar/:productId', similarProductsList);

        // Products by catalog - given a productId, return other products in same CatalogID
        app.get('/products/catalog/:productId', productsByCatalog);

    // Customer routes
    app.get('/customer/check', authenticateToken, checkCustomer);
    // Get stores associated with the authenticated user
    app.get('/customer/stores', authenticateToken, getStores);

    // Orders routes
    app.get('/orders', authenticateToken, getOrdersByCustomer);
    app.get('/orders/:orderId/items', authenticateToken, getOrderItemsByOrder);
    app.post('/orders/place', authenticateToken, placeOrder);
    
    // Invoices routes
    app.get('/invoices', authenticateToken, getInvoicesByCustomer);
    app.get('/invoices/:invoiceId/items', authenticateToken, getInvoiceItemsByInvoice);
    app.post('/invoices/by-customer', authenticateToken, getInvoicesForCustomer);

    // Support routes
    app.post('/support/contact-us', submitContactUs);
    
    // Maps proxy endpoints removed — using client-side keys / native SDKs instead
    
}



export default routes;

