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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// import routes from "./routes";
dotenv_1.default.config();
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
console.log("cors enabled");
app.use((0, cors_1.default)({
    origin: '*', // Allow only your frontend origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed HTTP methods
    credentials: true // Set to true if the frontend uses cookies/auth headers
}));
app.use(express_1.default.json());
// Simple request timing middleware to log response durations
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const ms = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} ${ms}ms`);
    });
    next();
});
// Health endpoint for quick reachability and latency checks
app.get('/health', (_req, res) => {
    res.json({ ok: true, now: new Date().toISOString() });
});
const port = parseInt(process.env.PORT || '3002');
const host = process.env.HOST || '0.0.0.0';
app.listen(port, host, () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`App is running at port: http://${host}:${port}`);
    yield (0, routes_1.default)(app);
}));
exports.default = app;
//# sourceMappingURL=app.js.map