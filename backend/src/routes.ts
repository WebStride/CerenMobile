import { Express, Request, Response } from "express";
import { PrismaClient } from '@prisma/client';
import { info, error } from "../logs/index.js" // Adjust the import path as necessary
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
            info("Customers:", customers); // Log the fetched customers
            res.json({ customers });
        } catch (err) {
            error("Error fetching customers:", err as any);
            res.status(500).json({ error: "Database error" });
        }
    });
}

export default routes;