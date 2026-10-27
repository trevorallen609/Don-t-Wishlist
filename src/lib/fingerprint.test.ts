import { describe, expect, it } from "vitest";
import { fingerprintDecisionInputs } from "@/lib/fingerprint";
import { BACKLOG_LIBRARY, SALE_SLATE } from "@/lib/test-fixtures";

const base = {
  games: BACKLOG_LIBRARY,
  candidates: SALE_SLATE,
  verdicts: [] as Array<{ itemTitle: string; verdict: "correct" | "wrong" | "too_safe" }>,
};

describe("fingerprintDecisionInputs", () => {
  it("returns 16 hex chars", () => {
    expect(fingerprintDecisionInputs(base)).toMatch(/^[a-f0-9]{16}$/);
  });

  it("is order-independent for games and candidates", () => {
    const shuffled = fingerprintDecisionInputs({
      games: [...BACKLOG_LIBRARY].reverse(),
      candidates: [...SALE_SLATE].reverse(),
      verdicts: [],
    });
    expect(shuffled).toBe(fingerprintDecisionInputs(base));
  });

  it("is case-insensitive on titles", () => {
    const cased = fingerprintDecisionInputs({
      games: BACKLOG_LIBRARY.map((g) => ({ ...g, title: g.title.toUpperCase() })),
      candidates: SALE_SLATE.map((c) => ({ ...c, title: c.title.toUpperCase() })),
      verdicts: [],
    });
    expect(cased).toBe(fingerprintDecisionInputs(base));
  });

  it("changes when a verdict is added", () => {
    const withVerdict = fingerprintDecisionInputs({
      ...base,
      verdicts: [{ itemTitle: "Celeste", verdict: "wrong" }],
    });
    expect(withVerdict).not.toBe(fingerprintDecisionInputs(base));
  });

  it("changes when hours change", () => {
    const tweaked = fingerprintDecisionInputs({
      ...base,
      games: BACKLOG_LIBRARY.map((g, i) =>
        i === 0 ? { ...g, hoursPlayed: 999 } : g,
      ),
    });
    expect(tweaked).not.toBe(fingerprintDecisionInputs(base));
  });

  it("treats missing hours as null (stable)", () => {
    const a = fingerprintDecisionInputs({
      games: [{ title: "A", status: "finished", hoursPlayed: null }],
      candidates: [{ title: "X" }],
      verdicts: [],
    });
    const b = fingerprintDecisionInputs({
      games: [{ title: "A", status: "finished", hoursPlayed: undefined as unknown as null }],
      candidates: [{ title: "X" }],
      verdicts: [],
    });
    expect(a).toBe(b);
  });
});
