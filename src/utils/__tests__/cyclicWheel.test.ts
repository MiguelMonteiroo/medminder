import {
  getCenteredVisualIndex,
  getOptionIndex,
  getRecenteredVisualIndex,
  wrapIndex,
} from "../cyclicWheel";

describe("cyclic wheel helpers", () => {
  it("wraps values in both directions", () => {
    expect(wrapIndex(24, 24)).toBe(0);
    expect(wrapIndex(-1, 24)).toBe(23);
    expect(wrapIndex(60, 60)).toBe(0);
    expect(wrapIndex(-1, 60)).toBe(59);
  });

  it("maps repeated visual rows back to the option index", () => {
    expect(getOptionIndex(24, 24)).toBe(0);
    expect(getOptionIndex(47, 24)).toBe(23);
    expect(getOptionIndex(60, 60)).toBe(0);
  });

  it("places a value in the middle repeated cycle", () => {
    expect(getCenteredVisualIndex(0, 24, 5)).toBe(48);
    expect(getCenteredVisualIndex(23, 24, 5)).toBe(71);
  });

  it("recenters edge cycles without changing the selected value", () => {
    expect(getRecenteredVisualIndex(23, 24, 5)).toBe(71);
    expect(getRecenteredVisualIndex(96, 24, 5)).toBe(48);
  });

  it("keeps an index that is already inside a safe middle cycle", () => {
    expect(getRecenteredVisualIndex(71, 24, 5)).toBe(71);
  });
});
