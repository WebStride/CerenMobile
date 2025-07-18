var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { PrismaClient } from '@prisma/client';
import { info, error } from "../logs/index.js"; // Adjust the import path as necessary
const prisma = new PrismaClient();
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
            info("Customers:", customers); // Log the fetched customers
            res.json({ customers });
        }
        catch (err) {
            error("Error fetching customers:", err);
            res.status(500).json({ error: "Database error" });
        }
    }));
}
export default routes;
