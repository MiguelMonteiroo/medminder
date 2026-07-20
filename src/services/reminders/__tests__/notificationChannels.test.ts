import notifee, {
  AndroidImportance,
  AndroidVisibility,
} from "@notifee/react-native";
import { Platform } from "react-native";

jest.mock("../nativeReminderPermissions", () => ({
  reminderPermissionsNative: {
    ensureAlarmChannels: jest.fn(async () => undefined),
  },
}));

import { ensureReminderChannelsCreated } from "../notificationChannels";

describe("reminder notification channels", () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    (Platform as { OS: string }).OS = "android";
  });

  afterAll(() => {
    (Platform as { OS: string }).OS = originalPlatform;
  });

  it("replaces old pre-alert channels with a silent lock-screen-visible channel", async () => {
    (notifee.getTriggerNotifications as jest.Mock).mockResolvedValue([
      {
        notification: {
          id: "scheduled-v1",
          android: { channelId: "medication-pre-alerts-v1" },
        },
      },
      {
        notification: {
          id: "scheduled-v2",
          android: { channelId: "medication-pre-alerts-v2" },
        },
      },
      {
        notification: {
          id: "scheduled-v3",
          android: { channelId: "medication-pre-alerts-v3" },
        },
      },
    ]);
    (notifee.getDisplayedNotifications as jest.Mock).mockResolvedValue([
      {
        notification: {
          id: "displayed-v1",
          android: { channelId: "medication-pre-alerts-v1" },
        },
      },
    ]);

    await ensureReminderChannelsCreated();

    expect(notifee.cancelNotification).toHaveBeenCalledWith("scheduled-v1");
    expect(notifee.cancelNotification).toHaveBeenCalledWith("scheduled-v2");
    expect(notifee.cancelNotification).toHaveBeenCalledWith("scheduled-v3");
    expect(notifee.cancelNotification).toHaveBeenCalledWith("displayed-v1");
    expect(notifee.deleteChannel).toHaveBeenCalledWith(
      "medication-pre-alerts-v1"
    );
    expect(notifee.deleteChannel).toHaveBeenCalledWith(
      "medication-pre-alerts-v2"
    );
    expect(notifee.deleteChannel).toHaveBeenCalledWith(
      "medication-pre-alerts-v3"
    );
    const preAlertChannel = (notifee.createChannel as jest.Mock).mock.calls
      .map(([channel]) => channel)
      .find((channel) => channel.id === "medication-pre-alerts-v4");
    expect(preAlertChannel).toEqual(
      expect.objectContaining({
        importance: AndroidImportance.DEFAULT,
        vibration: false,
        visibility: AndroidVisibility.PUBLIC,
      })
    );
    expect(preAlertChannel).not.toHaveProperty("sound");
  });
});
