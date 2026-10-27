type Props = {
  fingerprint: string;
  dollarsRefused: number;
  engine: "rules" | "rules+llm";
  scoredAt: string;
};

/** Server component: decision provenance + $ refused receipt. */
export function ProvenanceBar({
  fingerprint,
  dollarsRefused,
  engine,
  scoredAt,
}: Props) {
  return (
    <dl className="grid gap-2 rounded-md border border-line bg-ink/50 px-3 py-3 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-xs uppercase tracking-[0.16em] text-mist">Dollars refused</dt>
        <dd className="font-display text-2xl text-go">
          ${dollarsRefused.toFixed(2)}
        </dd>
      </div>
      <div>
        <dt className="text-xs uppercase tracking-[0.16em] text-mist">Input fingerprint</dt>
        <dd className="font-mono text-foam">{fingerprint}</dd>
      </div>
      <div>
        <dt className="text-xs uppercase tracking-[0.16em] text-mist">Engine</dt>
        <dd className="text-foam">{engine}</dd>
      </div>
      <div>
        <dt className="text-xs uppercase tracking-[0.16em] text-mist">Scored at</dt>
        <dd className="text-foam">{new Date(scoredAt).toLocaleString()}</dd>
      </div>
    </dl>
  );
}
