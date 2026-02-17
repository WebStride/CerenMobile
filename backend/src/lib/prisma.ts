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

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  console.log('🔌 Database disconnected');
});

export default prisma;
