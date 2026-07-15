import { ScheduleKind, MedicationSchedule } from "../types/domain";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validateProfileName(name: string): string | null {
  if (!name.trim()) return "Informe como podemos chamar você.";
  return null;
}

export function validateMedicationName(name: string): string | null {
  if (!name.trim()) {
    return "O nome do medicamento é obrigatório.";
  }
  return null;
}

export function validateDosage(dosage: string): string | null {
  return null;
}

export function validateTimeHHMM(time: string): string | null {
  if (!time.trim()) {
    return "O horário é obrigatório.";
  }
  if (!timeRegex.test(time.trim())) {
    return "Formato de horário inválido. Use HH:MM (ex: 08:00).";
  }
  return null;
}

interface ScheduleInput {
  kind: string;
  times: string[];
  intervalHours: number;
  weekdays: number[];
}

export function validateSchedule(input: ScheduleInput): string | null {
  const errors: string[] = [];

  if (!input.kind) {
    errors.push("O tipo de agendamento é obrigatório.");
    return errors.join(" ");
  }

  if (input.times.length === 0) {
    errors.push("Informe pelo menos um horário.");
  } else {
    for (const time of input.times) {
      const timeError = validateTimeHHMM(time);
      if (timeError) {
        errors.push(timeError);
      }
    }
  }

  if (input.kind === "intervalHours" && input.intervalHours < 1) {
    errors.push("O intervalo deve ser de pelo menos 1 hora.");
  }

  if (input.kind === "weekdays" && input.weekdays.length === 0) {
    errors.push("Selecione pelo menos um dia da semana.");
  }

  return errors.length > 0 ? errors.join(" ") : null;
}

interface MedicationInput {
  name: string;
  dosage: string;
  notes: string;
}

export function normalizeMedicationInput(input: MedicationInput): {
  name: string;
  dosage: string;
  notes: string;
} {
  return {
    name: input.name.trim(),
    dosage: input.dosage.trim() || "Sem dosagem",
    notes: input.notes.trim(),
  };
}

interface ScheduleNormalizeInput {
  kind: ScheduleKind;
  times: string[];
  intervalHours?: number;
  weekdays?: number[];
  startDate?: string;
  endDate?: string;
  snoozeMinutes?: number;
  isActive?: boolean;
}

export function normalizeScheduleInput(
  input: ScheduleNormalizeInput
): Omit<MedicationSchedule, "id" | "medicationId"> {
  return {
    kind: input.kind,
    times: input.times,
    intervalHours: input.intervalHours ?? 0,
    weekdays: input.weekdays ?? [],
    startDate: input.startDate ?? "",
    endDate: input.endDate ?? "",
    anchorAt: "",
    snoozeMinutes: input.snoozeMinutes ?? 5,
    isActive: input.isActive ?? true,
  };
}
