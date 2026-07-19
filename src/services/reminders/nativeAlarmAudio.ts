import { NativeModules, Platform } from "react-native";

type NativeAlarmAudioModule = {
  scheduleAlarmAudio: (
    alarmId: string,
    triggerAtMillis: number,
    timeoutMillis: number
  ) => Promise<boolean>;
  cancelAlarmAudio: (alarmId: string) => Promise<void>;
  cancelAllAlarmAudio: () => Promise<void>;
};

export type AlarmAudioController = {
  available: boolean;
  schedule: (
    alarmId: string,
    triggerAtMillis: number,
    timeoutMillis: number
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
    schedule: async (alarmId, triggerAtMillis, timeoutMillis) =>
      available
        ? nativeModule.scheduleAlarmAudio(
            alarmId,
            triggerAtMillis,
            timeoutMillis
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
