import { describe, expect, it } from "vitest";
import { parseCandidateLines, parseCandidates, parseSaleResult } from "@/lib/parse";
import { runRefusalEngine } from "@/lib/refusal-engine";
import { BACKLOG_LIBRARY, SALE_SLATE } from "@/lib/test-fixtures";

describe("parseCandidateLines", () => {
  it("parses title + trailing price", () => {
    const parsed = parseCandidateLines("Celeste 4.99\nHades 20");
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value).toEqual([
        { title: "Celeste", price: 4.99 },
        { title: "Hades", price: 20 },
      ]);
    }
  });

  it("accepts a $ prefix on price", () => {
    const parsed = parseCandidateLines("Celeste $5\nHades $20");
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.value[0]?.price).toBe(5);
  });

  it("keeps titles without prices", () => {
    const parsed = parseCandidateLines("Celeste\nHades");
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.value[0]?.price).toBeUndefined();
  });

  it("skips blank lines", () => {
    const parsed = parseCandidateLines("Celeste\n\n  \nHades\n");
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.value).toHaveLength(2);
  });

  it("requires at least two titles", () => {
    const parsed = parseCandidateLines("Celeste");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toMatch(/at least 2/i);
  });

  it("rejects empty input", () => {
    expect(parseCandidateLines("").ok).toBe(false);
  });
});

describe("parseCandidates", () => {
  it("round-trips JSON candidates", () => {
    const parsed = parseCandidates(JSON.stringify(SALE_SLATE));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.value).toHaveLength(SALE_SLATE.length);
  });

  it("rejects invalid JSON", () => {
    const parsed = parseCandidates("{not json");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toMatch(/Invalid JSON/i);
  });

  it("rejects schema-invalid payloads", () => {
    const parsed = parseCandidates(JSON.stringify([{ title: "", price: -2 }]));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toMatch(/Corrupt/i);
  });
});

describe("parseSaleResult", () => {
  it("round-trips a live engine result", () => {
    const result = runRefusalEngine(BACKLOG_LIBRARY, SALE_SLATE);
    const parsed = parseSaleResult(JSON.stringify(result));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.value.inputFingerprint).toBe(result.inputFingerprint);
  });

  it("upgrades legacy rows missing staff fields", () => {
    const parsed = parseSaleResult(
      JSON.stringify({
        hardNos: [{ title: "FIFA", reason: "no", signals: ["live"] }],
        reluctantYes: { title: "Celeste", reason: "ok", signals: [] },
        buyNothing: false,
        summary: "legacy",
        engine: "rules+llm",
      }),
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.inputFingerprint).toBe("legacy-unknown");
      expect(parsed.value.hardNos[0]?.refuseScore).toBe(0);
      expect(parsed.value.engine).toBe("rules+llm");
      expect(parsed.value.reluctantYes?.title).toBe("Celeste");
    }
  });

  it("maps unknown legacy engine to rules", () => {
    const parsed = parseSaleResult(
      JSON.stringify({
        hardNos: [],
        reluctantYes: null,
        buyNothing: true,
        summary: "legacy",
        engine: "mystery",
      }),
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.value.engine).toBe("rules");
  });

  it("rejects invalid JSON", () => {
    const parsed = parseSaleResult("not-json");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toMatch(/Invalid JSON/i);
  });

  it("rejects payloads that are not objects", () => {
    expect(parseSaleResult("null").ok).toBe(false);
    expect(parseSaleResult("[]").ok).toBe(false);
    expect(parseSaleResult("12").ok).toBe(false);
  });
});
