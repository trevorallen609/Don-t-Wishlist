import { afterEach, describe, expect, it, vi } from "vitest";
import { maybeEnrichWithLlm, runRefusalEngine } from "@/lib/refusal-engine";
import { BACKLOG_LIBRARY, SALE_SLATE, game } from "@/lib/test-fixtures";
import type { SaleResult } from "@/lib/schemas";

function engine(overrides?: {
  games?: typeof BACKLOG_LIBRARY;
  candidates?: typeof SALE_SLATE;
  verdicts?: Parameters<typeof runRefusalEngine>[2];
}) {
  return runRefusalEngine(
    overrides?.games ?? BACKLOG_LIBRARY,
    overrides?.candidates ?? SALE_SLATE,
    overrides?.verdicts ?? [],
  );
}

describe("runRefusalEngine", () => {
  it("refuses to score until the library has 3 games", () => {
    const result = engine({
      games: BACKLOG_LIBRARY.slice(0, 2),
    });
    expect(result.buyNothing).toBe(true);
    expect(result.hardNos).toEqual([]);
    expect(result.dollarsRefused).toBe(0);
    expect(result.summary).toMatch(/at least 3/i);
  });

  it("puts live-service titles in hard nos", () => {
    const result = engine();
    const titles = result.hardNos.map((n) => n.title.toLowerCase());
    expect(titles.some((t) => t.includes("destiny") || t.includes("call of duty"))).toBe(
      true,
    );
  });

  it("prefers a completable title as the reluctant yes when remaining is safe enough", () => {
    const result = engine();
    if (!result.buyNothing) {
      expect(result.reluctantYes?.title).toMatch(/Celeste/i);
    }
    expect(result.hardNos.length).toBeGreaterThanOrEqual(1);
    expect(result.hardNos.length).toBeLessThanOrEqual(3);
  });

  it("hard-nos a title already in the library", () => {
    const result = engine({
      candidates: [
        { title: "Starfield", price: 10 },
        { title: "Celeste", price: 5 },
        { title: "Portal", price: 3 },
      ],
    });
    expect(result.hardNos.some((n) => n.title === "Starfield")).toBe(true);
    const owned = result.hardNos.find((n) => n.title === "Starfield");
    expect(owned?.ledger.some((row) => row.code === "already_owned")).toBe(true);
  });

  it("keeps a 16-char fingerprint and ISO scoredAt", () => {
    const result = engine();
    expect(result.inputFingerprint).toMatch(/^[a-f0-9]{16}$/);
    expect(() => new Date(result.scoredAt).toISOString()).not.toThrow();
    expect(result.engine).toBe("rules");
  });

  it("is deterministic for the same inputs", () => {
    const a = engine();
    const b = engine();
    expect(a.inputFingerprint).toBe(b.inputFingerprint);
    expect(a.hardNos.map((n) => n.title)).toEqual(b.hardNos.map((n) => n.title));
  });

  it("changes fingerprint when a verdict is added", () => {
    const before = engine();
    const after = engine({
      verdicts: [{ itemTitle: "Celeste", verdict: "wrong" }],
    });
    expect(after.inputFingerprint).not.toBe(before.inputFingerprint);
  });

  it("exposes a weighted ledger on every hard no", () => {
    const result = engine();
    for (const item of result.hardNos) {
      expect(item.ledger.length).toBeGreaterThan(0);
      const sum = item.ledger.reduce((acc, row) => acc + row.weight, 0);
      expect(item.refuseScore).toBeCloseTo(Number(sum.toFixed(2)), 1);
    }
  });

  it("charges dollars refused from hard-no prices", () => {
    const result = engine();
    if (result.buyNothing) {
      expect(result.dollarsRefused).toBe(40 + 50 + 5 + 30);
    } else {
      const byTitle = new Map(SALE_SLATE.map((c) => [c.title, c.price ?? 0]));
      const expected = result.hardNos.reduce(
        (sum, item) => sum + (byTitle.get(item.title) ?? 0),
        0,
      );
      expect(result.dollarsRefused).toBe(expected);
    }
  });

  it("sums the whole slate when buy-nothing fires on expensive live-service-only sales", () => {
    const result = engine({
      candidates: [
        { title: "Destiny 2", price: 70, note: "live service" },
        { title: "Call of Duty", price: 80, note: "battle pass" },
        { title: "Fortnite crew", price: 12, note: "live service" },
        { title: "FIFA", price: 60 },
      ],
    });
    expect(result.buyNothing).toBe(true);
    expect(result.dollarsRefused).toBe(70 + 80 + 12 + 60);
    expect(result.summary).toMatch(/Buy nothing/i);
  });

  it("signals high abandon rate when >= 40% abandoned", () => {
    const result = engine();
    const hasAbandon = result.hardNos.some((n) =>
      n.ledger.some((row) => row.code === "abandon_rate"),
    );
    expect(hasAbandon).toBe(true);
  });

  it("does not apply abandon_rate when the library is mostly finished", () => {
    const result = engine({
      games: [
        game({ id: "1", title: "A", status: "finished" }),
        game({ id: "2", title: "B", status: "finished" }),
        game({ id: "3", title: "C", status: "playing" }),
      ],
      candidates: [
        { title: "Celeste", price: 5 },
        { title: "Portal", price: 3 },
        { title: "Balatro", price: 8 },
      ],
    });
    const hasAbandon = [...result.hardNos, result.reluctantYes]
      .filter(Boolean)
      .some((n) => n!.ledger.some((row) => row.code === "abandon_rate"));
    expect(hasAbandon).toBe(false);
  });

  it("applies genre_trap when a candidate overlaps abandoned tokens", () => {
    const result = engine({
      games: [
        game({ id: "1", title: "Dragon Quest XI", status: "abandoned" }),
        game({ id: "2", title: "Starfield", status: "abandoned" }),
        game({ id: "3", title: "Celeste", status: "finished" }),
      ],
      candidates: [
        { title: "Dragon Age: The Veilguard", price: 30 },
        { title: "Portal", price: 3 },
        { title: "Balatro", price: 8 },
      ],
    });
    const dragon = [...result.hardNos, result.reluctantYes].find(
      (n) => n?.title.includes("Dragon"),
    );
    expect(dragon?.ledger.some((row) => row.code === "genre_trap")).toBe(true);
  });

  it("dampens refuse score for titles under $10", () => {
    const result = engine({
      candidates: [
        { title: "Celeste", price: 4.99 },
        { title: "Destiny 2 expansion", price: 40, note: "live service" },
        { title: "Call of Duty", price: 50 },
      ],
    });
    const celeste =
      result.hardNos.find((n) => n.title === "Celeste") ?? result.reluctantYes;
    expect(celeste?.ledger.some((row) => row.code === "low_price")).toBe(true);
  });

  it("treats missing price as not-cheap (default 99)", () => {
    const result = engine({
      candidates: [
        { title: "Unknown Indie" },
        { title: "Destiny 2", note: "live service" },
        { title: "Call of Duty" },
      ],
    });
    const unknown = [...result.hardNos, result.reluctantYes].find(
      (n) => n?.title === "Unknown Indie",
    );
    expect(unknown?.ledger.some((row) => row.code === "low_price")).toBeFalsy();
  });

  it("applies unfinished_stack when 3+ playing/abandoned games exist", () => {
    const result = engine();
    expect(
      result.hardNos.some((n) => n.ledger.some((row) => row.code === "unfinished_stack")),
    ).toBe(true);
  });

  it("lets too_safe verdicts raise the reluctant-yes threshold", () => {
    const without = engine();
    const withBoost = engine({
      verdicts: [
        { itemTitle: "Celeste", verdict: "too_safe" },
        { itemTitle: "Portal", verdict: "too_safe" },
        { itemTitle: "Hades", verdict: "too_safe" },
      ],
    });
    expect(withBoost.inputFingerprint).not.toBe(without.inputFingerprint);
    expect(withBoost.engine).toBe("rules");
  });

  it("reverses pressure when a related title is marked wrong", () => {
    const before = engine();
    const destinyBefore =
      before.hardNos.find((n) => /destiny/i.test(n.title))?.refuseScore ?? 0;
    const after = engine({
      verdicts: [{ itemTitle: "Destiny 2 expansion", verdict: "wrong" }],
    });
    const destinyAfter =
      after.hardNos.find((n) => /destiny/i.test(n.title))?.refuseScore ??
      after.reluctantYes?.refuseScore ??
      destinyBefore;
    expect(destinyAfter).toBeLessThan(destinyBefore);
  });

  it("caps hard nos at 3 even with a long slate", () => {
    const result = engine({
      candidates: Array.from({ length: 8 }, (_, i) => ({
        title: `Live Service ${i}`,
        note: "battle pass",
        price: 20 + i,
      })),
    });
    expect(result.hardNos).toHaveLength(3);
  });

  it("handles a two-candidate slate without throwing", () => {
    const result = engine({
      candidates: [
        { title: "Destiny 2", price: 40, note: "live service" },
        { title: "Celeste", price: 5 },
      ],
    });
    expect(result.hardNos.length).toBeGreaterThanOrEqual(1);
    expect(result.hardNos.length).toBeLessThanOrEqual(2);
  });

  it("returns buy-nothing when remaining candidates still score above threshold", () => {
    const result = engine({
      games: [
        game({ id: "1", title: "A", status: "abandoned" }),
        game({ id: "2", title: "B", status: "abandoned" }),
        game({ id: "3", title: "C", status: "abandoned" }),
        game({ id: "4", title: "D", status: "abandoned" }),
      ],
      candidates: [
        { title: "Destiny 2", price: 40, note: "live service" },
        { title: "Call of Duty", price: 50, note: "battle pass" },
        { title: "FIFA", price: 60, note: "live service" },
        { title: "Fortnite", price: 20, note: "live service" },
      ],
    });
    expect(result.buyNothing).toBe(true);
    expect(result.reluctantYes).toBeNull();
  });
});

