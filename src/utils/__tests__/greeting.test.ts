import { getGreetingForHour } from "../greeting";

describe("getGreetingForHour", () => {
  it.each([
    [4, "Boa noite"],
    [5, "Bom dia"],
    [11, "Bom dia"],
    [12, "Boa tarde"],
    [17, "Boa tarde"],
    [18, "Boa noite"],
  ])("returns the expected greeting at %i:00", (hour, expected) => {
    expect(getGreetingForHour(hour)).toBe(expected);
  });

  it("rejects hours outside the clock range", () => {
    expect(() => getGreetingForHour(-1)).toThrow();
    expect(() => getGreetingForHour(24)).toThrow();
  });
});
