import { describe, expect, it } from "vitest";
import { assertNever } from "@/lib/exhaustive";

describe("assertNever", () => {
  it("throws with the unexpected value serialized", () => {
    expect(() => assertNever("oops" as never)).toThrow(/oops/);
  });

  it("uses a custom message", () => {
    expect(() => assertNever(1 as never, "bad status")).toThrow(/bad status/);
  });
});
