import { describe, expect, it } from "vitest";
import { SAMPLE_LIBRARY, SAMPLE_SALE_CANDIDATES } from "@/mocks/sample-library";
import { gameStatusSchema } from "@/lib/schemas";
import { runRefusalEngine } from "@/lib/refusal-engine";
import { game } from "@/lib/test-fixtures";

describe("sample fixtures", () => {
  it("contains at least 3 library games with valid statuses", () => {
    expect(SAMPLE_LIBRARY.length).toBeGreaterThanOrEqual(3);
    for (const row of SAMPLE_LIBRARY) {
      expect(gameStatusSchema.safeParse(row.status).success).toBe(true);
      expect(row.title.length).toBeGreaterThan(0);
    }
  });

  it("includes at least one abandoned title", () => {
    expect(SAMPLE_LIBRARY.some((g) => g.status === "abandoned")).toBe(true);
  });

  it("ships a sale slate with 2+ priced candidates", () => {
    expect(SAMPLE_SALE_CANDIDATES.length).toBeGreaterThanOrEqual(2);
    expect(SAMPLE_SALE_CANDIDATES.every((c) => typeof c.price === "number")).toBe(true);
  });

  it("produces a valid engine result when used together", () => {
    const games = SAMPLE_LIBRARY.map((g, i) =>
      game({
        id: String(i),
        title: g.title,
        status: g.status,
        hoursPlayed: g.hoursPlayed ?? null,
        notes: g.notes ?? null,
      }),
    );
    const result = runRefusalEngine(games, SAMPLE_SALE_CANDIDATES);
    expect(result.hardNos.length).toBeGreaterThan(0);
    expect(result.inputFingerprint).toHaveLength(16);
  });
});
