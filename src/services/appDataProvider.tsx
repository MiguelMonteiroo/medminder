import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import { useDatabase } from "../database/DatabaseProvider";
import {
  Medication,
  MedicationSchedule,
  DoseLog,
  DoseOccurrence,
  ReminderSettings,
} from "../types/domain";
import { createDoseService, DoseService } from "./doseService";
import { createReminderScheduler } from "./reminderScheduler";
import {
  ensureChannelCreated,
  getNotificationPermissionStatus,
  getReminderPermissionState,
} from "./notificationPermissionService";
import { reconcileNotifications } from "./reminderSyncService";
import { createReminderPermissionMonitor } from "./reminders/reminderPermissionMonitor";
import { startReminderSyncInBackground } from "./reminders/reminderSyncCoordinator";
import { createRepositories } from "../database/db";
import { createMedicationPersistenceService } from "./medicationPersistenceService";
import {
  generateDoseOccurrencesForDate,
  getTodayDoseViewModel,
  AdherenceSummary,
} from "../utils/doseEngine";
import {
  normalizeMedicationInput,
  validateMedicationName,
  validateProfileName,
  validateTimeHHMM,
} from "../utils/validation";
import { DEFAULT_REMINDER_SETTINGS } from "../utils/defaultReminderSettings";

interface AppDataContextValue {
  medications: Medication[];
  schedules: MedicationSchedule[];
  doseLogs: DoseLog[];
  todayOccurrences: DoseOccurrence[];
  todaySummary: AdherenceSummary;
  loading: boolean;
  error: string | null;
  retryLoadingData: () => Promise<void>;
  refreshDoseLogs: () => Promise<void>;
  reminderSyncPending: boolean;
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
  completeOnboarding: (name: string) => Promise<void>;
  updateNotificationsEnabled: (enabled: boolean) => Promise<void>;
  updateReminderSettings: (patch: Partial<ReminderSettings>) => Promise<void>;
  rescheduleMedicationNotifications: () => Promise<void>;
  runAlarmTest: () => Promise<void>;
  snoozeMinutes: number;
}

const DEFAULT_SETTINGS = DEFAULT_REMINDER_SETTINGS;

