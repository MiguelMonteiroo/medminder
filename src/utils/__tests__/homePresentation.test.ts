import { getHomePresentation } from "../homePresentation";

describe("getHomePresentation", () => {
  it("hides daily metrics when there are no medications", () => {
    expect(
      getHomePresentation({ medicationCount: 0, total: 0, taken: 0, pending: 0 })
    ).toEqual({ kind: "empty" });
  });

  it("shows the no-dose state when medications exist without occurrences today", () => {
    expect(
      getHomePresentation({ medicationCount: 2, total: 0, taken: 0, pending: 0 })
    ).toEqual({ kind: "noDosesToday" });
  });

  it("describes pending doses without an exclamation", () => {
    expect(
      getHomePresentation({ medicationCount: 2, total: 4, taken: 1, pending: 3 })
    ).toEqual({
      kind: "active",
      headline: "3 doses ainda precisam de registro",
      progressLabel: "1 de 4 doses tomadas",
      supportLabel: "Uma dose de cada vez.",
    });
  });

  it("uses a positive completed state when nothing is pending", () => {
    expect(
      getHomePresentation({ medicationCount: 1, total: 2, taken: 2, pending: 0 })
    ).toEqual({
      kind: "complete",
      headline: "Todas as doses foram registradas",
      progressLabel: "2 de 2 doses tomadas",
      supportLabel: "Tudo registrado por hoje",
    });
  });
});
