import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import {
  countLibrary,
  getLibraryGames,
  getRecentVerdicts,
  loadEngineContext,
  toLibraryGame,
} from "@/lib/queries";

async function seedUser(email: string) {
  return prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword("secret1"),
    },
  });
}

afterEach(async () => {
  await prisma.verdict.deleteMany();
  await prisma.saleCheck.deleteMany();
  await prisma.game.deleteMany();
  await prisma.user.deleteMany();
});

describe("toLibraryGame", () => {
  it("parses a valid status", () => {
    expect(
      toLibraryGame({
        id: "1",
        title: "Celeste",
        status: "finished",
        hoursPlayed: 8,
        notes: null,
      }).status,
    ).toBe("finished");
  });

  it("throws on corrupt status", () => {
    expect(() =>
      toLibraryGame({
        id: "1",
        title: "Celeste",
        status: "wishlist",
        hoursPlayed: null,
        notes: null,
      }),
    ).toThrow();
  });
});

describe("library queries", () => {
  it("counts and lists games per user", async () => {
    const user = await seedUser("a@example.com");
    const other = await seedUser("b@example.com");

    await prisma.game.createMany({
      data: [
        { userId: user.id, title: "Celeste", status: "finished" },
        { userId: user.id, title: "Hades", status: "abandoned" },
        { userId: other.id, title: "FIFA", status: "playing" },
      ],
    });

    expect(await countLibrary(user.id)).toBe(2);
    const games = await getLibraryGames(user.id);
    expect(games.map((g) => g.title).sort()).toEqual(["Celeste", "Hades"]);
    expect(games.every((g) => g.status === "finished" || g.status === "abandoned")).toBe(
      true,
    );
  });

  it("returns recent verdicts through sale checks", async () => {
    const user = await seedUser("c@example.com");
    const check = await prisma.saleCheck.create({
      data: {
        userId: user.id,
        candidates: "[]",
        result: "{}",
      },
    });
    await prisma.verdict.create({
      data: { saleCheckId: check.id, itemTitle: "Celeste", verdict: "correct" },
    });

    const verdicts = await getRecentVerdicts(user.id);
    expect(verdicts).toEqual([{ itemTitle: "Celeste", verdict: "correct" }]);
  });

  it("loads engine context in parallel without mixing users", async () => {
    const user = await seedUser("d@example.com");
    await prisma.game.create({
      data: { userId: user.id, title: "Portal", status: "finished" },
    });
    const ctx = await loadEngineContext(user.id);
    expect(ctx.games).toHaveLength(1);
    expect(ctx.verdicts).toEqual([]);
  });
});

describe("auth hashing", () => {
  it("verifies a matching password and rejects a wrong one", async () => {
    const { verifyPassword } = await import("@/lib/auth");
    const hash = await hashPassword("secret1");
    expect(await verifyPassword("secret1", hash)).toBe(true);
    expect(await verifyPassword("nope", hash)).toBe(false);
  });
});
