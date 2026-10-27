import { describe, expect, it } from "vitest";
import { err, ok, type Result } from "@/lib/result";

describe("Result helpers", () => {
  it("wraps a value in ok", () => {
    const result: Result<number> = ok(42);
    expect(result).toEqual({ ok: true, value: 42 });
  });

  it("wraps a message in err", () => {
    const result: Result<number> = err("nope");
    expect(result).toEqual({ ok: false, error: "nope" });
  });

  it("narrows on ok", () => {
    const result = ok("celeste");
    if (result.ok) expect(result.value).toBe("celeste");
  });
});
