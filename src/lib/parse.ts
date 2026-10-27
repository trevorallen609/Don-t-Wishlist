import { saleCandidateSchema, saleResultSchema, type SaleCandidate, type SaleResult } from "@/lib/schemas";
import { err, ok, type Result } from "@/lib/result";

export function parseSaleResult(raw: string): Result<SaleResult, string> {
  try {
    const json: unknown = JSON.parse(raw);
    const parsed = saleResultSchema.safeParse(json);
    if (!parsed.success) {
      // Back-compat for older rows missing staff fields
      if (typeof json === "object" && json !== null && !Array.isArray(json)) {
        const legacy = json as Record<string, unknown>;
        const upgraded = saleResultSchema.safeParse({
          hardNos: Array.isArray(legacy.hardNos)
            ? legacy.hardNos.map((item) => {
                const row = item as Record<string, unknown>;
                return {
                  title: String(row.title ?? ""),
                  reason: String(row.reason ?? ""),
                  signals: Array.isArray(row.signals) ? row.signals : [],
                  refuseScore: Number(row.refuseScore ?? 0),
                  ledger: Array.isArray(row.ledger) ? row.ledger : [],
                };
              })
            : [],
          reluctantYes: legacy.reluctantYes
            ? {
                ...(legacy.reluctantYes as object),
                refuseScore: 0,
                ledger: [],
              }
            : null,
          buyNothing: Boolean(legacy.buyNothing),
          summary: String(legacy.summary ?? ""),
          engine: legacy.engine === "rules+llm" ? "rules+llm" : "rules",
          dollarsRefused: Number(legacy.dollarsRefused ?? 0),
          inputFingerprint: String(legacy.inputFingerprint ?? "legacy-unknown"),
          scoredAt: String(legacy.scoredAt ?? new Date(0).toISOString()),
        });
        if (upgraded.success) return ok(upgraded.data);
      }
      return err("Corrupt sale result payload");
    }
    return ok(parsed.data);
  } catch {
    return err("Invalid JSON in sale result");
  }
}

export function parseCandidates(raw: string): Result<SaleCandidate[], string> {
  try {
    const json: unknown = JSON.parse(raw);
    const parsed = saleCandidateSchema.array().safeParse(json);
    if (!parsed.success) return err("Corrupt candidates payload");
    return ok(parsed.data);
  } catch {
    return err("Invalid JSON in candidates");
  }
}

export function parseCandidateLines(raw: string): Result<SaleCandidate[], string> {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return err("Paste at least 2 candidate titles (one per line).");
  }

  const candidates: SaleCandidate[] = [];
  for (const line of lines) {
    const priceMatch = line.match(/\$?\s*(\d+(?:\.\d+)?)\s*$/);
    const price = priceMatch ? Number(priceMatch[1]) : undefined;
    const title = priceMatch ? line.replace(priceMatch[0], "").trim() : line;
    const parsed = saleCandidateSchema.safeParse({ title, price });
    if (!parsed.success) return err(`Invalid candidate: ${line}`);
    candidates.push(parsed.data);
  }
  return ok(candidates);
}
