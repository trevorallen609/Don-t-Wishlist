"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { GameCover } from "@/components/game-cover";
import { deleteGameAction } from "@/lib/actions";
import { assertNever } from "@/lib/exhaustive";
import type { GameStatus, LibraryGame } from "@/lib/schemas";

type Filter = "all" | GameStatus;

type Props = {
  games: LibraryGame[];
};

function statusClass(status: GameStatus): string {
  switch (status) {
    case "abandoned":
      return "text-signal";
    case "finished":
      return "text-go";
    case "playing":
      return "text-warn";
    default:
      return assertNever(status);
  }
}

export function LibraryList({ games }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (filter === "all") return games;
    return games.filter((g) => g.status === filter);
  }, [filter, games]);

  const counts = useMemo(() => {
    const base = { all: games.length, playing: 0, finished: 0, abandoned: 0 };
    for (const g of games) base[g.status] += 1;
    return base;
  }, [games]);

  const onFilter = useCallback((next: Filter) => {
    setFilter(next);
  }, []);

  const onDelete = useCallback((gameId: string) => {
    setPendingId(gameId);
    startTransition(async () => {
      await deleteGameAction(gameId);
      setPendingId(null);
    });
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter library">
        {(["all", "abandoned", "playing", "finished"] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            onClick={() => onFilter(key)}
            className={`rounded border px-2.5 py-1 text-xs ${
              filter === key
                ? "border-foam/50 text-foam"
                : "border-line text-mist hover:border-foam/30"
            }`}
          >
            {key} ({counts[key]})
          </button>
        ))}
      </div>

      <ul className="divide-y divide-line border border-line bg-panel/50">
        {filtered.map((g) => (
          <li key={g.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <GameCover title={g.title} size={44} />
              <div className="min-w-0">
                <p className="truncate font-medium text-foam">{g.title}</p>
                <p className="text-sm text-mist">
                  <span className={statusClass(g.status)}>{g.status}</span>
                  {g.hoursPlayed != null ? ` · ${g.hoursPlayed}h` : ""}
                  {g.notes ? ` · ${g.notes}` : ""}
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={isPending && pendingId === g.id}
              onClick={() => onDelete(g.id)}
              className="text-sm text-mist hover:text-signal disabled:opacity-50"
            >
              Remove
            </button>
          </li>
        ))}
        {filtered.length === 0 ? (
          <li className="px-4 py-8 text-center text-mist">No games in this filter.</li>
        ) : null}
      </ul>
    </div>
  );
}
