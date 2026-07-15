import type {
  DoseLog,
  Medication,
  MedicationSchedule,
} from "../types/domain";
import {
  generateDoseOccurrencesForDate,
  resolveDoseStatus,
} from "./doseEngine";

export interface AdherenceResult {
  percentage: number;
  taken: number;
  total: number;
}

export function calculateAdherence(
  logs: DoseLog[],
  totalExpected: number
): AdherenceResult {
  const latestActions = new Map<string, DoseLog>();

  for (const log of logs) {
    const existing = latestActions.get(log.doseOccurrenceId);
    if (!existing || log.actionAt > existing.actionAt) {
      latestActions.set(log.doseOccurrenceId, log);
    }
  }

  const taken = Array.from(latestActions.values()).filter(
    (log) => log.action === "taken"
  ).length;

  return {
    percentage: totalExpected > 0 ? Math.round((taken / totalExpected) * 100) : 0,
    taken,
    total: totalExpected,
  };
}

export interface DailyAdherenceSummary {
  date: string;
  total: number;
  taken: number;
  pending: number;
  skipped: number;
  snoozed: number;
  unrecorded: number;
  percentage: number | null;
}

export function buildDailyAdherenceSummary(
  date: string,
  medications: Medication[],
  schedules: MedicationSchedule[],
  logs: DoseLog[],
  now = new Date()
): DailyAdherenceSummary {
  const summary: DailyAdherenceSummary = {
    date,
    total: 0,
    taken: 0,
    pending: 0,
    skipped: 0,
    snoozed: 0,
    unrecorded: 0,
    percentage: null,
  };

  for (const medication of medications) {
    const medicationSchedules = schedules.filter(
      (schedule) => schedule.medicationId === medication.id
    );

    for (const schedule of medicationSchedules) {
      const occurrences = generateDoseOccurrencesForDate(
        medication,
        schedule,
        date
      );

      for (const occurrence of occurrences) {
        const status = resolveDoseStatus(
          occurrence.id,
          logs,
          occurrence.scheduledAt,
          now
        );
        summary.total += 1;
        summary[status] += 1;
      }
    }
  }

  summary.percentage =
    summary.total > 0
      ? Math.round((summary.taken / summary.total) * 100)
      : null;

  return summary;
}

function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseLocalDate(date: string): Date {
  return new Date(`${date}T12:00:00`);
}

export function getLast7Days(reference = new Date()): string[] {
  const days: string[] = [];
  for (let offset = 0; offset < 7; offset++) {
    const date = new Date(reference);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    days.push(formatLocalDate(date));
  }
  return days;
}

const WEEKDAYS = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."];
const MONTHS = [
  "jan.",
  "fev.",
  "mar.",
  "abr.",
  "mai.",
  "jun.",
  "jul.",
  "ago.",
  "set.",
  "out.",
  "nov.",
  "dez.",
];

export function formatHistoryDayLabel(
  date: string,
  reference = new Date()
): string {
  const today = new Date(reference);
  today.setHours(12, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date === formatLocalDate(today)) return "Hoje";
  if (date === formatLocalDate(yesterday)) return "Ontem";

  const parsed = parseLocalDate(date);
  return `${WEEKDAYS[parsed.getDay()]}, ${String(parsed.getDate()).padStart(
    2,
    "0"
  )} ${MONTHS[parsed.getMonth()]}`;
}

export function formatHistoryActionDateTime(
  actionAt: string,
  reference = new Date()
): string {
  const date = new Date(actionAt);
  if (!Number.isFinite(date.getTime())) return "Horário indisponível";

  const dayLabel = formatHistoryDayLabel(formatLocalDate(date), reference);
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
  return `${dayLabel}, ${time}`;
}
