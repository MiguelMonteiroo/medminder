import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useDatabase } from "../database/DatabaseProvider";
import {
  Medication,
  MedicationSchedule,
  DoseLog,
  DoseOccurrence,
  ReminderSettings,
} from "../types/domain";
import { createMedicationRepository, MedicationRepository } from "../database/repositories/medicationRepository";
import { createScheduleRepository, ScheduleRepository } from "../database/repositories/scheduleRepository";
import { createDoseLogRepository, DoseLogRepository } from "../database/repositories/doseLogRepository";
import { createSettingsRepository, SettingsRepository } from "../database/repositories/settingsRepository";
import { createDoseService, DoseService } from "./doseService";
import { createReminderScheduler } from "./reminderScheduler";
import { getNotificationPermissionStatus } from "./notificationPermissionService";
import { createRepositories } from "../database/db";
import {
  generateDoseOccurrencesForDate,
  getTodayDoseViewModel,
  AdherenceSummary,
} from "../utils/doseEngine";
import { validateMedicationName, validateTimeHHMM, normalizeMedicationInput } from "../utils/validation";

interface AppDataContextValue {
  medications: Medication[];
  schedules: MedicationSchedule[];
  todayOccurrences: DoseOccurrence[];
  todaySummary: AdherenceSummary;
  loading: boolean;
  error: string | null;
  settings: ReminderSettings;
  addMedication: (name: string, dosage: string, time: string, notes: string, scheduleKind?: string, intervalHours?: number, weekdays?: number[]) => Promise<void>;
  removeMedication: (id: string) => Promise<void>;
  setDoseTaken: (occurrenceId: string, medicationId: string, scheduleId: string, isTaken: boolean) => Promise<void>;
  skipDose: (occurrenceId: string, medicationId: string, scheduleId: string) => Promise<void>;
  snoozeDose: (occurrenceId: string, medicationId: string, scheduleId: string) => Promise<void>;
  doseService: DoseService | null;
  setMedicationPaused: (medicationId: string, paused: boolean) => Promise<void>;
  updateMedicationWithSchedule: (
    medicationId: string,
    name: string,
    dosage: string,
    notes: string,
    scheduleKind?: string,
    time?: string,
    intervalHours?: number,
    weekdays?: number[]
  ) => Promise<void>;
  updateUserName: (name: string) => Promise<void>;
  updateNotificationsEnabled: (enabled: boolean) => Promise<void>;
  rescheduleMedicationNotifications: () => Promise<void>;
}

const DEFAULT_SETTINGS: ReminderSettings = {
  notificationsEnabled: false,
  defaultSnoozeMinutes: 5,
  userName: "Maria",
};

const AppDataContext = createContext<AppDataContextValue>({
  medications: [],
  schedules: [],
  todayOccurrences: [],
  todaySummary: { total: 0, taken: 0, pending: 0, skipped: 0, missed: 0, snoozed: 0 },
  loading: true,
  error: null,
  settings: DEFAULT_SETTINGS,
  addMedication: async () => {},
  removeMedication: async () => {},
  setDoseTaken: async () => {},
  skipDose: async () => {},
  snoozeDose: async () => {},
  doseService: null,
  setMedicationPaused: async () => {},
  updateMedicationWithSchedule: async () => {},
  updateUserName: async () => {},
  updateNotificationsEnabled: async () => {},
  rescheduleMedicationNotifications: async () => {},
});

export function useAppData() {
  return useContext(AppDataContext);
}

