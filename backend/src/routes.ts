import { Express, Request, Response } from "express";
import { PrismaClient } from '@prisma/client';
import { register, verifyPhoneNumber, refreshToken, logout } from "./controllers/auth";
import { submitUserAddress } from "./controllers/user";
import { 
    getExclusiveProductsList,
    getBestSelling,
    getCategoryList
} from "./controllers/product";
import { authenticateToken } from "./middleware/auth";

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
    app.post("/auth/verify", verifyPhoneNumber);
    app.post("/auth/refresh", refreshToken);
    app.post("/auth/logout", logout);

    // User routes
    app.post("/user/address", submitUserAddress);

    // Product routes (all protected with authentication)
    app.get("/products/exclusive", authenticateToken, getExclusiveProductsList);
    app.get("/products/best-selling", authenticateToken, getBestSelling);
    app.get("/products/categories", authenticateToken, getCategoryList);
}



export default routes;

