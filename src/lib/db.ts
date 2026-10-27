import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Vercel lambdas are read-only except /tmp. Bundle a seed SQLite file,
 * copy it to /tmp on first cold start, and point Prisma there so register can write.
 * Data is per-instance / ephemeral — fine for the take-home demo.
 */
function resolveDatabaseUrl(): string {
  const fromEnv = process.env.DATABASE_URL;
  if (!process.env.VERCEL) {
    if (!fromEnv) {
      throw new Error("DATABASE_URL must be set (see .env.example)");
    }
    return fromEnv;
  }

  const writable = "/tmp/dont-wishlist.db";
  if (!existsSync(writable)) {
    const candidates = [
      path.join(process.cwd(), "prisma", "empty.db"),
      path.join(process.cwd(), "prisma", "dev.db"),
    ];
    const source = candidates.find((file) => existsSync(file));
    if (source) {
      copyFileSync(source, writable);
    }
  }

  return `file:${writable}`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: resolveDatabaseUrl() } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