function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const db = useDatabase();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [logs, setLogs] = useState<DoseLog[]>([]);
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const repos = createRepositories(db);
  const doseSvc = createDoseService(repos.doseLogs);
  const reminderScheduler = createReminderScheduler(repos.notifications);
  const today = getTodayString();

  const loadData = useCallback(async () => {
    try {
      const [meds, scheds, doseLogs, appSettings] = await Promise.all([
        repos.medications.getAll(),
        repos.schedules.getAll(),
        repos.doseLogs.getAll(),
        repos.settings.get(),
      ]);
      setMedications(meds);
      setSchedules(scheds);
      setLogs(doseLogs);
      setSettings(appSettings);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const todayData = getTodayDoseViewModel(today, medications, schedules, logs);

  const scheduleMedicationNotifications = useCallback(
    async (
      medication: Medication,
      schedule: MedicationSchedule,
      forceEnabled = false
    ) => {
      if (medication.isPaused || !schedule.isActive) return;
      if (!forceEnabled && !settings.notificationsEnabled) return;

      const { granted } = await getNotificationPermissionStatus();
      if (!granted) return;

      const now = Date.now();
      const start = new Date();
      const nextOccurrences = Array.from({ length: 14 }, (_, index) =>
        generateDoseOccurrencesForDate(
          medication,
          schedule,
          formatDateString(addDays(start, index))
        )
      )
        .flat()
        .filter((occurrence) => new Date(occurrence.scheduledAt).getTime() > now);

      for (const occurrence of nextOccurrences) {
        await reminderScheduler.scheduleForOccurrence(
          occurrence,
          medication,
          schedule
        );
      }
    },
    [settings.notificationsEnabled]
  );

  const rescheduleMedicationNotifications = useCallback(async (forceEnabled = false) => {
    await reminderScheduler.cancelAll();
    for (const medication of medications) {
      const medicationSchedules = schedules.filter(
        (schedule) => schedule.medicationId === medication.id
      );
      for (const schedule of medicationSchedules) {
        await scheduleMedicationNotifications(medication, schedule, forceEnabled);
      }
    }
  }, [medications, schedules, scheduleMedicationNotifications]);

  const addMedication = useCallback(
    async (name: string, dosage: string, time: string, notes: string, scheduleKind?: string, intervalHours?: number, weekdays?: number[]) => {
      const now = new Date().toISOString();
      const medId = `med-${Date.now()}`;
      const schedId = `sched-${Date.now()}`;

      const medication: Medication = {
        id: medId,
        name,
        dosage: dosage || "Sem dosagem",
        notes,
        createdAt: now,
        updatedAt: now,
        isPaused: false,
      };

      const kind = (scheduleKind as MedicationSchedule["kind"]) || "dailyTimes";

      const schedule: MedicationSchedule = {
        id: schedId,
        medicationId: medId,
        kind,
        times: kind === "intervalHours" ? [time] : [time],
        intervalHours: kind === "intervalHours" ? (intervalHours || 8) : 0,
        weekdays: kind === "weekdays" ? (weekdays || []) : [],
        startDate: "",
        endDate: "",
        snoozeMinutes: 5,
        isActive: true,
      };

      await Promise.all([
        repos.medications.create(medication),
        repos.schedules.create(schedule),
      ]);

      setMedications((prev) => [...prev, medication]);
      setSchedules((prev) => [...prev, schedule]);
      await scheduleMedicationNotifications(medication, schedule);
    },
    [scheduleMedicationNotifications]
  );

  const removeMedication = useCallback(async (id: string) => {
    await reminderScheduler.cancelForMedication(id);
    await Promise.all([
      repos.schedules.removeByMedicationId(id),
      repos.medications.remove(id),
    ]);
    setMedications((prev) => prev.filter((m) => m.id !== id));
    setSchedules((prev) => prev.filter((s) => s.medicationId !== id));
  }, []);

  const setMedicationPaused = useCallback(
    async (medicationId: string, paused: boolean) => {
      const medication = medications.find((m) => m.id === medicationId);
      if (!medication) return;
      const updated = { ...medication, isPaused: paused, updatedAt: new Date().toISOString() };
      await reminderScheduler.cancelForMedication(medicationId);
      await repos.medications.update(updated);
      setMedications((prev) => prev.map((m) => (m.id === medicationId ? updated : m)));
      if (!paused) {
        const schedule = schedules.find((s) => s.medicationId === medicationId);
        if (schedule) await scheduleMedicationNotifications(updated, schedule);
      }
    },
    [medications, schedules, scheduleMedicationNotifications]
  );

  const setDoseTaken = useCallback(
    async (occurrenceId: string, medicationId: string, scheduleId: string, isTaken: boolean) => {
      const now = new Date().toISOString();
      if (isTaken) {
        await doseSvc.undoDoseAction(occurrenceId, medicationId, scheduleId, now);
      } else {
        await doseSvc.markDoseTaken(occurrenceId, medicationId, scheduleId, now);
      }
      const doseLogs = await repos.doseLogs.getAll();
      setLogs(doseLogs);
    },
    []
  );

  const skipDose = useCallback(
    async (occurrenceId: string, medicationId: string, scheduleId: string) => {
      const now = new Date().toISOString();
      await doseSvc.skipDose(occurrenceId, medicationId, scheduleId, now);
      const doseLogs = await repos.doseLogs.getAll();
      setLogs(doseLogs);
    },
    []
  );

  const snoozeDose = useCallback(
    async (occurrenceId: string, medicationId: string, scheduleId: string) => {
      const now = new Date();
      const snoozedUntil = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
      await doseSvc.snoozeDose(
        occurrenceId,
        medicationId,
        scheduleId,
        now.toISOString(),
        snoozedUntil
      );
      const doseLogs = await repos.doseLogs.getAll();
      setLogs(doseLogs);
    },
    []
  );

  const updateMedicationWithSchedule = useCallback(
    async (
      medicationId: string,
      name: string,
      dosage: string,
      notes: string,
      scheduleKind?: string,
      time?: string,
      intervalHours?: number,
      weekdays?: number[]
    ) => {
      const medication = medications.find((m) => m.id === medicationId);
      if (!medication) return;

      const now = new Date().toISOString();

      const updated: Medication = {
        ...medication,
        name,
        dosage: dosage || "Sem dosagem",
        notes,
        updatedAt: now,
      };

      await reminderScheduler.cancelForMedication(medicationId);
      await repos.medications.update(updated);
      setMedications((prev) => prev.map((m) => (m.id === medicationId ? updated : m)));

      const existingSchedule = schedules.find(
        (s) => s.medicationId === medicationId
      );
      const kind = (scheduleKind as MedicationSchedule["kind"]) || existingSchedule?.kind || "dailyTimes";

      if (existingSchedule) {
        const updatedSchedule: MedicationSchedule = {
          ...existingSchedule,
          kind,
          times: time ? [time] : existingSchedule.times,
          intervalHours: kind === "intervalHours" ? (intervalHours || existingSchedule.intervalHours || 8) : 0,
          weekdays: kind === "weekdays" ? (weekdays || existingSchedule.weekdays) : [],
        };
        await repos.schedules.update(updatedSchedule);
        setSchedules((prev) => prev.map((s) => (s.id === updatedSchedule.id ? updatedSchedule : s)));
        await scheduleMedicationNotifications(updated, updatedSchedule);
      } else {
        const newSchedule: MedicationSchedule = {
          id: `sched-${Date.now()}`,
          medicationId,
          kind,
          times: [time || "08:00"],
          intervalHours: kind === "intervalHours" ? (intervalHours || 8) : 0,
          weekdays: kind === "weekdays" ? (weekdays || []) : [],
          startDate: "",
          endDate: "",
          snoozeMinutes: 5,
          isActive: true,
        };
        await repos.schedules.create(newSchedule);
        setSchedules((prev) => [...prev, newSchedule]);
        await scheduleMedicationNotifications(updated, newSchedule);
      }
    },
    [medications, schedules, scheduleMedicationNotifications]
  );

  const updateUserName = useCallback(
    async (name: string) => {
      const trimmed = name.trim() || DEFAULT_SETTINGS.userName;
      const updated = { ...settings, userName: trimmed };
      await repos.settings.update(updated);
      setSettings(updated);
    },
    [settings]
  );

  const updateNotificationsEnabled = useCallback(
    async (enabled: boolean) => {
      const updated = { ...settings, notificationsEnabled: enabled };
      await repos.settings.update(updated);
      setSettings(updated);
      if (enabled) {
        await rescheduleMedicationNotifications(true);
      } else {
        await reminderScheduler.cancelAll();
      }
    },
    [settings, rescheduleMedicationNotifications]
  );

  return (
    <AppDataContext.Provider
      value={{
        medications,
        schedules,
        todayOccurrences: todayData.occurrences,
        todaySummary: todayData.summary,
        loading,
        error,
        settings,
        addMedication,
        removeMedication,
        setDoseTaken,
        skipDose,
        snoozeDose,
        setMedicationPaused,
        updateMedicationWithSchedule,
        updateUserName,
        updateNotificationsEnabled,
        rescheduleMedicationNotifications,
        doseService: doseSvc,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}
