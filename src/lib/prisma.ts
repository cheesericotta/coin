import { PrismaClient } from "@prisma/client";
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Initialize prisma client
let prisma: PrismaClient;

if (typeof window === "undefined") {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  prisma = globalForPrisma.prisma;
} else {
  // Dummy client for client-side which shouldn't happen but needed to satisfy type
  prisma = new PrismaClient();
}

export { prisma };

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
