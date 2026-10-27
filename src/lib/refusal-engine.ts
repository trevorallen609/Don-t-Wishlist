import { fingerprintDecisionInputs } from "@/lib/fingerprint";
import type {
  LibraryGame,
  SaleCandidate,
  SaleResult,
  ScoreContribution,
  VerdictKind,
} from "@/lib/schemas";
import { saleResultSchema } from "@/lib/schemas";

type VerdictSignal = { itemTitle: string; verdict: VerdictKind };

const LIVE_SERVICE_HINTS = [
  "destiny",
  "warzone",
  "call of duty",
  "fifa",
  "ea sports fc",
  "fortnite",
  "diablo",
  "season pass",
  "battle pass",
  "live service",
  "mmo",
  "gacha",
] as const;

const SHORT_COMPLETE_HINTS = [
  "celeste",
  "hades",
  "inside",
  "limbo",
  "portal",
  "slay the spire",
  "balatro",
  "vampire survivors",
  "stardew",
  "untitled goose",
] as const;

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function abandonedRatio(games: LibraryGame[]): number {
  if (games.length === 0) return 0;
  return games.filter((g) => g.status === "abandoned").length / games.length;
}

function abandonedTitles(games: LibraryGame[]): string[] {
  return games.filter((g) => g.status === "abandoned").map((g) => norm(g.title));
}

function looksLiveService(candidate: SaleCandidate): boolean {
  const hay = `${candidate.title} ${candidate.note ?? ""}`.toLowerCase();
  return LIVE_SERVICE_HINTS.some((h) => hay.includes(h));
}

function looksCompletable(candidate: SaleCandidate): boolean {
  const hay = `${candidate.title} ${candidate.note ?? ""}`.toLowerCase();
  return SHORT_COMPLETE_HINTS.some((h) => hay.includes(h));
}

function genreTrapScore(candidate: SaleCandidate, games: LibraryGame[]): number {
  const abandoned = abandonedTitles(games);
  const title = norm(candidate.title);
  const tokens = title.split(/[^a-z0-9]+/).filter((t) => t.length > 3);
  let hits = 0;
  for (const a of abandoned) {
    for (const t of tokens) {
      if (a.includes(t)) hits += 1;
    }
  }
  return hits;
}

function verdictBias(
  title: string,
  verdicts: VerdictSignal[],
): { weight: number; label: string } {
  const related = verdicts.filter(
    (v) =>
      norm(v.itemTitle) === norm(title) ||
      norm(v.itemTitle).includes(norm(title)) ||
      norm(title).includes(norm(v.itemTitle)),
  );
  let score = 0;
  for (const v of related) {
    if (v.verdict === "wrong") score -= 2;
    if (v.verdict === "too_safe") score += 1;
    if (v.verdict === "correct") score += 0.5;
  }
  const tooSafe = verdicts.filter((v) => v.verdict === "too_safe").length;
  const wrong = verdicts.filter((v) => v.verdict === "wrong").length;
  score += tooSafe * 0.35 - wrong * 0.15;
  return {
    weight: score,
    label: `Human-eval bias (${related.length} related, ${tooSafe} too-safe, ${wrong} wrong)`,
  };
}

type Scored = {
  candidate: SaleCandidate;
  refuse: number;
  signals: string[];
  ledger: ScoreContribution[];
};

/**
 * STAFF TOUCH #3 — Score autopsy ledger.
 * Every refusal exposes weighted contributions (not a vibes string).
 * Demo move: expand a hard-no and show the math.
 */
function scoreCandidate(
  candidate: SaleCandidate,
  games: LibraryGame[],
  verdicts: VerdictSignal[],
): Scored {
  let refuse = 0;
  const signals: string[] = [];
  const ledger: ScoreContribution[] = [];

  const push = (code: string, label: string, weight: number, signal?: string) => {
    if (weight === 0) return;
    refuse += weight;
    ledger.push({ code, label, weight });
    if (signal) signals.push(signal);
  };

  const ratio = abandonedRatio(games);
  if (ratio >= 0.4) {
    push(
      "abandon_rate",
      "High abandon rate",
      2,
      `Your abandon rate is ${(ratio * 100).toFixed(0)}% — buy less, finish more`,
    );
  }

  if (looksLiveService(candidate)) {
    push(
      "live_service",
      "Live-service / FOMO pattern",
      3,
      "Live-service / FOMO pattern — high regret risk",
    );
  }

  const trap = genreTrapScore(candidate, games);
  if (trap > 0) {
    push(
      "genre_trap",
      "Overlap with abandoned titles",
      trap,
      "Overlaps with titles you already abandoned",
    );
  }

  const unfinished = games.filter(
    (g) => g.status === "playing" || g.status === "abandoned",
  ).length;
  if (unfinished >= 3) {
    push(
      "unfinished_stack",
      "Unfinished stack pressure",
      1.5,
      `You already have ${unfinished} unfinished games`,
    );
  }

  if (looksCompletable(candidate)) {
    push(
      "completable",
      "Short / completable profile",
      -2,
      "Short / completable profile — lower backlog risk",
    );
  }

  if ((candidate.price ?? 99) <= 10) {
    push(
      "low_price",
      "Low price dampener",
      -0.5,
      "Low price — regret is cheaper if you're wrong",
    );
  }

  const bias = verdictBias(candidate.title, verdicts);
  push("human_eval", bias.label, bias.weight);

  if (games.some((g) => norm(g.title) === norm(candidate.title))) {
    push("already_owned", "Already in library", 5, "Already in your library");
  }

  return { candidate, refuse, signals, ledger };
}

