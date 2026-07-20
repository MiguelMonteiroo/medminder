/// <reference types="node" />

import fs from "fs";
import path from "path";

function projectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("main application alarm integration", () => {
  it("renders a cold-start alarm before application providers", () => {
    const app = projectFile("App.tsx");

    expect(app).toContain("initialAlarmPayload?: DoseAlarmPayload");
    expect(app.indexOf("if (launchAlarm)")).toBeLessThan(
      app.indexOf("<DatabaseProvider>")
    );
    expect(app).toContain("<DoseAlarmScreen");
  });

  it("recovers pending alarms and returns to Home when they stop", () => {
    const bridge = projectFile(
      "src/components/reminders/NotificationEventBridge.tsx"
    );
    const navigation = projectFile("src/navigation/navigationRef.ts");

    expect(bridge).toContain("consumePendingAlarmPayload");
    expect(bridge).toContain('"RemedinNativeAlarmStopped"');
    expect(bridge).toContain("finishActiveAlarm(alarmId)");
    expect(bridge).toContain("resetToHome()");
    expect(navigation).toContain("navigationRef.resetRoot");
    expect(navigation).toContain('routes: [{ name: "Home" }]');
    expect(navigation).toContain("setTimeout(() => resetToHome(), 0)");
  });
});
