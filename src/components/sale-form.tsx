"use client";

import { useActionState, useMemo } from "react";
import { runSaleCheckAction, type ActionState } from "@/lib/actions";
import { SAMPLE_SALE_CANDIDATES } from "@/mocks/sample-library";

export function SaleForm() {
  const [state, formAction, pending] = useActionState(runSaleCheckAction, {} as ActionState);

  const placeholder = useMemo(
    () =>
      SAMPLE_SALE_CANDIDATES.map((c) =>
        c.price != null ? `${c.title} ${c.price}` : c.title,
      ).join("\n"),
    [],
  );

  return (
    <form action={formAction} className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm text-mist">
          Sale candidates — one title per line (optional price at end)
        </span>
        <textarea
          name="candidates"
          required
          rows={8}
          defaultValue={placeholder}
          className="w-full rounded-md border border-line bg-ink/60 px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-signal/40"
        />
      </label>
      {state.error ? <p className="text-sm text-signal">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-signal px-4 py-2.5 font-medium text-ink hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Judging…" : "Tell me what NOT to buy"}
      </button>
    </form>
  );
}
