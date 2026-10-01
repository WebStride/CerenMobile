import { PrismaClient } from '@prisma/client';

// Singleton Prisma instance to avoid connection pool exhaustion
// Reuse the same instance across the application
const prisma = new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
});

// Connection retry logic
async function connectWithRetry(maxRetries = 3, delayMs = 2000): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$connect();
      console.log('✅ Database connected successfully');
      return;
    } catch (err: any) {
      console.error(`❌ Database connection attempt ${attempt}/${maxRetries} failed:`, err.message);
      
      if (attempt === maxRetries) {
        console.error('📍 Database URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')); // Hide password
        console.error('💡 Please check:');
        console.error('   1. Database server is running');
        console.error('   2. Your IP is whitelisted:', '(Use: curl https://ifconfig.me)');
        console.error('   3. Database credentials are correct');
        console.error('   4. Network/firewall allows connection to port 55656');
        throw err;
      }
      
      console.log(`⏳ Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

// Test connection on startup with retry
connectWithRetry().catch(err => {
  console.error('🚨 Failed to establish database connection after multiple attempts');
  console.error('⚠️  Server will continue running but database operations will fail');
});

// Disconnect only on real process shutdown — NOT beforeExit.
// beforeExit can fire while the HTTP server is still up (Prisma idle),
// which closes the pool and breaks API calls during local/dev runs.
async function disconnectPrisma(signal: string) {
  try {
    await prisma.$disconnect();
    console.log(`🔌 Database disconnected (${signal})`);
  } catch (err: any) {
    console.error('Prisma disconnect error:', err?.message || err);
  }
}

process.once('SIGINT', async () => {
  await disconnectPrisma('SIGINT');
  process.exit(0);
});
process.once('SIGTERM', async () => {
  await disconnectPrisma('SIGTERM');
  process.exit(0);
});

export default prisma;
