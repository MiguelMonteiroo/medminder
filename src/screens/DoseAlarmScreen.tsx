import { useEffect, useMemo, useState } from "react";
import {
  BackHandler,
  NativeModules,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import notifee from "@notifee/react-native";
import { BellRing, CheckCircle2, Clock3, Volume2 } from "lucide-react-native";
import { AppText } from "../components/ui/AppText";
import { createRepositories } from "../database/db";
import { openAppDatabase } from "../database/openAppDatabase";
import { executeDefaultNotificationCommand } from "../services/reminders/notificationEventHandler";
import {
  loadInitialAlarmPayload,
  type DoseAlarmPayload,
} from "../services/reminders/alarmPayloadLoader";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { spacing } from "../theme/spacing";
import type { NotificationActionId } from "../types/domain";

const SYSTEM_NOTIFICATION_CLEARANCE = (StatusBar.currentHeight ?? 24) + 96;

type Props = {
  payload?: DoseAlarmPayload | null;
  embedded?: boolean;
  onClose?: () => void;
  onDoseAction?: () => Promise<void> | void;
};

async function closeAlarmActivity(): Promise<void> {
  const module = NativeModules.ReminderPermissions as
    | { finishDoseAlarmActivity?: () => Promise<void> }
    | undefined;
  if (module?.finishDoseAlarmActivity) {
    await module.finishDoseAlarmActivity();
    return;
  }
  BackHandler.exitApp();
}

function formatAlarmTime(scheduledAt: string): string {
  const date = new Date(scheduledAt);
  if (!Number.isFinite(date.getTime())) return "Agora";
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

async function expandDoseWindow(
  payload: DoseAlarmPayload
): Promise<DoseAlarmPayload[]> {
  const windowKey = String(payload.data.doseWindowKey || "");
  if (!windowKey || payload.data.artifactKind === "alarmTest") return [payload];

  const database = await openAppDatabase();
  const repositories = createRepositories(database);
  const [artifacts, settings] = await Promise.all([
    repositories.reminderArtifacts.getByWindowKey(windowKey),
    repositories.settings.get(),
  ]);
  const alarmArtifacts = artifacts.filter(
    (artifact) =>
      artifact.kind === "doseAlarm" || artifact.kind === "snoozedAlarm"
  );
  const uniqueArtifacts = Array.from(
    new Map(
      alarmArtifacts.map((artifact) => [artifact.doseOccurrenceId, artifact])
    ).values()
  );
  if (uniqueArtifacts.length === 0) return [payload];

  const expanded: Array<DoseAlarmPayload | null> = await Promise.all(
    uniqueArtifacts.map(async (artifact) => {
      const medication = await repositories.medications.getById(
        artifact.medicationId
      );
      if (!medication) return null;
      const showDetails = settings.showLockScreenDetails;
      return {
        notificationId: artifact.notificationId,
        title: showDetails ? medication.name : "Hora do medicamento",
        body: showDetails
          ? [
              medication.dosage === "Sem dosagem" ? "" : medication.dosage,
              medication.notes,
            ]
              .filter(Boolean)
              .join(" · ")
          : "Desbloqueie o aparelho para ver os detalhes.",
        data: {
          payloadVersion: "1",
          artifactKind: artifact.kind,
          doseOccurrenceId: artifact.doseOccurrenceId,
          medicationId: artifact.medicationId,
          scheduleId: artifact.scheduleId,
          doseWindowKey: artifact.doseWindowKey,
          scheduledAt: `${artifact.doseWindowKey}:00`,
          showDetails: String(showDetails),
        },
      } satisfies DoseAlarmPayload;
    })
  );

  return expanded.filter((item): item is DoseAlarmPayload => item !== null);
}

export function DoseAlarmScreen({
  payload: initialPayload,
  embedded,
  onClose,
  onDoseAction,
}: Props) {
  const [payloads, setPayloads] = useState<DoseAlarmPayload[]>(
    initialPayload ? [initialPayload] : []
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoadFailed(false);

    loadInitialAlarmPayload({
      launchPayload: initialPayload,
      readInitialNotification: () => notifee.getInitialNotification(),
      readDisplayedNotifications: () => notifee.getDisplayedNotifications(),
    })
      .then(async (nextPayload) => {
        if (cancelled) return;
        if (!nextPayload) {
          setLoadFailed(true);
          return;
        }

        try {
          const expanded = await expandDoseWindow(nextPayload);
          if (!cancelled) setPayloads(expanded);
        } catch {
          if (!cancelled) setPayloads([nextPayload]);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [initialPayload, loadAttempt]);

  const primaryPayload = payloads[0];
  const isTest = primaryPayload?.data.artifactKind === "alarmTest";

  useEffect(() => {
    const timer = setTimeout(() => {
      if (embedded) onClose?.();
      else closeAlarmActivity();
    }, isTest ? 10_000 : 60_000);
    return () => clearTimeout(timer);
  }, [embedded, isTest, onClose]);

  const time = useMemo(
    () => formatAlarmTime(String(primaryPayload?.data.scheduledAt || "")),
    [primaryPayload]
  );

  async function runAction(
    payload: DoseAlarmPayload,
    actionId: NotificationActionId
  ) {
    if (busyId) return;
    setBusyId(payload.notificationId);
    try {
      await executeDefaultNotificationCommand({
        actionId,
        commandId: `${payload.notificationId}:${actionId}`,
        doseOccurrenceId: String(payload.data.doseOccurrenceId || ""),
        medicationId: String(payload.data.medicationId || ""),
        scheduleId: String(payload.data.scheduleId || ""),
        scheduledAt: String(payload.data.scheduledAt || ""),
        notificationId: payload.notificationId,
      });
      const remaining = payloads.filter(
        (item) => item.notificationId !== payload.notificationId
      );
      setPayloads(remaining);
      if (remaining.length === 0) {
        onClose?.();
        if (!embedded) await closeAlarmActivity();
      }
    } finally {
      await Promise.resolve(onDoseAction?.()).catch(() => undefined);
      setBusyId(null);
    }
  }

  if (!primaryPayload) {
    return (
      <View style={styles.screen}>
        <View style={styles.loadingState}>
          <BellRing color={colors.primary} size={42} />
          <AppText variant="heading" style={styles.loadingText}>
            {loadFailed
              ? "Não foi possível abrir o alarme"
              : "Preparando alarme..."}
          </AppText>
          {loadFailed ? (
            <>
              <AppText muted style={styles.loadingDescription}>
                O Android não entregou os dados do lembrete. Tente novamente ou feche este alarme.
              </AppText>
              <Pressable
                accessibilityLabel="Tentar preparar o alarme novamente"
                accessibilityRole="button"
                onPress={() => setLoadAttempt((current) => current + 1)}
                style={({ pressed }) => [
                  styles.primaryButton,
                  styles.recoveryButton,
                  pressed && styles.pressed,
                ]}
              >
                <AppText style={styles.primaryButtonText}>
                  Tentar novamente
                </AppText>
              </Pressable>
              <Pressable
                accessibilityLabel="Fechar alarme"
                accessibilityRole="button"
                onPress={closeAlarmActivity}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  styles.recoveryButton,
                  pressed && styles.pressed,
                ]}
              >
                <AppText style={styles.secondaryButtonText}>Fechar</AppText>
              </Pressable>
            </>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen} accessibilityViewIsModal>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <BellRing color={colors.primaryDark} size={28} />
          </View>
          <AppText variant="heading" style={styles.brand}>
            Remedin
          </AppText>
        </View>

        <AppText
          weight="bold"
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.2}
          numberOfLines={1}
          style={styles.time}
        >
          {isTest ? "Teste" : time}
        </AppText>
        <AppText variant="title" style={styles.title}>
          {isTest ? "Teste de alarme" : "Hora dos medicamentos"}
        </AppText>
        <AppText muted style={styles.subtitle}>
          {isTest
            ? "Confira o som, a vibração e a tela."
            : `${payloads.length} ${
                payloads.length === 1 ? "dose agendada" : "doses agendadas"
              } agora`}
        </AppText>

        {payloads.map((payload) => {
          const canMarkTaken = payload.data.showDetails !== "false";
          const busy = busyId === payload.notificationId;
          return (
            <View key={payload.notificationId} style={styles.doseCard}>
              <AppText variant="heading" style={styles.medicationName}>
                {payload.title}
              </AppText>
              {payload.body ? (
                <AppText muted numberOfLines={2} style={styles.notes}>
                  {payload.body}
                </AppText>
              ) : null}

              {isTest ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Encerrar teste de alarme"
                  disabled={busy}
                  onPress={() => runAction(payload, "end-alarm-test")}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Volume2 color={colors.white} size={22} />
                  <AppText weight="bold" style={styles.primaryButtonText}>Encerrar teste</AppText>
                </Pressable>
              ) : (
                <>
                  {canMarkTaken ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Marcar ${payload.title} como tomado`}
                      disabled={busy}
                      onPress={() => runAction(payload, "mark-taken")}
                      style={({ pressed }) => [
                        styles.primaryButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <CheckCircle2 color={colors.white} size={23} />
                      <AppText weight="bold" style={styles.primaryButtonText}>
                        Marcar como tomado
                      </AppText>
                    </Pressable>
                  ) : (
                    <View style={styles.privateNotice}>
                      <AppText muted>
                        Desbloqueie o aparelho e abra o Remedin para registrar a dose.
                      </AppText>
                    </View>
                  )}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Adiar ${payload.title} por cinco minutos`}
                    disabled={busy}
                    onPress={() => runAction(payload, "snooze-five")}
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Clock3 color={colors.accent} size={23} />
                    <AppText weight="bold" style={styles.secondaryButtonText}>Adiar 5 min</AppText>
                  </Pressable>
                </>
              )}
            </View>
          );
        })}

        <View style={styles.activeRow}>
          <Volume2 color={colors.primary} size={20} />
          <AppText weight="semibold" style={styles.activeText}>Alarme ativo</AppText>
        </View>
      </ScrollView>
    </View>
  );
}

export function DoseAlarmRoot({ payload }: { payload?: DoseAlarmPayload }) {
  return <DoseAlarmScreen payload={payload} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: SYSTEM_NOTIFICATION_CLEARANCE,
  },
  brandRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  brandIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  brand: { color: colors.primaryDark },
  time: {
    color: colors.primaryDark,
    fontSize: 72,
    includeFontPadding: true,
    lineHeight: 88,
    marginTop: spacing.xxl,
    minHeight: 88,
    textAlign: "center",
    textAlignVertical: "center",
  },
  title: { color: colors.primaryDark, marginTop: spacing.md, textAlign: "center" },
  subtitle: { marginTop: spacing.sm, textAlign: "center" },
  doseCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  medicationName: { color: colors.text },
  notes: { marginTop: spacing.xs },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    borderRadius: radii.md,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    marginTop: spacing.lg,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  primaryButtonText: { color: colors.white },
  secondaryButton: {
    alignItems: "center",
    borderColor: colors.accent,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    marginTop: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  secondaryButtonText: { color: colors.accent },
  privateNotice: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  pressed: { opacity: 0.75 },
  activeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  activeText: { color: colors.primary },
  loadingState: { alignItems: "center", alignSelf: "stretch" },
  loadingText: { color: colors.primaryDark, marginTop: spacing.md },
  loadingDescription: {
    marginTop: spacing.sm,
    maxWidth: 320,
    paddingHorizontal: spacing.lg,
    textAlign: "center",
  },
  recoveryButton: { alignSelf: "stretch", marginHorizontal: spacing.xl },
});
