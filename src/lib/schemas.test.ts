import { describe, expect, it } from "vitest";
import {
  addGameInputSchema,
  credentialsSchema,
  gameStatusSchema,
  libraryGameSchema,
  saleCandidateSchema,
  saleResultSchema,
  verdictKindSchema,
} from "@/lib/schemas";

describe("credentialsSchema", () => {
  it("lowercases email", () => {
    const parsed = credentialsSchema.parse({
      email: "  MixEd@Example.COM ",
      password: "secret1",
    });
    expect(parsed.email).toBe("mixed@example.com");
  });

  it("rejects invalid email", () => {
    expect(credentialsSchema.safeParse({ email: "nope", password: "secret1" }).success).toBe(
      false,
    );
  });

  it("rejects short passwords", () => {
    expect(
      credentialsSchema.safeParse({ email: "a@b.co", password: "12345" }).success,
    ).toBe(false);
  });

  it("rejects passwords over 128 chars", () => {
    expect(
      credentialsSchema.safeParse({ email: "a@b.co", password: "x".repeat(129) }).success,
    ).toBe(false);
  });
});

describe("gameStatusSchema / verdictKindSchema", () => {
  it("accepts known statuses", () => {
    expect(gameStatusSchema.parse("abandoned")).toBe("abandoned");
    expect(gameStatusSchema.parse("playing")).toBe("playing");
    expect(gameStatusSchema.parse("finished")).toBe("finished");
  });

  it("rejects unknown status", () => {
    expect(gameStatusSchema.safeParse("wishlist").success).toBe(false);
  });

  it("accepts known verdicts", () => {
    expect(verdictKindSchema.parse("too_safe")).toBe("too_safe");
  });

  it("rejects unknown verdict", () => {
    expect(verdictKindSchema.safeParse("meh").success).toBe(false);
  });
});

describe("addGameInputSchema", () => {
  it("trims title and converts empty hours/notes to null", () => {
    const parsed = addGameInputSchema.parse({
      title: "  Hades  ",
      status: "abandoned",
      hoursPlayed: "  ",
      notes: "  ",
    });
    expect(parsed.title).toBe("Hades");
    expect(parsed.hoursPlayed).toBeNull();
    expect(parsed.notes).toBeNull();
  });

  it("parses numeric hours", () => {
    expect(
      addGameInputSchema.parse({
        title: "Celeste",
        status: "finished",
        hoursPlayed: "12.5",
        notes: "great",
      }).hoursPlayed,
    ).toBe(12.5);
  });

  it("rejects negative hours", () => {
    expect(
      addGameInputSchema.safeParse({
        title: "Celeste",
        status: "finished",
        hoursPlayed: "-1",
      }).success,
    ).toBe(false);
  });

  it("rejects empty title", () => {
    expect(
      addGameInputSchema.safeParse({ title: "  ", status: "playing" }).success,
    ).toBe(false);
  });

  it("rejects titles over 120 chars", () => {
    expect(
      addGameInputSchema.safeParse({ title: "x".repeat(121), status: "playing" }).success,
    ).toBe(false);
  });
});

describe("saleCandidateSchema / saleResultSchema", () => {
  it("allows optional price", () => {
    expect(saleCandidateSchema.parse({ title: "Celeste" }).price).toBeUndefined();
  });

  it("rejects negative price", () => {
    expect(saleCandidateSchema.safeParse({ title: "X", price: -1 }).success).toBe(false);
  });

  it("requires fingerprint length and ISO datetime", () => {
    const base = {
      hardNos: [],
      reluctantYes: null,
      buyNothing: true,
      summary: "x",
      engine: "rules" as const,
      dollarsRefused: 0,
      inputFingerprint: "abcd1234",
      scoredAt: "2020-01-01T00:00:00.000Z",
    };
    expect(saleResultSchema.parse(base).inputFingerprint).toBe("abcd1234");
    expect(
      saleResultSchema.safeParse({ ...base, inputFingerprint: "short" }).success,
    ).toBe(false);
    expect(
      saleResultSchema.safeParse({ ...base, scoredAt: "yesterday" }).success,
    ).toBe(false);
  });
});

describe("libraryGameSchema", () => {
  it("accepts a full row", () => {
    expect(
      libraryGameSchema.parse({
        id: "1",
        title: "Celeste",
        status: "finished",
        hoursPlayed: 8,
        notes: null,
      }).title,
    ).toBe("Celeste");
  });
});
