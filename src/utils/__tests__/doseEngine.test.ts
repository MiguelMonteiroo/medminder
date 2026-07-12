import {
  generateDoseOccurrencesForDate,
  resolveDoseStatus,
  getAdherenceSummary,
} from "../doseEngine";
import { Medication, MedicationSchedule, DoseLog } from "../../types/domain";

function makeMed(overrides: Partial<Medication> = {}): Medication {
  return {
    id: "med-1",
    name: "Losartan",
    dosage: "50mg",
    notes: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    isPaused: false,
    ...overrides,
  };
}

function makeSchedule(
  overrides: Partial<MedicationSchedule> = {}
): MedicationSchedule {
  return {
    id: "sched-1",
    medicationId: "med-1",
    kind: "dailyTimes",
    times: ["08:00", "20:00"],
    intervalHours: 0,
    weekdays: [],
    startDate: "",
    endDate: "",
    anchorAt: "",
    snoozeMinutes: 5,
    isActive: true,
    ...overrides,
  };
}

describe("generateDoseOccurrencesForDate", () => {
  it("generates occurrences for dailyTimes schedule", () => {
    const result = generateDoseOccurrencesForDate(
      makeMed(),
      makeSchedule(),
      "2026-07-03"
    );
    expect(result).toHaveLength(2);
    expect(result[0].scheduledAt).toBe("2026-07-03T08:00:00");
    expect(result[1].scheduledAt).toBe("2026-07-03T20:00:00");
    expect(result[0].status).toBe("pending");
  });

  it("returns empty for paused medication", () => {
    const result = generateDoseOccurrencesForDate(
      makeMed({ isPaused: true }),
      makeSchedule(),
      "2026-07-03"
    );
    expect(result).toHaveLength(0);
  });

  it("returns empty for inactive schedule", () => {
    const result = generateDoseOccurrencesForDate(
      makeMed(),
      makeSchedule({ isActive: false }),
      "2026-07-03"
    );
    expect(result).toHaveLength(0);
  });

  it("returns empty when date is before startDate", () => {
    const result = generateDoseOccurrencesForDate(
      makeMed(),
      makeSchedule({ startDate: "2026-07-10" }),
      "2026-07-03"
    );
    expect(result).toHaveLength(0);
  });

  it("returns empty when date is after endDate", () => {
    const result = generateDoseOccurrencesForDate(
      makeMed(),
      makeSchedule({ endDate: "2026-06-30" }),
      "2026-07-03"
    );
    expect(result).toHaveLength(0);
  });

  it("generates occurrences for intervalHours schedule", () => {
    const result = generateDoseOccurrencesForDate(
      makeMed(),
      makeSchedule({ kind: "intervalHours", times: ["08:00"], intervalHours: 6 }),
      "2026-07-03"
    );
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0].scheduledAt).toBe("2026-07-03T08:00:00");
    const times = result.map((o) => o.scheduledAt);
    expect(times).toContain("2026-07-03T14:00:00");
  });

  it("keeps interval schedules continuous across midnight", () => {
    const schedule = makeSchedule({
      kind: "intervalHours",
      times: ["08:00"],
      intervalHours: 8,
      anchorAt: "2026-07-03T08:00:00",
    });

    const firstDay = generateDoseOccurrencesForDate(
      makeMed(),
      schedule,
      "2026-07-03"
    );
    const secondDay = generateDoseOccurrencesForDate(
      makeMed(),
      schedule,
      "2026-07-04"
    );

    expect(firstDay.map((dose) => dose.scheduledAt)).toEqual([
      "2026-07-03T08:00:00",
      "2026-07-03T16:00:00",
    ]);
    expect(secondDay.map((dose) => dose.scheduledAt)).toEqual([
      "2026-07-04T00:00:00",
      "2026-07-04T08:00:00",
      "2026-07-04T16:00:00",
    ]);
  });

  it("generates occurrences only on selected weekdays", () => {
    // 2026-07-03 is a Friday (day 5)
    const result = generateDoseOccurrencesForDate(
      makeMed(),
      makeSchedule({
        kind: "weekdays",
        times: ["10:00"],
        weekdays: [5], // Friday only
      }),
      "2026-07-03"
    );
    expect(result).toHaveLength(1);
    expect(result[0].scheduledAt).toBe("2026-07-03T10:00:00");
  });

  it("excludes non-matching weekdays", () => {
    // 2026-07-03 is a Friday (day 5), but schedule only has Monday (1)
    const result = generateDoseOccurrencesForDate(
      makeMed(),
      makeSchedule({
        kind: "weekdays",
        times: ["10:00"],
        weekdays: [1],
      }),
      "2026-07-03"
    );
    expect(result).toHaveLength(0);
  });

  it("generates occurrences on Sunday when weekdays includes 0", () => {
    // Use a known Sunday. 2026-07-05 is a Sunday.
    const result = generateDoseOccurrencesForDate(
      makeMed(),
      makeSchedule({
        kind: "weekdays",
        times: ["10:00"],
        weekdays: [0],
      }),
      "2026-07-05"
    );
    expect(result).toHaveLength(1);
    expect(result[0].scheduledAt).toBe("2026-07-05T10:00:00");
  });

  it("excludes Sunday when weekdays does not include 0", () => {
    // 2026-07-05 is a Sunday, but schedule only has Monday (1)
    const result = generateDoseOccurrencesForDate(
      makeMed(),
      makeSchedule({
        kind: "weekdays",
        times: ["10:00"],
        weekdays: [1],
      }),
      "2026-07-05"
    );
    expect(result).toHaveLength(0);
  });
});

