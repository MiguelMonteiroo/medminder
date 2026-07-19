/// <reference types="node" />

import fs from "fs";
import path from "path";

function projectFile(relativePath: string): string {
  return fs
    .readFileSync(path.resolve(process.cwd(), relativePath), "utf8")
    .replace(/\r\n/g, "\n");
}

describe("DoseAlarmActivity lock-screen configuration", () => {
  it("configures the alarm window at manifest and runtime levels", () => {
    const manifest = projectFile("android/app/src/main/AndroidManifest.xml");
    const activity = projectFile(
      "android/app/src/main/java/com/medminder/DoseAlarmActivity.kt"
    );

    expect(manifest).toContain('android:showWhenLocked="true"');
    expect(manifest).toContain('android:turnScreenOn="true"');
    expect(activity).toContain("FLAG_SHOW_WHEN_LOCKED");
    expect(activity).toContain("FLAG_TURN_SCREEN_ON");
    expect(activity).toContain(
      'override fun getMainComponentName(): String = "MedMinderDoseAlarm"'
    );
    expect(activity).not.toContain("NotifeeApiModule.getMainComponent");
  });

  it("does not recreate ReactActivity while handling a notification tap", () => {
    const activity = projectFile(
      "android/app/src/main/java/com/medminder/DoseAlarmActivity.kt"
    );

    expect(activity).not.toContain("recreate()\n");
  });

  it("only hides system bars after ReactActivity creates its decor view", () => {
    const activity = projectFile(
      "android/app/src/main/java/com/medminder/DoseAlarmActivity.kt"
    );

    expect(activity).not.toContain(
      "volumeControlStream = AudioManager.STREAM_ALARM\n    hideSystemBars()"
    );
    expect(activity).toContain(
      "super.onCreate(savedInstanceState)\n    configureWindowForAlarm()\n    hideSystemBars()"
    );
  });
});
