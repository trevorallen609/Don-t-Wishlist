"use client";

import { useCallback, useMemo, useState } from "react";
import type { RefusalItem } from "@/lib/schemas";

type Props = {
  item: RefusalItem;
};

/** Client island: expand weighted score ledger (staff demo moment). */
export function DecisionAutopsy({ item }: Props) {
  const [open, setOpen] = useState(false);

  const sorted = useMemo(
    () => [...item.ledger].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)),
    [item.ledger],
  );

  const toggle = useCallback(() => {
    setOpen((v) => !v);
  }, []);

  if (sorted.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={toggle}
        className="text-xs text-mist underline-offset-2 hover:text-foam hover:underline"
        aria-expanded={open}
      >
        {open ? "Hide" : "Show"} score autopsy · refuse {item.refuseScore}
      </button>
      {open ? (
        <ul className="mt-2 space-y-1 border border-line/70 bg-ink/40 px-3 py-2 font-mono text-[11px] text-mist">
          {sorted.map((row) => (
            <li key={`${row.code}-${row.label}`} className="flex justify-between gap-3">
              <span>{row.label}</span>
              <span className={row.weight >= 0 ? "text-signal" : "text-go"}>
                {row.weight >= 0 ? "+" : ""}
                {row.weight.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
