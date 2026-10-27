import { describe, expect, it } from "vitest";
import { computeEvalSnapshot, formatPrecision } from "@/lib/eval-metrics";

describe("computeEvalSnapshot", () => {
  it("starts empty and not ready", () => {
    const snap = computeEvalSnapshot([]);
    expect(snap).toMatchObject({
      labeled: 0,
      correct: 0,
      wrong: 0,
      tooSafe: 0,
      precision: null,
      ready: false,
    });
  });

  it("does not become ready with only two correct/wrong marks", () => {
    const snap = computeEvalSnapshot([{ verdict: "correct" }, { verdict: "wrong" }]);
    expect(snap.ready).toBe(false);
    expect(snap.precision).toBeNull();
    expect(snap.labeled).toBe(2);
  });

  it("becomes ready at three correct/wrong marks", () => {
    const snap = computeEvalSnapshot([
      { verdict: "correct" },
      { verdict: "correct" },
      { verdict: "wrong" },
    ]);
    expect(snap.ready).toBe(true);
    expect(snap.precision).toBeCloseTo(2 / 3);
  });

  it("excludes too_safe from the precision denominator", () => {
    const snap = computeEvalSnapshot([
      { verdict: "correct" },
      { verdict: "correct" },
      { verdict: "wrong" },
      { verdict: "too_safe" },
      { verdict: "too_safe" },
    ]);
    expect(snap.tooSafe).toBe(2);
    expect(snap.labeled).toBe(5);
    expect(snap.precision).toBeCloseTo(2 / 3);
  });

  it("reports 100% when all decisive marks are correct", () => {
    const snap = computeEvalSnapshot([
      { verdict: "correct" },
      { verdict: "correct" },
      { verdict: "correct" },
    ]);
    expect(snap.precision).toBe(1);
  });

  it("reports 0% when all decisive marks are wrong", () => {
    const snap = computeEvalSnapshot([
      { verdict: "wrong" },
      { verdict: "wrong" },
      { verdict: "wrong" },
    ]);
    expect(snap.precision).toBe(0);
  });
});

describe("formatPrecision", () => {
  it("tells the user how many marks are still needed", () => {
    expect(formatPrecision(computeEvalSnapshot([]))).toBe(
      "Need 3 more correct/wrong marks",
    );
    expect(
      formatPrecision(computeEvalSnapshot([{ verdict: "correct" }, { verdict: "too_safe" }])),
    ).toBe("Need 2 more correct/wrong marks");
  });

  it("renders percent agreement once ready", () => {
    expect(
      formatPrecision(
        computeEvalSnapshot([
          { verdict: "correct" },
          { verdict: "correct" },
          { verdict: "wrong" },
        ]),
      ),
    ).toBe("67% engine agreement");
  });
});