const AppDataContext = createContext<AppDataContextValue>({
  medications: [],
  schedules: [],
  doseLogs: [],
  todayOccurrences: [],
  todaySummary: { total: 0, taken: 0, pending: 0, skipped: 0, unrecorded: 0, snoozed: 0 },
  loading: true,
  error: null,
  retryLoadingData: async () => {},
  refreshDoseLogs: async () => {},
  reminderSyncPending: false,
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
  completeOnboarding: async () => {},
  updateNotificationsEnabled: async () => {},
  updateReminderSettings: async () => {},
  rescheduleMedicationNotifications: async () => {},
  runAlarmTest: async () => {},
  snoozeMinutes: 5,
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
  const settingsRef = useRef<ReminderSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reminderSyncPending, setReminderSyncPending] = useState(false);
  const reminderSyncCounterRef = useRef({ current: 0, failed: false });

  const repos = createRepositories(db);
  const medicationPersistence = createMedicationPersistenceService(db);
  const doseSvc = createDoseService(repos.doseLogs);
  const reminderScheduler = createReminderScheduler(repos.reminderArtifacts);
  const permissionMonitor = useRef<
    ReturnType<typeof createReminderPermissionMonitor> | undefined
  >(undefined);
  if (!permissionMonitor.current) {
    permissionMonitor.current = createReminderPermissionMonitor({
      readState: getReminderPermissionState,
      onCapabilitiesChanged: async () => {
        await ensureChannelCreated();
        await reminderScheduler.cancelAll();
        await reconcileNotifications(
          repos.reminderArtifacts,
          repos.medications,
          repos.schedules,
          repos.settings,
          reminderScheduler
        );
      },
    });
  }
  const today = getTodayString();

  const loadData = useCallback(async () => {
    try {
      await ensureChannelCreated();
      const [meds, scheds, doseLogs, appSettings] = await Promise.all([
        repos.medications.getAll(),
        repos.schedules.getAll(),
        repos.doseLogs.getAll(),
        repos.settings.get(),
      ]);
      setMedications(meds);
      setSchedules(scheds);
      setLogs(doseLogs);
      settingsRef.current = appSettings;
      setSettings(appSettings);
      setError(null);

      const legacyMappings = await repos.notifications.getAll();
      if (legacyMappings.length > 0) {
        await reminderScheduler.cancelAll();
        await repos.notifications.removeAll();
      }

      await reconcileNotifications(
        repos.reminderArtifacts,
        repos.medications,
        repos.schedules,
        repos.settings,
        reminderScheduler
      );
      setReminderSyncPending(false);
    } catch {
      setError("Não foi possível carregar sua rotina.");
    } finally {
      setLoading(false);
    }
  }, []);

  const retryLoadingData = useCallback(async () => {
    setLoading(true);
    await loadData();
  }, [loadData]);

  const refreshDoseLogs = useCallback(async () => {
    setLogs(await repos.doseLogs.getAll());
  }, []);

  useEffect(() => {
    permissionMonitor.current?.refresh().catch(() => undefined);
    loadData();
  }, [loadData]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        permissionMonitor.current
          ?.refresh()
          .catch(() => undefined)
          .finally(loadData);
      }
    });
    return () => subscription.remove();
  }, [loadData]);

  const todayData = getTodayDoseViewModel(today, medications, schedules, logs);

  const scheduleMedicationNotifications = useCallback(
    async (
      medication: Medication,
      schedule: MedicationSchedule,
      forceEnabled = false,
      reminderSettings = settings
    ) => {
      if (medication.isPaused || !schedule.isActive) return;
      if (!forceEnabled && !reminderSettings.notificationsEnabled) return;

      const { granted } = await getNotificationPermissionStatus();
      if (!granted) return;

      const now = Date.now();
      const start = new Date();
      const horizon = now + 48 * 60 * 60 * 1000;
      const nextOccurrences = Array.from({ length: 3 }, (_, index) =>
        generateDoseOccurrencesForDate(
          medication,
          schedule,
          formatDateString(addDays(start, index))
        )
      )
        .flat()
        .filter((occurrence) => {
          const timestamp = new Date(occurrence.scheduledAt).getTime();
          return timestamp > now && timestamp <= horizon;
        });

      for (const occurrence of nextOccurrences) {
        await reminderScheduler.scheduleForOccurrence(
          occurrence,
          medication,
          schedule,
          {
            showLockScreenDetails: reminderSettings.showLockScreenDetails,
            fullScreenAlarmEnabled: reminderSettings.fullScreenAlarmEnabled,
            criticalAlertsEnabled: reminderSettings.criticalAlertsEnabled,
          }
        );
      }
    },
    [settings]
  );

  const rescheduleMedicationNotifications = useCallback(async (
    forceEnabled = false,
    reminderSettings = settings
  ) => {
    await reminderScheduler.cancelAll();
    for (const medication of medications) {
      const medicationSchedules = schedules.filter(
        (schedule) => schedule.medicationId === medication.id
      );
      for (const schedule of medicationSchedules) {
        await scheduleMedicationNotifications(
          medication,
          schedule,
          forceEnabled,
          reminderSettings
        );
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
        anchorAt: kind === "intervalHours" ? `${getTodayString()}T${time}:00` : "",
        snoozeMinutes: settings.defaultSnoozeMinutes,
        isActive: true,
      };

      await medicationPersistence.createWithSchedule(medication, schedule);

      setMedications((prev) => [...prev, medication]);
      setSchedules((prev) => [...prev, schedule]);
      startReminderSyncInBackground({
        sync: async () => {
          await scheduleMedicationNotifications(medication, schedule);
          await reconcileNotifications(
            repos.reminderArtifacts,
            repos.medications,
            repos.schedules,
            repos.settings,
            reminderScheduler
          );
        },
        fallback: () =>
          reconcileNotifications(
            repos.reminderArtifacts,
            repos.medications,
            repos.schedules,
            repos.settings,
            reminderScheduler
          ),
        onPendingChange: setReminderSyncPending,
        pendingCounter: reminderSyncCounterRef.current,
      });
    },
    [scheduleMedicationNotifications, settings.defaultSnoozeMinutes]
  );

  const removeMedication = useCallback(async (id: string) => {
    await reminderScheduler.cancelForMedication(id);
    await medicationPersistence.remove(id);
    setMedications((prev) => prev.filter((m) => m.id !== id));
    setSchedules((prev) => prev.filter((s) => s.medicationId !== id));
    setLogs((prev) => prev.filter((log) => log.medicationId !== id));
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
        const schedule = schedules.find(
          (candidate) =>
            candidate.medicationId === medicationId && candidate.isActive
        );
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
        await reminderScheduler.cancelSingle(occurrenceId);
      }
      await refreshDoseLogs();
    },
    []
  );

  const skipDose = useCallback(
    async (occurrenceId: string, medicationId: string, scheduleId: string) => {
      const now = new Date().toISOString();
      await doseSvc.skipDose(occurrenceId, medicationId, scheduleId, now);
      await reminderScheduler.cancelSingle(occurrenceId);
      await refreshDoseLogs();
    },
    []
  );

  const snoozeDose = useCallback(
    async (occurrenceId: string, medicationId: string, scheduleId: string) => {
      const snoozeCount = await repos.doseLogs.countSnoozes(occurrenceId);
      if (snoozeCount >= 3) return;
      const now = new Date();
      const snoozeMs = 5 * 60 * 1000;
      const snoozedUntil = new Date(now.getTime() + snoozeMs);

      await reminderScheduler.cancelSingle(occurrenceId);

      const occurrence: DoseOccurrence = {
        id: occurrenceId,
        medicationId,
        scheduleId,
        scheduledAt: snoozedUntil.toISOString(),
        status: "pending",
      };

      const medication = medications.find((m) => m.id === medicationId);
      const schedule = schedules.find((s) => s.id === scheduleId);

      if (medication && schedule) {
        await reminderScheduler.scheduleForOccurrence(
          occurrence,
          medication,
          schedule,
          {
            showLockScreenDetails: settings.showLockScreenDetails,
            fullScreenAlarmEnabled: settings.fullScreenAlarmEnabled,
            criticalAlertsEnabled: settings.criticalAlertsEnabled,
            snoozed: true,
            alarmAt: snoozedUntil,
          }
        );
      }

      await doseSvc.snoozeDose(
        occurrenceId,
        medicationId,
        scheduleId,
        now.toISOString(),
        snoozedUntil.toISOString()
      );

      await refreshDoseLogs();
    },
    [settings.defaultSnoozeMinutes, medications, schedules]
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

      const medicationSchedules = schedules.filter(
        (schedule) => schedule.medicationId === medicationId
      );
      const existingSchedule =
        medicationSchedules.find((schedule) => schedule.isActive) ||
        medicationSchedules[0];
      const kind = (scheduleKind as MedicationSchedule["kind"]) || existingSchedule?.kind || "dailyTimes";

      let persistedSchedule: MedicationSchedule;
      if (existingSchedule) {
        persistedSchedule = {
          ...existingSchedule,
          kind,
          times: time ? [time] : existingSchedule.times,
          intervalHours: kind === "intervalHours" ? (intervalHours || existingSchedule.intervalHours || 8) : 0,
          weekdays: kind === "weekdays" ? (weekdays || existingSchedule.weekdays) : [],
          anchorAt:
            kind === "intervalHours" && time
              ? `${getTodayString()}T${time}:00`
              : kind === "intervalHours"
                ? existingSchedule.anchorAt
                : "",
          isActive: true,
        };
      } else {
        persistedSchedule = {
          id: `sched-${Date.now()}`,
          medicationId,
          kind,
          times: [time || "08:00"],
          intervalHours: kind === "intervalHours" ? (intervalHours || 8) : 0,
          weekdays: kind === "weekdays" ? (weekdays || []) : [],
          startDate: "",
          endDate: "",
          anchorAt: kind === "intervalHours" ? `${getTodayString()}T${time || "08:00"}:00` : "",
          snoozeMinutes: settings.defaultSnoozeMinutes,
          isActive: true,
        };
      }

      await medicationPersistence.updateWithSchedule(updated, persistedSchedule);
      setMedications((prev) => prev.map((m) => (m.id === medicationId ? updated : m)));
      setSchedules(await repos.schedules.getAll());

      startReminderSyncInBackground({
        sync: async () => {
          await reminderScheduler.cancelForMedication(medicationId);
          await scheduleMedicationNotifications(updated, persistedSchedule);
          await reconcileNotifications(
            repos.reminderArtifacts,
            repos.medications,
            repos.schedules,
            repos.settings,
            reminderScheduler
          );
        },
        fallback: () =>
          reconcileNotifications(
            repos.reminderArtifacts,
            repos.medications,
            repos.schedules,
            repos.settings,
            reminderScheduler
          ),
        onPendingChange: setReminderSyncPending,
        pendingCounter: reminderSyncCounterRef.current,
      });
    },
    [medications, schedules, scheduleMedicationNotifications, settings.defaultSnoozeMinutes]
  );

  const updateUserName = useCallback(
    async (name: string) => {
      const validationError = validateProfileName(name);
      if (validationError) throw new Error(validationError);

      const updated = { ...settingsRef.current, userName: name.trim() };
      await repos.settings.update(updated);
      settingsRef.current = updated;
      setSettings(updated);
    },
    []
  );

  const completeOnboarding = useCallback(async (name: string) => {
    const validationError = validateProfileName(name);
    if (validationError) throw new Error(validationError);

    const updated: ReminderSettings = {
      ...settingsRef.current,
      userName: name.trim(),
      onboardingCompleted: true,
      reminderSetupCompleted: true,
    };
    await repos.settings.update(updated);
    settingsRef.current = updated;
    setSettings(updated);
  }, []);

  const updateNotificationsEnabled = useCallback(
    async (enabled: boolean) => {
      const updated = {
        ...settingsRef.current,
        notificationsEnabled: enabled,
      };
      await repos.settings.update(updated);
      settingsRef.current = updated;
      setSettings(updated);
      if (enabled) {
        await rescheduleMedicationNotifications(true, updated);
      } else {
        await reminderScheduler.cancelAll();
      }
    },
    [rescheduleMedicationNotifications]
  );

  const updateReminderSettings = useCallback(
    async (patch: Partial<ReminderSettings>) => {
      const updated = {
        ...settingsRef.current,
        ...patch,
        defaultSnoozeMinutes: 5,
      };
      await repos.settings.update(updated);
      settingsRef.current = updated;
      setSettings(updated);
      if (updated.notificationsEnabled) {
        await rescheduleMedicationNotifications(true, updated);
      }
    },
    [rescheduleMedicationNotifications]
  );

  const runAlarmTest = useCallback(async () => {
    await ensureChannelCreated();
    await reminderScheduler.runAlarmTest({
      criticalAlertsEnabled: settingsRef.current.criticalAlertsEnabled,
      fullScreenAlarmEnabled: settingsRef.current.fullScreenAlarmEnabled,
    });
  }, []);

  return (
    <AppDataContext.Provider
      value={{
        medications,
        schedules,
        doseLogs: logs,
        todayOccurrences: todayData.occurrences,
        todaySummary: todayData.summary,
        loading,
        error,
        retryLoadingData,
        refreshDoseLogs,
        reminderSyncPending,
        settings,
        addMedication,
        removeMedication,
        setDoseTaken,
        skipDose,
        snoozeDose,
        setMedicationPaused,
        updateMedicationWithSchedule,
        updateUserName,
        completeOnboarding,
        updateNotificationsEnabled,
        updateReminderSettings,
        rescheduleMedicationNotifications,
        runAlarmTest,
        doseService: doseSvc,
        snoozeMinutes: settings.defaultSnoozeMinutes,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}
