import type { GameStatus, LibraryGame } from "@/lib/schemas";

export type StatusCounts = Record<GameStatus, number>;

export function summarizeLibrary(games: LibraryGame[]): StatusCounts {
  const counts: StatusCounts = { playing: 0, finished: 0, abandoned: 0 };
  for (const g of games) {
    counts[g.status] += 1;
  }
  return counts;
}
