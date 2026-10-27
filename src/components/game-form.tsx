"use client";

import { useActionState, useMemo } from "react";
import { addGameAction, type ActionState } from "@/lib/actions";

export function GameForm() {
  const [state, formAction, pending] = useActionState(addGameAction, {} as ActionState);

  const submitLabel = useMemo(
    () => (pending ? "Adding…" : "Add to library"),
    [pending],
  );

  return (
    <form
      action={formAction}
      className="grid gap-3 rounded-lg border border-line bg-panel/70 p-4 sm:grid-cols-2"
    >
      <label className="space-y-1 sm:col-span-2">
        <span className="text-sm text-mist">Game title</span>
        <input
          name="title"
          required
          className="w-full rounded-md border border-line bg-ink/60 px-3 py-2 outline-none focus:ring-2 focus:ring-signal/40"
          placeholder="Cyberpunk 2077"
        />
      </label>
      <label className="space-y-1">
        <span className="text-sm text-mist">Status</span>
        <select
          name="status"
          className="w-full rounded-md border border-line bg-ink/60 px-3 py-2 outline-none focus:ring-2 focus:ring-signal/40"
          defaultValue="abandoned"
        >
          <option value="abandoned">Abandoned</option>
          <option value="playing">Playing</option>
          <option value="finished">Finished</option>
        </select>
      </label>
      <label className="space-y-1">
        <span className="text-sm text-mist">Hours (optional)</span>
        <input
          name="hoursPlayed"
          type="number"
          min={0}
          step={0.5}
          className="w-full rounded-md border border-line bg-ink/60 px-3 py-2 outline-none focus:ring-2 focus:ring-signal/40"
        />
      </label>
      <label className="space-y-1 sm:col-span-2">
        <span className="text-sm text-mist">Notes</span>
        <input
          name="notes"
          className="w-full rounded-md border border-line bg-ink/60 px-3 py-2 outline-none focus:ring-2 focus:ring-signal/40"
          placeholder="Why you bounced"
        />
      </label>
      {state.error ? <p className="text-sm text-signal sm:col-span-2">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-foam px-4 py-2 font-medium text-ink hover:brightness-95 disabled:opacity-60 sm:col-span-2"
      >
        {submitLabel}
      </button>
    </form>
  );
}
