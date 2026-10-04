import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from '@prisma/adapter-libsql';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || "file:./dev.db",
});


// Prevent multiple instances in dev (Next.js hot reload)
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
