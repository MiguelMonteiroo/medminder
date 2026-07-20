import { NativeModules, Platform } from "react-native";

export type NativeAlarmPayload = {
  alarmId: string;
  artifactKind: "doseAlarm" | "snoozedAlarm" | "alarmTest";
  title: string;
  body: string;
  doseOccurrenceId: string;
  medicationId: string;
  scheduleId: string;
  scheduledAt: string;
  doseWindowKey: string;
  showDetails: boolean;
  fullScreenEnabled: boolean;
  criticalAlertsEnabled: boolean;
};

type NativeAlarmAudioModule = {
  scheduleAlarmAudio: (
    alarmId: string,
    triggerAtMillis: number,
    timeoutMillis: number,
    payload: NativeAlarmPayload
  ) => Promise<boolean>;
  cancelAlarmAudio: (alarmId: string) => Promise<void>;
  cancelAllAlarmAudio: () => Promise<void>;
};

export type AlarmAudioController = {
  available: boolean;
  schedule: (
    alarmId: string,
    triggerAtMillis: number,
    timeoutMillis: number,
    payload: NativeAlarmPayload
  ) => Promise<boolean>;
  cancel: (alarmId: string) => Promise<void>;
  cancelAll: () => Promise<void>;
};

export function createAlarmAudioController(
  nativeModule: NativeAlarmAudioModule | undefined,
  isAndroid = Platform.OS === "android"
): AlarmAudioController {
  const available = isAndroid && nativeModule !== undefined;
  return {
    available,
    schedule: async (alarmId, triggerAtMillis, timeoutMillis, payload) =>
      available
        ? nativeModule.scheduleAlarmAudio(
            alarmId,
            triggerAtMillis,
            timeoutMillis,
            payload
          )
        : false,
    cancel: async (alarmId) => {
      if (available) await nativeModule.cancelAlarmAudio(alarmId);
    },
    cancelAll: async () => {
      if (available) await nativeModule.cancelAllAlarmAudio();
    },
  };
}

export const nativeAlarmAudio = createAlarmAudioController(
  NativeModules.AlarmAudio as NativeAlarmAudioModule | undefined
);