function dollarsRefusedFrom(
  hardNos: Array<{ title: string }>,
  candidates: SaleCandidate[],
  buyNothing: boolean,
): number {
  /**
   * STAFF TOUCH #4 — “Money not spent” receipt.
   * Sum prices of hard-nos; if buy-nothing, sum the whole sale slate.
   * Turns discipline into a concrete dollar figure for the demo.
   */
  const byTitle = new Map(candidates.map((c) => [norm(c.title), c.price ?? 0]));
  if (buyNothing) {
    return candidates.reduce((sum, c) => sum + (c.price ?? 0), 0);
  }
  return hardNos.reduce((sum, item) => sum + (byTitle.get(norm(item.title)) ?? 0), 0);
}

export function runRefusalEngine(
  games: LibraryGame[],
  candidates: SaleCandidate[],
  verdicts: VerdictSignal[] = [],
): SaleResult {
  const inputFingerprint = fingerprintDecisionInputs({ games, candidates, verdicts });
  const scoredAt = new Date().toISOString();

  if (games.length < 3) {
    return saleResultSchema.parse({
      hardNos: [],
      reluctantYes: null,
      buyNothing: true,
      summary: "Add at least 3 library games before asking for sale discipline.",
      engine: "rules",
      dollarsRefused: 0,
      inputFingerprint,
      scoredAt,
    });
  }

  const ranked = candidates
    .map((c) => scoreCandidate(c, games, verdicts))
    .sort((a, b) => b.refuse - a.refuse);

  const hardNos = ranked.slice(0, Math.min(3, ranked.length)).map((r) => ({
    title: r.candidate.title,
    reason:
      r.refuse >= 3
        ? `Hard no. ${r.signals[0] ?? "Backlog risk is too high."}`
        : `Skip it. ${r.signals[0] ?? "Your history says you'll bounce."}`,
    signals: r.signals,
    refuseScore: Number(r.refuse.toFixed(2)),
    ledger: r.ledger,
  }));

  const remaining = ranked.slice(hardNos.length);
  const tooSafeBoost = verdicts.some((v) => v.verdict === "too_safe");
  const best = [...remaining].sort((a, b) => a.refuse - b.refuse)[0];
  const threshold = tooSafeBoost ? 3.5 : 2.2;

  let reluctantYes: SaleResult["reluctantYes"] = null;
  let buyNothing = false;

  if (!best || best.refuse > threshold) {
    buyNothing = true;
  } else {
    reluctantYes = {
      title: best.candidate.title,
      reason: `Reluctant yes — only if you finish one abandoned game first. ${
        best.signals.find(
          (s) =>
            s.toLowerCase().includes("completable") ||
            s.toLowerCase().includes("low price"),
        ) ?? "Least damaging option on this list."
      }`,
      signals: best.signals,
      refuseScore: Number(best.refuse.toFixed(2)),
      ledger: best.ledger,
    };
  }

  const summary = buyNothing
    ? "Buy nothing. Your backlog is already writing the review."
    : `Three nos, one maybe: ${reluctantYes?.title}. Finish something before you checkout.`;

  return saleResultSchema.parse({
    hardNos,
    reluctantYes,
    buyNothing,
    summary,
    engine: "rules",
    dollarsRefused: Number(
      dollarsRefusedFrom(hardNos, candidates, buyNothing).toFixed(2),
    ),
    inputFingerprint,
    scoredAt,
  });
}

export async function maybeEnrichWithLlm(result: SaleResult): Promise<SaleResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return result;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content:
              "Sharpen gaming anti-buy copy only. Keep titles, scores, ledger, fingerprint, dollarsRefused unchanged. Return JSON with hardNos/reluctantYes reasons+signals+summary only where prose improves.",
          },
          { role: "user", content: JSON.stringify(result) },
        ],
        response_format: { type: "json_object" },
      }),
      // Staff practice: bound LLM latency; never block the product forever.
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });

    if (!res.ok) return result;
    const data: unknown = await res.json();
    const content =
      typeof data === "object" &&
      data !== null &&
      "choices" in data &&
      Array.isArray((data as { choices: unknown }).choices)
        ? (
            data as {
              choices: Array<{ message?: { content?: string } }>;
            }
          ).choices[0]?.message?.content
        : undefined;

    if (!content) return result;
    const parsed = JSON.parse(content) as Partial<SaleResult>;

    // Preserve audit fields — LLM must not rewrite provenance/math.
    return saleResultSchema.parse({
      ...result,
      summary: parsed.summary ?? result.summary,
      hardNos: result.hardNos.map((item, i) => ({
        ...item,
        reason: parsed.hardNos?.[i]?.reason ?? item.reason,
        signals: parsed.hardNos?.[i]?.signals ?? item.signals,
      })),
      reluctantYes: result.reluctantYes
        ? {
            ...result.reluctantYes,
            reason: parsed.reluctantYes?.reason ?? result.reluctantYes.reason,
            signals: parsed.reluctantYes?.signals ?? result.reluctantYes.signals,
          }
        : null,
      engine: "rules+llm",
    });
  } catch {
    return result;
  }
}
