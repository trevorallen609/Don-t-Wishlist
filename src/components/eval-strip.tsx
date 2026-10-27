"use client";

import { useMemo } from "react";
import { computeEvalSnapshot, formatPrecision } from "@/lib/eval-metrics";
import type { VerdictKind } from "@/lib/schemas";

type Props = {
  verdicts: Array<{ verdict: VerdictKind }>;
};

/** Live eval precision from human marks — uncommon in take-homes. */
export function EvalStrip({ verdicts }: Props) {
  const snapshot = useMemo(() => computeEvalSnapshot(verdicts), [verdicts]);
  const label = useMemo(() => formatPrecision(snapshot), [snapshot]);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-panel/60 px-3 py-2 text-sm">
      <span className="text-xs uppercase tracking-[0.18em] text-mist">Online eval</span>
      <span className="text-foam">{label}</span>
      <span className="text-xs text-mist">
        {snapshot.correct} correct · {snapshot.wrong} wrong · {snapshot.tooSafe} too-safe
      </span>
    </div>
  );
}
