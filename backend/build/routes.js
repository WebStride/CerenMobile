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
const auth_2 = require("./middleware/auth");
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
    app.post("/auth/verify", auth_1.verifyPhoneNumber);
    app.post("/auth/refresh", auth_1.refreshToken);
    app.post("/auth/logout", auth_1.logout);
    // User routes
    app.post("/user/address", user_1.submitUserAddress);
    // Product routes (all protected with authentication)
    app.get("/products/exclusive", auth_2.authenticateToken, product_1.getExclusiveProductsList);
    app.get("/products/best-selling", auth_2.authenticateToken, product_1.getBestSelling);
    app.get("/products/categories", auth_2.authenticateToken, product_1.getCategoryList);
}
exports.default = routes;