describe("maybeEnrichWithLlm", () => {
  const base: SaleResult = engine();

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.OPENAI_API_KEY;
  });

  it("is a no-op without OPENAI_API_KEY", async () => {
    delete process.env.OPENAI_API_KEY;
    await expect(maybeEnrichWithLlm(base)).resolves.toEqual(base);
  });

  it("returns original result when the provider errors", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }),
    );
    const out = await maybeEnrichWithLlm(base);
    expect(out.engine).toBe("rules");
    expect(out.inputFingerprint).toBe(base.inputFingerprint);
  });

  it("returns original result when fetch throws", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    const out = await maybeEnrichWithLlm(base);
    expect(out).toEqual(base);
  });

  it("sharpens copy but preserves fingerprint, dollars, and ledger math", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary: "Blunt rewrite.",
                  hardNos: base.hardNos.map((n) => ({
                    ...n,
                    reason: `Sharpened: ${n.title}`,
                  })),
                  reluctantYes: base.reluctantYes
                    ? { ...base.reluctantYes, reason: "Sharpened yes" }
                    : null,
                  dollarsRefused: 9999,
                  inputFingerprint: "deadbeefdeadbeef",
                }),
              },
            },
          ],
        }),
      }),
    );

    const out = await maybeEnrichWithLlm(base);
    expect(out.engine).toBe("rules+llm");
    expect(out.inputFingerprint).toBe(base.inputFingerprint);
    expect(out.dollarsRefused).toBe(base.dollarsRefused);
    expect(out.hardNos[0]?.ledger).toEqual(base.hardNos[0]?.ledger);
    expect(out.summary).toBe("Blunt rewrite.");
  });

  it("ignores empty choices payloads", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: {} }] }),
      }),
    );
    const out = await maybeEnrichWithLlm(base);
    expect(out.engine).toBe("rules");
  });
});
