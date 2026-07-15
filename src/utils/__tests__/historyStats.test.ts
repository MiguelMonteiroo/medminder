import type { DoseLog, Medication, MedicationSchedule } from "../../types/domain";
import {
  buildDailyAdherenceSummary,
  formatHistoryActionDateTime,
  formatHistoryDayLabel,
  getLast7Days,
} from "../stats";

const medication: Medication = {
  id: "med-1",
  name: "Losartana",
  dosage: "50 mg",
  notes: "",
  createdAt: "2026-07-01T00:00:00",
  updatedAt: "2026-07-01T00:00:00",
  isPaused: false,
};

const schedule: MedicationSchedule = {
  id: "sched-1",
  medicationId: medication.id,
  kind: "dailyTimes",
  times: ["08:00", "20:00"],
  intervalHours: 0,
  weekdays: [],
  startDate: "",
  endDate: "",
  anchorAt: "",
  snoozeMinutes: 5,
  isActive: true,
};

function makeLog(
  date: string,
  index: number,
  action: DoseLog["action"],
  actionAt = `${date}T08:05:00`
): DoseLog {
  return {
    id: `${date}-${index}-${action}`,
    doseOccurrenceId: `med-1-sched-1-${date}-${index}`,
    medicationId: medication.id,
    scheduleId: schedule.id,
    action,
    actionAt,
    snoozedUntil: "",
  };
}

describe("buildDailyAdherenceSummary", () => {
  it("uses only occurrences and logs from the requested local day", () => {
    const result = buildDailyAdherenceSummary(
      "2026-07-13",
      [medication],
      [schedule],
      [makeLog("2026-07-12", 0, "taken")],
      new Date("2026-07-13T12:00:00")
    );

    expect(result).toMatchObject({
      date: "2026-07-13",
      total: 2,
      taken: 0,
      percentage: 0,
    });
  });

  it("does not count a skipped dose as adherence", () => {
    const result = buildDailyAdherenceSummary(
      "2026-07-13",
      [medication],
      [schedule],
      [
        makeLog("2026-07-13", 0, "taken"),
        makeLog("2026-07-13", 1, "skipped", "2026-07-13T20:05:00"),
      ],
      new Date("2026-07-13T21:00:00")
    );

    expect(result).toMatchObject({
      total: 2,
      taken: 1,
      skipped: 1,
      percentage: 50,
    });
  });

  it("returns no percentage when the day has no scheduled doses", () => {
    const result = buildDailyAdherenceSummary(
      "2026-07-13",
      [],
      [],
      [],
      new Date("2026-07-13T12:00:00")
    );

    expect(result.total).toBe(0);
    expect(result.percentage).toBeNull();
  });

  it("uses the latest action for an occurrence", () => {
    const result = buildDailyAdherenceSummary(
      "2026-07-13",
      [medication],
      [schedule],
      [
        makeLog("2026-07-13", 0, "taken", "2026-07-13T08:05:00"),
        makeLog("2026-07-13", 0, "undone", "2026-07-13T08:10:00"),
      ],
      new Date("2026-07-13T12:00:00")
    );

    expect(result.taken).toBe(0);
    expect(result.pending).toBe(2);
  });
});

describe("history date formatting", () => {
  const reference = new Date(2026, 6, 13, 12, 0, 0);

  it("returns seven days from today backwards", () => {
    expect(getLast7Days(reference)).toEqual([
      "2026-07-13",
      "2026-07-12",
      "2026-07-11",
      "2026-07-10",
      "2026-07-09",
      "2026-07-08",
      "2026-07-07",
    ]);
  });

  it("uses friendly labels for today, yesterday, and older days", () => {
    expect(formatHistoryDayLabel("2026-07-13", reference)).toBe("Hoje");
    expect(formatHistoryDayLabel("2026-07-12", reference)).toBe("Ontem");
    expect(formatHistoryDayLabel("2026-07-11", reference)).toBe("sáb., 11 jul.");
  });

  it("formats recent actions with a friendly day and time", () => {
    expect(
      formatHistoryActionDateTime("2026-07-13T08:05:00", reference)
    ).toBe("Hoje, 08:05");
  });
});
