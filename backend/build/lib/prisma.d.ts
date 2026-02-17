import { PrismaClient } from '@prisma/client';
declare const prisma: PrismaClient<{
    log: ("warn" | "error")[];
    datasources: {
        db: {
            url: string | undefined;
        };
    };
}, never, import("@prisma/client/runtime/library").DefaultArgs>;
export default prisma;
