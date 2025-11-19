import { PrismaClient } from '@prisma/client';

// Singleton Prisma instance to avoid connection pool exhaustion
// Reuse the same instance across the application
const prisma = new PrismaClient();

export default prisma;
