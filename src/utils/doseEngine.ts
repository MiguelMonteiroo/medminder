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
  const startTimeParts = schedule.times[0]?.split(":").map(Number) || [8, 0];
  const startMinutes = startTimeParts[0] * 60 + startTimeParts[1];
  const intervalMinutes = schedule.intervalHours * 60;
  const dayMinutes = 24 * 60;

  let currentMinute = startMinutes;
  let index = 0;

  while (currentMinute < dayMinutes) {
    const hours = Math.floor(currentMinute / 60)
      .toString()
      .padStart(2, "0");
    const minutes = (currentMinute % 60).toString().padStart(2, "0");
    occurrences.push({
      id: `${medication.id}-${schedule.id}-${date}-${index}`,
      medicationId: medication.id,
      scheduleId: schedule.id,
      scheduledAt: `${date}T${hours}:${minutes}:00`,
      status: "pending",
    });
    currentMinute += intervalMinutes;
    index++;
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
  logs: DoseLog[]
): DoseStatus {
  const relevantLogs = logs.filter(
    (log) => log.doseOccurrenceId === doseOccurrenceId
  );

  if (relevantLogs.length === 0) return "pending";

  const latestLog = [...relevantLogs].sort((a, b) =>
    a.actionAt.localeCompare(b.actionAt)
  )[relevantLogs.length - 1];

  if (latestLog.action === "undone") return "pending";
  if (latestLog.action === "snoozed") {
    const snoozedUntil = new Date(latestLog.snoozedUntil).getTime();
    if (snoozedUntil > Date.now()) return "snoozed";
    return "pending";
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
        occ.status = resolveDoseStatus(occ.id, logs);
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
  missed: number;
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
    missed: 0,
    snoozed: 0,
  };

  for (const occ of occurrences) {
    if (occ.status === "taken") summary.taken++;
    else if (occ.status === "pending") summary.pending++;
    else if (occ.status === "skipped") summary.skipped++;
    else if (occ.status === "missed") summary.missed++;
    else if (occ.status === "snoozed") summary.snoozed++;
  }

  return summary;
}
