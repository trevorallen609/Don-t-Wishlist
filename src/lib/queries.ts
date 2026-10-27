import "server-only";

import { prisma } from "@/lib/db";
import type { LibraryGame, VerdictKind } from "@/lib/schemas";
import { gameStatusSchema } from "@/lib/schemas";

export { summarizeLibrary } from "@/lib/library-stats";
export type { StatusCounts } from "@/lib/library-stats";

export function toLibraryGame(row: {
  id: string;
  title: string;
  status: string;
  hoursPlayed: number | null;
  notes: string | null;
}): LibraryGame {
  return {
    id: row.id,
    title: row.title,
    status: gameStatusSchema.parse(row.status),
    hoursPlayed: row.hoursPlayed,
    notes: row.notes,
  };
}

export async function getLibraryGames(userId: string): Promise<LibraryGame[]> {
  const rows = await prisma.game.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toLibraryGame);
}

export async function getRecentVerdicts(userId: string, take = 80) {
  const rows = await prisma.verdict.findMany({
    where: { saleCheck: { userId } },
    orderBy: { createdAt: "desc" },
    take,
    select: { itemTitle: true, verdict: true },
  });
  return rows.map((v) => ({
    itemTitle: v.itemTitle,
    verdict: v.verdict as VerdictKind,
  }));
}

/** Parallel loader used by sale-check actions — kills auth/data waterfalls. */
export async function loadEngineContext(userId: string) {
  const [games, verdicts] = await Promise.all([
    getLibraryGames(userId),
    getRecentVerdicts(userId),
  ]);
  return { games, verdicts };
}

export async function countLibrary(userId: string) {
  return prisma.game.count({ where: { userId } });
}
