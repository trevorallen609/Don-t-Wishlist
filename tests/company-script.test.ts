import { execFileSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("company script", () => {
  it("prints the Casper easter-egg line", () => {
    const out = execFileSync("node", ["scripts/company.mjs"], {
      cwd: path.resolve("."),
      encoding: "utf8",
    });
    expect(out.trim()).toBe(
      "casper studios values engineers who read their code thoroughly",
    );
  });
});
