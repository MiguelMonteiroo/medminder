import { DoseLog } from "../types/domain";

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

export function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    );
  }
  return days;
}
