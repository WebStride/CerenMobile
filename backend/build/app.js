"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const MSG91_PLACEHOLDER_VALUES = new Set([
    'msg91_auth_key',
    'msg91_template_id',
    'msg91_api_key',
    'your_dev_msg91_key',
    'your_dev_template_id',
    'your_prod_msg91_key',
    'your_prod_template_id',
]);
function shouldSkipEnvOverride(key, value) {
    if (!['MSG91_AUTH_KEY', 'MSG91_TEMPLATE_ID', 'MSG91_API_KEY'].includes(key)) {
        return false;
    }
    return MSG91_PLACEHOLDER_VALUES.has(value.trim().toLowerCase());
}
function loadEnvFile(filePath, sourceLabel, overrideExisting) {
    const parsed = dotenv_1.default.parse(fs_1.default.readFileSync(filePath));
    Object.entries(parsed).forEach(([key, value]) => {
        if (shouldSkipEnvOverride(key, value)) {
            console.warn(`⚠️  Skipping placeholder ${key} from ${sourceLabel}; keeping existing value.`);
            return;
        }
        if (overrideExisting || process.env[key] === undefined) {
            process.env[key] = value;
        }
    });
}
// Load environment variables based on NODE_ENV
const nodeEnv = (process.env.NODE_ENV || 'development').trim();
const defaultEnvPath = path_1.default.resolve(process.cwd(), '.env');
const envPath = path_1.default.resolve(process.cwd(), `.env.${nodeEnv}`);
if (fs_1.default.existsSync(defaultEnvPath)) {
    console.log('🛠️  Loading default .env file');
    loadEnvFile(defaultEnvPath, '.env', false);
}
if (fs_1.default.existsSync(envPath)) {
    console.log(`🛠️  Loading env file: ${envPath}`);
    loadEnvFile(envPath, `.env.${nodeEnv}`, true);
}
else if (!fs_1.default.existsSync(defaultEnvPath)) {
    console.warn(`⚠️  No .env file found for NODE_ENV=${nodeEnv}. Falling back to process env values.`);
}
const routes = require('./routes').default;
const app = (0, express_1.default)();
console.log("cors enabled");
app.use((0, cors_1.default)({
    origin: '*', // Allow only your frontend origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed HTTP methods
    credentials: true // Set to true if the frontend uses cookies/auth headers
}));
// Gzip all responses — reduces JSON payload ~80-90% over internet connections
app.use((0, compression_1.default)());
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
// Register routes before starting the server — avoids race-condition 404s on startup
routes(app);
// Fix Node.js (5s default) vs Nginx (65s) keepAlive mismatch.
// Without this, Node closes keep-alive connections before Nginx does, causing
// ECONNRESET + TCP+TLS retry on random requests (~150-400ms penalty each).
const server = app.listen(port, host, () => {
    console.log(`App is running at port: http://${host}:${port}`);
});
server.keepAliveTimeout = 65000; // must exceed Nginx keepalive_timeout (65s)
server.headersTimeout = 66000; // must be > keepAliveTimeout
exports.default = app;
//# sourceMappingURL=app.js.map