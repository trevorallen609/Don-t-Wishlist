import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { SAMPLE_LIBRARY } from "@/mocks/sample-library";

const COOKIE = "dw_session";

export type SessionUser = {
  id: string;
  email: string;
};

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET must be set (min 16 chars). Copy .env.example → .env");
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string, email: string) {
  const token = await new SignJWT({ sub: userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secretKey());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL),
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

async function readSession(): Promise<{ userId: string; email: string } | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const userId = typeof payload.sub === "string" ? payload.sub : null;
    if (!userId) return null;
    const email =
      typeof payload.email === "string" && payload.email.includes("@")
        ? payload.email
        : `restored-${userId.slice(0, 8)}@dont-wishlist.local`;
    return { userId, email };
  } catch {
    return null;
  }
}

export async function getSessionUserId(): Promise<string | null> {
  const session = await readSession();
  return session?.userId ?? null;
}

/**
 * Request-deduped auth. On Vercel, /tmp SQLite is per-instance: the cookie
 * can be valid while the user row is missing. Rehydrate from the JWT so
 * "Load sample backlog" does not bounce to /login.
 */
export const requireUser = cache(async (): Promise<SessionUser | null> => {
  const session = await readSession();
  if (!session) return null;

  const existing = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true },
  });
  if (existing) return existing;

  const created = await prisma.user.upsert({
    where: { email: session.email },
    create: {
      id: session.userId,
      email: session.email,
      passwordHash: await hashPassword(`vercel-ephemeral-${session.userId}`),
    },
    update: {},
    select: { id: true, email: true },
  });

  const gameCount = await prisma.game.count({ where: { userId: created.id } });
  if (gameCount === 0) {
    await prisma.game.createMany({
      data: SAMPLE_LIBRARY.map((g) => ({
        userId: created.id,
        title: g.title,
        status: g.status,
        hoursPlayed: g.hoursPlayed ?? null,
        notes: g.notes ?? null,
      })),
    });
  }

  return created;
});
