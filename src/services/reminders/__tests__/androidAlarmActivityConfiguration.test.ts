/// <reference types="node" />

import fs from "fs";
import path from "path";

function projectFile(relativePath: string): string {
  return fs
    .readFileSync(path.resolve(process.cwd(), relativePath), "utf8")
    .replace(/\r\n/g, "\n");
}

describe("MainActivity alarm mode configuration", () => {
  it("keeps lock-screen behavior dynamic and uses the main React component", () => {
    const manifest = projectFile("android/app/src/main/AndroidManifest.xml");
    const activity = projectFile(
      "android/app/src/main/java/com/remedin/MainActivity.kt"
    );

    expect(manifest).not.toContain('android:name=".DoseAlarmActivity"');
    expect(manifest).not.toContain('android:showWhenLocked="true"');
    expect(manifest).not.toContain('android:turnScreenOn="true"');
    expect(activity).toContain("FLAG_SHOW_WHEN_LOCKED");
    expect(activity).toContain("FLAG_TURN_SCREEN_ON");
    expect(activity).toContain(
      'NotifeeApiModule.getMainComponent("Remedin")'
    );
    expect(activity).toContain("clearAlarmWindowMode");
  });

  it("delivers cold-start and subsequent alarm payloads without recreating React", () => {
    const activity = projectFile(
      "android/app/src/main/java/com/remedin/MainActivity.kt"
    );

    expect(activity).not.toContain("recreate()\n");
    expect(activity).toContain("override fun onNewIntent(nextIntent: Intent)");
    expect(activity).toContain('"initialAlarmPayload"');
    expect(activity).toContain('"RemedinNativeAlarmDelivered"');
    expect(activity).toContain("consumePendingAlarmPayload");
    expect(activity).toContain("isAlarmPayload(payload)");
  });

  it("clears lock-screen flags when alarm mode ends", () => {
    const activity = projectFile(
      "android/app/src/main/java/com/remedin/MainActivity.kt"
    );

    expect(activity).toContain("window.clearFlags(");
    expect(activity).toContain("setShowWhenLocked(false)");
    expect(activity).toContain("showSystemBars()");
    expect(activity).toContain("clearAlarmIntent()");
    expect(activity).toContain("removeExtra(EXTRA_ALARM_MODE)");
    expect(activity).toContain(
      "removeExtra(MedicationAlarmService.NOTIFICATION_EXTRA)"
    );
  });
});
