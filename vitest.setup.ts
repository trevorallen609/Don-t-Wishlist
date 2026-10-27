import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

process.env.AUTH_SECRET ??= "test-secret-at-least-16-chars!!";
process.env.DATABASE_URL = "file:./prisma/test.db";

const dbPath = path.resolve("prisma/test.db");
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
if (fs.existsSync(`${dbPath}-journal`)) fs.unlinkSync(`${dbPath}-journal`);

execSync("npx prisma db push --skip-generate --accept-data-loss", {
  stdio: "pipe",
  env: { ...process.env, DATABASE_URL: "file:./prisma/test.db" },
});
