var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from "express";
import cors from "cors";
import dotenv from 'dotenv';
import routes from "./routes.js";
dotenv.config();
import { info } from "../logs/index.js";
const app = express();
console.log("cors enabled");
app.use(cors({
    origin: '*', // Allow only your frontend origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed HTTP methods
    credentials: true // Set to true if the frontend uses cookies/auth headers
}));
app.use(express.json());
const port = parseInt(process.env.PORT || '3002');
const host = process.env.HOST || '0.0.0.0';
app.listen(port, host, () => __awaiter(void 0, void 0, void 0, function* () {
    info(`App is running at port: http://${host}:${port}`);
    yield routes(app);
}));
export default app;
