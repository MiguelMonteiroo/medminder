import {
  Medication,
  MedicationSchedule,
  DoseOccurrence,
  DoseLog,
  DoseStatus,
} from "../types/domain";

function getDayOfWeek(dateString: string): number {
  const date = new Date(dateString + "T12:00:00");
  return date.getDay();
}

function isDateInRange(
  dateString: string,
  startDate: string,
  endDate: string
): boolean {
  if (startDate && dateString < startDate) return false;
  if (endDate && dateString > endDate) return false;
  return true;
}

function generateIntervalOccurrences(
  medication: Medication,
  schedule: MedicationSchedule,
  date: string
): DoseOccurrence[] {
  const occurrences: DoseOccurrence[] = [];
  const fallbackAnchorDate = schedule.startDate || date;
  const anchor = new Date(
    schedule.anchorAt || `${fallbackAnchorDate}T${schedule.times[0] || "08:00"}:00`
  );
  const intervalMs = schedule.intervalHours * 60 * 60 * 1000;
  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  if (!Number.isFinite(anchor.getTime()) || intervalMs <= 0) return [];

  const firstIndex = Math.max(
    0,
    Math.ceil((dayStart.getTime() - anchor.getTime()) / intervalMs)
  );

  for (
    let sequence = firstIndex;
    anchor.getTime() + sequence * intervalMs < dayEnd.getTime();
    sequence++
  ) {
    const occurrenceDate = new Date(anchor.getTime() + sequence * intervalMs);
    if (occurrenceDate.getTime() < dayStart.getTime()) continue;

    const occurrenceDateString = `${occurrenceDate.getFullYear()}-${String(
      occurrenceDate.getMonth() + 1
    ).padStart(2, "0")}-${String(occurrenceDate.getDate()).padStart(2, "0")}`;
    if (occurrenceDateString !== date) continue;

    const hours = String(occurrenceDate.getHours()).padStart(2, "0");
    const minutes = String(occurrenceDate.getMinutes()).padStart(2, "0");
    occurrences.push({
      id: `${medication.id}-${schedule.id}-${date}-${occurrences.length}`,
      medicationId: medication.id,
      scheduleId: schedule.id,
      scheduledAt: `${date}T${hours}:${minutes}:00`,
      status: "pending",
    });
  }

  return occurrences;
}

export function generateDoseOccurrencesForDate(
  medication: Medication,
  schedule: MedicationSchedule,
  date: string
): DoseOccurrence[] {
  if (medication.isPaused) return [];
  if (!schedule.isActive) return [];
  if (!isDateInRange(date, schedule.startDate, schedule.endDate)) return [];

  if (schedule.kind === "intervalHours") {
    return generateIntervalOccurrences(medication, schedule, date);
  }

  if (schedule.kind === "weekdays") {
    const dayOfWeek = getDayOfWeek(date);
    if (!schedule.weekdays.includes(dayOfWeek)) return [];
  }

  return schedule.times.map((time, index) => ({
    id: `${medication.id}-${schedule.id}-${date}-${index}`,
    medicationId: medication.id,
    scheduleId: schedule.id,
    scheduledAt: `${date}T${time}:00`,
    status: "pending" as DoseStatus,
  }));
}

export function resolveDoseStatus(
  doseOccurrenceId: string,
  logs: DoseLog[],
  scheduledAt?: string,
  now = new Date()
): DoseStatus {
  const relevantLogs = logs.filter(
    (log) => log.doseOccurrenceId === doseOccurrenceId
  );

  const unresolvedStatus = (): DoseStatus => {
    if (!scheduledAt) return "pending";
    const scheduledDate = scheduledAt.slice(0, 10);
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(now.getDate()).padStart(2, "0")}`;
    return scheduledDate < today ? "unrecorded" : "pending";
  };

  if (relevantLogs.length === 0) return unresolvedStatus();

  const latestLog = [...relevantLogs].sort((a, b) =>
    a.actionAt.localeCompare(b.actionAt)
  )[relevantLogs.length - 1];

  if (latestLog.action === "undone") return unresolvedStatus();
  if (latestLog.action === "snoozed") {
    const snoozedUntil = new Date(latestLog.snoozedUntil).getTime();
    if (snoozedUntil > Date.now()) return "snoozed";
    return unresolvedStatus();
  }

  if (latestLog.action === "taken") return "taken";
  if (latestLog.action === "skipped") return "skipped";

  return "pending";
}

export function getTodayDoseViewModel(
  date: string,
  medications: Medication[],
  schedules: MedicationSchedule[],
  logs: DoseLog[]
): { occurrences: DoseOccurrence[]; summary: AdherenceSummary } {
  const allOccurrences: DoseOccurrence[] = [];

  for (const medication of medications) {
    const medSchedules = schedules.filter(
      (s) => s.medicationId === medication.id
    );
    for (const schedule of medSchedules) {
      const occurrences = generateDoseOccurrencesForDate(
        medication,
        schedule,
        date
      );
      for (const occ of occurrences) {
        occ.status = resolveDoseStatus(occ.id, logs, occ.scheduledAt);
      }
      allOccurrences.push(...occurrences);
    }
  }

  return {
    occurrences: allOccurrences,
    summary: getAdherenceSummary(allOccurrences),
  };
}

export interface AdherenceSummary {
  total: number;
  taken: number;
  pending: number;
  skipped: number;
  unrecorded: number;
  snoozed: number;
}

export function getAdherenceSummary(
  occurrences: DoseOccurrence[]
): AdherenceSummary {
  const summary: AdherenceSummary = {
    total: occurrences.length,
    taken: 0,
    pending: 0,
    skipped: 0,
    unrecorded: 0,
    snoozed: 0,
  };

  for (const occ of occurrences) {
    if (occ.status === "taken") summary.taken++;
    else if (occ.status === "pending") summary.pending++;
    else if (occ.status === "skipped") summary.skipped++;
    else if (occ.status === "unrecorded") summary.unrecorded++;
    else if (occ.status === "snoozed") summary.snoozed++;
  }

  return summary;
}
