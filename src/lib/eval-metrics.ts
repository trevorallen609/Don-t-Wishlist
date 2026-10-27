import type { VerdictKind } from "@/lib/schemas";

export type EvalSnapshot = {
  labeled: number;
  correct: number;
  wrong: number;
  tooSafe: number;
  /** correct / (correct + wrong); null until enough labels */
  precision: number | null;
  ready: boolean;
};

/**
 * STAFF TOUCH #2 — Tiny online eval from human marks.
 * Most take-homes never instrument model/rule quality. We surface precision
 * live so "where it breaks" is visible in the product, not a slide.
 */
export function computeEvalSnapshot(
  verdicts: Array<{ verdict: VerdictKind }>,
): EvalSnapshot {
  let correct = 0;
  let wrong = 0;
  let tooSafe = 0;

  for (const v of verdicts) {
    switch (v.verdict) {
      case "correct":
        correct += 1;
        break;
      case "wrong":
        wrong += 1;
        break;
      case "too_safe":
        tooSafe += 1;
        break;
      default: {
        const _exhaustive: never = v.verdict;
        void _exhaustive;
      }
    }
  }

  const labeled = correct + wrong + tooSafe;
  const denom = correct + wrong;
  const precision = denom >= 3 ? correct / denom : null;

  return {
    labeled,
    correct,
    wrong,
    tooSafe,
    precision,
    ready: precision !== null,
  };
}

export function formatPrecision(snapshot: EvalSnapshot): string {
  if (!snapshot.ready || snapshot.precision === null) {
    return `Need ${Math.max(0, 3 - (snapshot.correct + snapshot.wrong))} more correct/wrong marks`;
  }
  return `${(snapshot.precision * 100).toFixed(0)}% engine agreement`;
}
