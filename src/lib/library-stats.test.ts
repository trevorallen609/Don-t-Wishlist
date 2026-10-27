import { describe, expect, it } from "vitest";
import { summarizeLibrary } from "@/lib/library-stats";
import { BACKLOG_LIBRARY, game } from "@/lib/test-fixtures";

describe("summarizeLibrary", () => {
  it("returns zeros for an empty library", () => {
    expect(summarizeLibrary([])).toEqual({ playing: 0, finished: 0, abandoned: 0 });
  });

  it("counts each status", () => {
    expect(summarizeLibrary(BACKLOG_LIBRARY)).toEqual({
      playing: 0,
      finished: 1,
      abandoned: 3,
    });
  });

  it("counts a mixed library", () => {
    expect(
      summarizeLibrary([
        game({ id: "1", title: "A", status: "playing" }),
        game({ id: "2", title: "B", status: "playing" }),
        game({ id: "3", title: "C", status: "finished" }),
      ]),
    ).toEqual({ playing: 2, finished: 1, abandoned: 0 });
  });
});
