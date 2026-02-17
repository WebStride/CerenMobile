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
// Singleton Prisma instance to avoid connection pool exhaustion
// Reuse the same instance across the application
const prisma = new client_1.PrismaClient({
    log: ['error', 'warn'],
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    },
});
// Connection retry logic
function connectWithRetry() {
    return __awaiter(this, arguments, void 0, function* (maxRetries = 3, delayMs = 2000) {
        var _a;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                yield prisma.$connect();
                console.log('✅ Database connected successfully');
                return;
            }
            catch (err) {
                console.error(`❌ Database connection attempt ${attempt}/${maxRetries} failed:`, err.message);
                if (attempt === maxRetries) {
                    console.error('📍 Database URL:', (_a = process.env.DATABASE_URL) === null || _a === void 0 ? void 0 : _a.replace(/:[^:@]+@/, ':****@')); // Hide password
                    console.error('💡 Please check:');
                    console.error('   1. Database server is running');
                    console.error('   2. Your IP is whitelisted:', '(Use: curl https://ifconfig.me)');
                    console.error('   3. Database credentials are correct');
                    console.error('   4. Network/firewall allows connection to port 55656');
                    throw err;
                }
                console.log(`⏳ Retrying in ${delayMs}ms...`);
                yield new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    });
}
// Test connection on startup with retry
connectWithRetry().catch(err => {
    console.error('🚨 Failed to establish database connection after multiple attempts');
    console.error('⚠️  Server will continue running but database operations will fail');
});
// Graceful shutdown
process.on('beforeExit', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
    console.log('🔌 Database disconnected');
}));
exports.default = prisma;
//# sourceMappingURL=prisma.js.map