describe("resolveDoseStatus", () => {
  it("returns taken when log exists with taken action", () => {
    const logs: DoseLog[] = [
      {
        id: "log-1",
        doseOccurrenceId: "occ-1",
        medicationId: "med-1",
        scheduleId: "sched-1",
        action: "taken",
        actionAt: "2026-07-03T08:05:00",
        snoozedUntil: "",
      },
    ];
    expect(resolveDoseStatus("occ-1", logs)).toBe("taken");
  });

  it("returns skipped when log exists with skipped action", () => {
    const logs: DoseLog[] = [
      {
        id: "log-1",
        doseOccurrenceId: "occ-1",
        medicationId: "med-1",
        scheduleId: "sched-1",
        action: "skipped",
        actionAt: "2026-07-03T08:05:00",
        snoozedUntil: "",
      },
    ];
    expect(resolveDoseStatus("occ-1", logs)).toBe("skipped");
  });

  it("returns snoozed when snoozedUntil is in the future", () => {
    const future = new Date(Date.now() + 3600000).toISOString();
    const logs: DoseLog[] = [
      {
        id: "log-1",
        doseOccurrenceId: "occ-1",
        medicationId: "med-1",
        scheduleId: "sched-1",
        action: "snoozed",
        actionAt: "2026-07-03T08:05:00",
        snoozedUntil: future,
      },
    ];
    expect(resolveDoseStatus("occ-1", logs)).toBe("snoozed");
  });

  it("returns pending when snoozedUntil has passed", () => {
    const past = new Date(Date.now() - 3600000).toISOString();
    const logs: DoseLog[] = [
      {
        id: "log-1",
        doseOccurrenceId: "occ-1",
        medicationId: "med-1",
        scheduleId: "sched-1",
        action: "snoozed",
        actionAt: "2026-07-03T08:05:00",
        snoozedUntil: past,
      },
    ];
    expect(resolveDoseStatus("occ-1", logs)).toBe("pending");
  });

  it("returns pending when undone action exists", () => {
    const logs: DoseLog[] = [
      {
        id: "log-1",
        doseOccurrenceId: "occ-1",
        medicationId: "med-1",
        scheduleId: "sched-1",
        action: "undone",
        actionAt: "2026-07-03T08:10:00",
        snoozedUntil: "",
      },
    ];
    expect(resolveDoseStatus("occ-1", logs)).toBe("pending");
  });

  it("uses the most recent log even when logs are not sorted ascending", () => {
    const logs: DoseLog[] = [
      {
        id: "log-2",
        doseOccurrenceId: "occ-1",
        medicationId: "med-1",
        scheduleId: "sched-1",
        action: "taken",
        actionAt: "2026-07-03T08:10:00",
        snoozedUntil: "",
      },
      {
        id: "log-1",
        doseOccurrenceId: "occ-1",
        medicationId: "med-1",
        scheduleId: "sched-1",
        action: "undone",
        actionAt: "2026-07-03T08:05:00",
        snoozedUntil: "",
      },
    ];

    expect(resolveDoseStatus("occ-1", logs)).toBe("taken");
  });

  it("returns pending when no logs exist", () => {
    expect(resolveDoseStatus("occ-1", [])).toBe("pending");
  });

  it("returns unrecorded for a previous-day dose without an action", () => {
    expect(
      resolveDoseStatus(
        "occ-1",
        [],
        "2026-07-03T20:00:00",
        new Date("2026-07-04T00:01:00")
      )
    ).toBe("unrecorded");
  });

  it("keeps a same-day dose pending after its scheduled time", () => {
    expect(
      resolveDoseStatus(
        "occ-1",
        [],
        "2026-07-03T08:00:00",
        new Date("2026-07-03T23:59:00")
      )
    ).toBe("pending");
  });
});

describe("getAdherenceSummary", () => {
  it("returns zero counts for empty occurrences", () => {
    const summary = getAdherenceSummary([]);
    expect(summary.total).toBe(0);
    expect(summary.taken).toBe(0);
    expect(summary.pending).toBe(0);
    expect(summary.unrecorded).toBe(0);
    expect(summary.skipped).toBe(0);
    expect(summary.snoozed).toBe(0);
  });

  it("counts occurrences by status", () => {
    const occurrences = [
      {
        id: "1", medicationId: "med-1", scheduleId: "sched-1",
        scheduledAt: "2026-07-03T08:00:00", status: "taken" as const,
      },
      {
        id: "2", medicationId: "med-1", scheduleId: "sched-1",
        scheduledAt: "2026-07-03T20:00:00", status: "pending" as const,
      },
      {
        id: "3", medicationId: "med-1", scheduleId: "sched-1",
        scheduledAt: "2026-07-03T12:00:00", status: "skipped" as const,
      },
    ];
    const summary = getAdherenceSummary(occurrences);
    expect(summary.total).toBe(3);
    expect(summary.taken).toBe(1);
    expect(summary.pending).toBe(1);
    expect(summary.skipped).toBe(1);
  });
});
