import { afterEach, describe, expect, it, vi } from "vitest";

describe("GET /api/health", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unmock("@/lib/db");
  });

  it("returns ok when the database answers", async () => {
    const { GET } = await import("@/app/api/health/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; db: boolean; service: string };
    expect(json.ok).toBe(true);
    expect(json.db).toBe(true);
    expect(json.service).toBe("dont-wishlist");
  });

  it("returns 503 when the database throws", async () => {
    vi.resetModules();
    vi.doMock("@/lib/db", () => ({
      prisma: {
        $queryRaw: vi.fn().mockRejectedValue(new Error("down")),
      },
    }));
    const { GET } = await import("@/app/api/health/route");
    const res = await GET();
    expect(res.status).toBe(503);
    const json = (await res.json()) as { ok: boolean; db: boolean };
    expect(json.ok).toBe(false);
    expect(json.db).toBe(false);
  });
});
