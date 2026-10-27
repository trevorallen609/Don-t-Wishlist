import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { coverInitials, escapeXml, hashHue, renderCoverSvg } from "@/lib/cover";
import { GET } from "@/app/api/cover/route";

describe("cover helpers", () => {
  it("maps titles into a 0-359 hue deterministically", () => {
    expect(hashHue("celeste")).toBe(hashHue("celeste"));
    expect(hashHue("celeste")).toBeGreaterThanOrEqual(0);
    expect(hashHue("celeste")).toBeLessThan(360);
    expect(hashHue("celeste")).not.toBe(hashHue("hades"));
  });

  it("escapes XML metacharacters", () => {
    expect(escapeXml(`A & B <C> "D"`)).toBe("A &amp; B &lt;C&gt; &quot;D&quot;");
  });

  it("builds initials from up to two words", () => {
    expect(coverInitials("Baldur's Gate 3")).toBe("BG");
    expect(coverInitials("Celeste")).toBe("C");
    expect(coverInitials("")).toBe("?");
  });

  it("renders svg with escaped title in aria-label", () => {
    const svg = renderCoverSvg(`Hades & "Friends"`);
    expect(svg).toContain("<svg");
    expect(svg).toContain('aria-label="Hades &amp; &quot;Friends&quot;"');
    expect(svg).not.toContain(`aria-label="Hades & "Friends"`);
  });

  it("falls back to Game for blank titles", () => {
    expect(renderCoverSvg("   ")).toContain('aria-label="Game"');
  });
});

describe("GET /api/cover", () => {
  it("returns cached SVG", async () => {
    const res = await GET(
      new NextRequest("http://localhost/api/cover?title=Celeste"),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/image\/svg\+xml/);
    expect(res.headers.get("cache-control")).toMatch(/max-age=86400/);
    const body = await res.text();
    expect(body).toContain("<svg");
    expect(body).toContain("C");
  });

  it("defaults the title when missing", async () => {
    const res = await GET(new NextRequest("http://localhost/api/cover"));
    const body = await res.text();
    expect(body).toContain('aria-label="Game"');
  });

  it("is stable for the same title", async () => {
    const a = await (await GET(new NextRequest("http://localhost/api/cover?title=Hades"))).text();
    const b = await (await GET(new NextRequest("http://localhost/api/cover?title=Hades"))).text();
    expect(a).toBe(b);
  });
});
