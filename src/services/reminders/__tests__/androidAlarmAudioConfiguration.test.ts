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
    expect(manifest).toContain(
      'android.permission.FOREGROUND_SERVICE_SYSTEM_EXEMPTED'
    );
    expect(manifest).toContain('android:name=".MedicationAlarmService"');
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
  });
});
