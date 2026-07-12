import { planOccurrenceReminders } from "../reminderPlanner";
import type { DoseOccurrence } from "../../../types/domain";

const occurrence: DoseOccurrence = {
  id: "occ-1",
  medicationId: "med-1",
  scheduleId: "sched-1",
  scheduledAt: "2026-07-03T08:00:00",
  status: "pending",
};

describe("planOccurrenceReminders", () => {
  it("plans the complete reminder timeline for a future dose", () => {
    const result = planOccurrenceReminders(
      occurrence,
      new Date("2026-07-03T07:00:00")
    );

    expect(result.map((item) => [item.kind, item.scheduledFor])).toEqual([
      ["preAlert", "2026-07-03T07:55:00.000"],
      ["doseAlarm", "2026-07-03T08:00:00.000"],
      ["alarmHandoff", "2026-07-03T08:01:00.000"],
      ["reinforcement", "2026-07-03T08:10:00.000"],
    ]);
  });

  it("omits only timeline items whose time already passed", () => {
    const result = planOccurrenceReminders(
      occurrence,
      new Date("2026-07-03T07:58:00")
    );

    expect(result.map((item) => item.kind)).toEqual([
      "doseAlarm",
      "alarmHandoff",
      "reinforcement",
    ]);
  });

  it("plans a snoozed alarm without another pre-alert", () => {
    const result = planOccurrenceReminders(
      occurrence,
      new Date("2026-07-03T08:01:00"),
      { alarmAt: new Date("2026-07-03T08:06:00"), snoozed: true }
    );

    expect(result.map((item) => item.kind)).toEqual([
      "snoozedAlarm",
      "alarmHandoff",
      "reinforcement",
    ]);
    expect(result[0].scheduledFor).toBe("2026-07-03T08:06:00.000");
  });

  it("uses a stable minute key to group simultaneous doses", () => {
    const result = planOccurrenceReminders(
      occurrence,
      new Date("2026-07-03T07:00:00")
    );

    expect(result.every((item) => item.doseWindowKey === "2026-07-03T08:00")).toBe(
      true
    );
  });
});
