import { calculateAdherence } from "../stats";
import { DoseLog, MedicationSchedule } from "../../types/domain";

describe("calculateAdherence", () => {
  it("returns 0 for empty logs", () => {
    const result = calculateAdherence([], 5);
    expect(result.percentage).toBe(0);
    expect(result.taken).toBe(0);
    expect(result.total).toBe(5);
  });

  it("calculates 100% when all doses taken", () => {
    const logs: DoseLog[] = [
      { id: "1", doseOccurrenceId: "occ-1", medicationId: "med-1", scheduleId: "sched-1", action: "taken", actionAt: "2026-07-03T08:05:00", snoozedUntil: "" },
      { id: "2", doseOccurrenceId: "occ-2", medicationId: "med-1", scheduleId: "sched-1", action: "taken", actionAt: "2026-07-03T20:05:00", snoozedUntil: "" },
    ];
    const result = calculateAdherence(logs, 2);
    expect(result.percentage).toBe(100);
    expect(result.taken).toBe(2);
  });

  it("calculates 50% adherence", () => {
    const logs: DoseLog[] = [
      { id: "1", doseOccurrenceId: "occ-1", medicationId: "med-1", scheduleId: "sched-1", action: "taken", actionAt: "2026-07-03T08:05:00", snoozedUntil: "" },
      { id: "2", doseOccurrenceId: "occ-2", medicationId: "med-1", scheduleId: "sched-1", action: "skipped", actionAt: "2026-07-03T20:05:00", snoozedUntil: "" },
    ];
    const result = calculateAdherence(logs, 2);
    expect(result.percentage).toBe(50);
  });

  it("ignores undone actions in calculation", () => {
    const logs: DoseLog[] = [
      { id: "1", doseOccurrenceId: "occ-1", medicationId: "med-1", scheduleId: "sched-1", action: "taken", actionAt: "2026-07-03T08:05:00", snoozedUntil: "" },
      { id: "2", doseOccurrenceId: "occ-1", medicationId: "med-1", scheduleId: "sched-1", action: "undone", actionAt: "2026-07-03T08:10:00", snoozedUntil: "" },
    ];
    const result = calculateAdherence(logs, 1);
    expect(result.percentage).toBe(0);
    expect(result.taken).toBe(0);
  });
});
