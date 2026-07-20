/// <reference types="node" />

import fs from "fs";
import path from "path";

function projectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("native alarm audio configuration", () => {
  it("declares an exact-alarm foreground service", () => {
    const manifest = projectFile("android/app/src/main/AndroidManifest.xml");

    expect(manifest).toContain('android.permission.FOREGROUND_SERVICE');
    expect(manifest).toContain('android.permission.REORDER_TASKS');
    expect(manifest).toContain(
      'android.permission.FOREGROUND_SERVICE_SYSTEM_EXEMPTED'
    );
    expect(manifest).toContain('android:name=".MedicationAlarmService"');
    expect(manifest).toContain(
      'android:name=".MedicationAlarmActionTaskService"'
    );
    expect(manifest).toContain('android:foregroundServiceType="systemExempted"');
  });

  it("plays a looping alarm through a native MediaPlayer", () => {
    const service = projectFile(
      "android/app/src/main/java/com/remedin/MedicationAlarmService.kt"
    );

    expect(service).toContain("AudioAttributes.USAGE_ALARM");
    expect(service).toContain("isLooping = true");
    expect(service).toContain("startForeground(");
    expect(service).toContain("ALARM_TIMEOUT_MS");
    expect(service).toContain("setFullScreenIntent(");
    expect(service).toContain('"Marcar como tomado"');
    expect(service).toContain('"Adiar 5 min"');
    expect(service).toContain("stopForeground(STOP_FOREGROUND_REMOVE)");
    expect(service).toContain('"RemedinNativeAlarmDelivered"');
    expect(service).toContain("LifecycleState.RESUMED");
    expect(service).toContain("Intent(this, MainActivity::class.java)");
    expect(service).toContain("ACTION_OPEN_ALARM");
    expect(service).toContain("Intent.ACTION_USER_PRESENT");
    expect(service).toContain("registerReceiver(");
    expect(service).toContain("unregisterReceiver(");
    expect(service).toContain("bringActiveAlarmToFront");
    expect(service).toContain("Notification.FOREGROUND_SERVICE_IMMEDIATE");
    expect(service).toContain('Uri.parse("remedin://dose-alarm/');
    expect(service).not.toContain("DoseAlarmActivity");
  });

  it("uses alarm-clock scheduling with an exact idle fallback", () => {
    const scheduler = projectFile(
      "android/app/src/main/java/com/remedin/AlarmAudioScheduler.kt"
    );

    expect(scheduler).toContain("AlarmManager.AlarmClockInfo(");
    expect(scheduler).toContain("alarmManager.setAlarmClock(");
    expect(scheduler).toContain("alarmManager.setExactAndAllowWhileIdle(");
    expect(scheduler).toContain('payload?.getBoolean("fullScreenEnabled", false)');
  });

  it("routes native alarm actions through Headless JS", () => {
    const taskService = projectFile(
      "android/app/src/main/java/com/remedin/MedicationAlarmActionTaskService.kt"
    );
    const entry = projectFile("index.ts");

    expect(taskService).toContain('"RemedinAlarmAction"');
    expect(entry).toContain(
      'AppRegistry.registerHeadlessTask("RemedinAlarmAction"'
    );
    expect(entry).not.toContain('registerComponent("RemedinDoseAlarm"');
  });

  it("reports full-screen access, channel importance and device lock state", () => {
    const permissions = projectFile(
      "android/app/src/main/java/com/remedin/ReminderPermissionsModule.kt"
    );

    expect(permissions).toContain("getAlarmPresentationDiagnostics");
    expect(permissions).toContain("manager.canUseFullScreenIntent()");
    expect(permissions).toContain("getNotificationChannel(channelId)?.importance");
    expect(permissions).toContain("keyguardManager.isKeyguardLocked");
    expect(permissions).toContain("powerManager.isInteractive");
    expect(permissions).toContain("openNativeAlarmChannelSettings");
  });
});
