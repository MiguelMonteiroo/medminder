import { loadInitialAlarmPayload } from "../alarmPayloadLoader";

const initialNotification = {
  notification: {
    id: "alarm-test-1",
    title: "Teste de alarme",
    body: "Som, vibracao e tela cheia estao sendo testados.",
    data: {
      artifactKind: "alarmTest",
      payloadVersion: "1",
    },
  },
};

describe("alarmPayloadLoader", () => {
  it("ignores a pre-alert used to open the application", async () => {
    const readInitialNotification = jest.fn().mockResolvedValue({
      notification: {
        id: "pre-alert-1",
        title: "Medicamento em 5 minutos",
        body: "Abra o Remedin para ver os detalhes.",
        data: { artifactKind: "preAlert" },
      },
    });

    const payload = await loadInitialAlarmPayload({
      attempts: 1,
      readInitialNotification,
    });

    expect(payload).toBeNull();
  });

  it("ignores a pre-alert received through native launch props", async () => {
    const readInitialNotification = jest.fn().mockResolvedValue(null);

    const payload = await loadInitialAlarmPayload({
      attempts: 1,
      launchPayload: {
        notificationId: "pre-alert-native-1",
        title: "Medicamento em 5 minutos",
        body: "Abra o Remedin para ver os detalhes.",
        data: { artifactKind: "preAlert" },
      },
      readInitialNotification,
    });

    expect(payload).toBeNull();
    expect(readInitialNotification).toHaveBeenCalledTimes(1);
  });

  it("recovers when the alarm Activity is not ready on the first read", async () => {
    const readInitialNotification = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(initialNotification);
    const wait = jest.fn().mockResolvedValue(undefined);

    const payload = await loadInitialAlarmPayload({
      attempts: 3,
      readInitialNotification,
      wait,
    });

    expect(payload).toEqual({
      notificationId: "alarm-test-1",
      title: "Teste de alarme",
      body: "Som, vibracao e tela cheia estao sendo testados.",
      data: {
        artifactKind: "alarmTest",
        payloadVersion: "1",
      },
    });
    expect(readInitialNotification).toHaveBeenCalledTimes(2);
    expect(wait).toHaveBeenCalledTimes(1);
  });

  it("uses launch props without consulting the Activity lifecycle", async () => {
    const launchPayload = {
      notificationId: "native-1",
      title: "Losartana",
      body: "50 mg",
      data: { artifactKind: "doseAlarm" },
    };
    const readInitialNotification = jest.fn();

    const payload = await loadInitialAlarmPayload({
      launchPayload,
      readInitialNotification,
    });

    expect(payload).toEqual(launchPayload);
    expect(readInitialNotification).not.toHaveBeenCalled();
  });

  it("returns null after the bounded recovery window", async () => {
    const readInitialNotification = jest.fn().mockResolvedValue(null);
    const wait = jest.fn().mockResolvedValue(undefined);

    const payload = await loadInitialAlarmPayload({
      attempts: 3,
      readInitialNotification,
      wait,
    });

    expect(payload).toBeNull();
    expect(readInitialNotification).toHaveBeenCalledTimes(3);
    expect(wait).toHaveBeenCalledTimes(2);
  });

  it("recovers from the displayed alarm when a custom Activity has no extras", async () => {
    const readInitialNotification = jest.fn().mockResolvedValue(null);
    const readDisplayedNotifications = jest.fn().mockResolvedValue([
      {
        id: "unrelated",
        date: "2026-07-19T08:00:00.000Z",
        notification: {
          title: "Outro aviso",
          data: { artifactKind: "preAlert" },
        },
      },
      {
        id: "alarm-test-2",
        date: "2026-07-19T08:01:00.000Z",
        notification: {
          title: "Teste de alarme",
          body: "Som e tela cheia em teste.",
          data: { artifactKind: "alarmTest", payloadVersion: "1" },
        },
      },
    ]);

    const payload = await loadInitialAlarmPayload({
      readInitialNotification,
      readDisplayedNotifications,
    });

    expect(payload).toEqual({
      notificationId: "alarm-test-2",
      title: "Teste de alarme",
      body: "Som e tela cheia em teste.",
      data: { artifactKind: "alarmTest", payloadVersion: "1" },
    });
    expect(readInitialNotification).toHaveBeenCalledTimes(1);
    expect(readDisplayedNotifications).toHaveBeenCalledTimes(1);
  });
});
