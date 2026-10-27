import { createHash } from "node:crypto";
import type { LibraryGame, SaleCandidate, VerdictKind } from "@/lib/schemas";

type FingerprintInput = {
  games: Pick<LibraryGame, "title" | "status" | "hoursPlayed">[];
  candidates: SaleCandidate[];
  verdicts: Array<{ itemTitle: string; verdict: VerdictKind }>;
};

/**
 * STAFF TOUCH #1 — Content-addressed decision provenance.
 * Same inputs → same fingerprint. Lets reviewers prove a regenerate
 * actually consumed verdicts (hash changes) instead of trusting UI copy.
 */
export function fingerprintDecisionInputs(input: FingerprintInput): string {
  const canonical = JSON.stringify({
    games: [...input.games]
      .map((g) => ({
        title: g.title.trim().toLowerCase(),
        status: g.status,
        hours: g.hoursPlayed ?? null,
      }))
      .sort((a, b) => a.title.localeCompare(b.title)),
    candidates: [...input.candidates]
      .map((c) => ({
        title: c.title.trim().toLowerCase(),
        price: c.price ?? null,
        note: c.note?.trim().toLowerCase() ?? null,
      }))
      .sort((a, b) => a.title.localeCompare(b.title)),
    verdicts: [...input.verdicts]
      .map((v) => ({
        item: v.itemTitle.trim().toLowerCase(),
        verdict: v.verdict,
      }))
      .sort((a, b) => a.item.localeCompare(b.item) || a.verdict.localeCompare(b.verdict)),
  });

  return createHash("sha256").update(canonical).digest("hex").slice(0, 16);
}
