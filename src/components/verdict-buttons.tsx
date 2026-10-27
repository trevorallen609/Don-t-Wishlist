"use client";

import { useActionState, useCallback, useMemo } from "react";
import { submitVerdictAction, type ActionState } from "@/lib/actions";
import type { VerdictKind } from "@/lib/schemas";

type Props = {
  saleCheckId: string;
  itemTitle: string;
};

const VERDICTS: readonly VerdictKind[] = ["correct", "wrong", "too_safe"];

export function VerdictButtons({ saleCheckId, itemTitle }: Props) {
  const [state, formAction, pending] = useActionState(submitVerdictAction, {} as ActionState);

  const labels = useMemo(
    () =>
      ({
        correct: "correct",
        wrong: "wrong",
        too_safe: "too safe",
      }) as const satisfies Record<VerdictKind, string>,
    [],
  );

  const renderLabel = useCallback((verdict: VerdictKind) => labels[verdict], [labels]);

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {VERDICTS.map((verdict) => (
        <form key={verdict} action={formAction}>
          <input type="hidden" name="saleCheckId" value={saleCheckId} />
          <input type="hidden" name="itemTitle" value={itemTitle} />
          <input type="hidden" name="verdict" value={verdict} />
          <button
            type="submit"
            disabled={pending}
            className="rounded border border-line px-2.5 py-1 text-xs text-mist hover:border-foam/40 hover:text-foam disabled:opacity-50"
          >
            {renderLabel(verdict)}
          </button>
        </form>
      ))}
      {state.ok ? <span className="text-xs text-go">saved</span> : null}
      {state.error ? <span className="text-xs text-signal">{state.error}</span> : null}
    </div>
  );
}
