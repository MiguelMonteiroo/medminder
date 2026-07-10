import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft, CalendarDays, CheckCircle2, FileText } from "lucide-react-native";
import { AppCard } from "../components/ui/AppCard";
import { AppText } from "../components/ui/AppText";
import { CareBottomActionBar } from "../components/CareBottomActionBar";
import { CareDetailHeroCard } from "../components/CareDetailHeroCard";
import { IconButton } from "../components/ui/IconButton";
import { Screen } from "../components/ui/Screen";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useDatabase } from "../database/DatabaseProvider";
import { createDoseLogRepository } from "../database/repositories/doseLogRepository";
import { RootStackParamList } from "../navigation/types";
import { useAppData } from "../services/appDataProvider";
import { DoseLog } from "../types/domain";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

type Props = NativeStackScreenProps<RootStackParamList, "MedicationDetail">;

export function MedicationDetailScreen({ route, navigation }: Props) {
  const { medicationId } = route.params;
  const { medications, schedules, removeMedication, setMedicationPaused } =
    useAppData();
  const db = useDatabase();
  const [logs, setLogs] = useState<DoseLog[]>([]);

  const medication = medications.find((m) => m.id === medicationId);
  const medSchedules = schedules.filter((s) => s.medicationId === medicationId);

  useEffect(() => {
    async function loadLogs() {
      const repo = createDoseLogRepository(db);
      const allLogs = await repo.getAll();
      setLogs(allLogs.filter((log) => log.medicationId === medicationId).slice(0, 3));
    }
    loadLogs();
  }, [db, medicationId]);

  if (!medication) {
    return (
      <Screen style={styles.center}>
        <AppText variant="subheading" style={styles.errorText}>
          Medicamento não encontrado.
        </AppText>
      </Screen>
    );
  }

  const firstSchedule = medSchedules[0];
  const paused = medication.isPaused;
  const medicationName = medication.name;

  async function handleTogglePause() {
    await setMedicationPaused(medicationId, !paused);
  }

  function handleEdit() {
    navigation.navigate("EditMedication", { medicationId });
  }

  function handleDelete() {
    Alert.alert(
      "Remover medicamento",
      `Tem certeza que deseja remover ${medicationName}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            await removeMedication(medicationId);
            navigation.goBack();
          },
        },
      ]
    );
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <IconButton
            icon={ArrowLeft}
            label="Voltar"
            onPress={() => navigation.goBack()}
          />
          <View style={styles.headerText}>
            <AppText variant="title" style={styles.title}>
              Detalhes
            </AppText>
          </View>
        </View>

        <CareDetailHeroCard
          name={medication.name}
          dosage={medication.dosage}
          paused={paused}
          onEdit={handleEdit}
        />

        <InfoCard
          icon={<CalendarDays color={colors.primary} size={22} />}
          title="Agendamento"
          action="Lembretes ativos"
        >
          {firstSchedule ? (
            <>
              <InfoRow label="Frequência" value={scheduleLabel(firstSchedule.kind)} />
              <InfoRow label="Horário" value={firstSchedule.times.join(", ")} strong />
              <InfoRow label="Dose" value={medication.dosage} />
            </>
          ) : (
            <AppText muted>Nenhum agendamento ativo.</AppText>
          )}
        </InfoCard>

        <InfoCard
          icon={<FileText color={colors.info} size={22} />}
          title="Notas do cuidador"
        >
          <AppText>
            {medication.notes ||
              "Adicione observações sobre como este medicamento deve ser tomado."}
          </AppText>
        </InfoCard>

        <InfoCard
          icon={<CheckCircle2 color={colors.success} size={22} />}
          title="Histórico recente"
        >
          {logs.length === 0 ? (
            <AppText muted>Nenhum registro recente.</AppText>
          ) : (
            logs.map((log) => (
              <View key={log.id} style={styles.logRow}>
                <AppText>{formatDate(log.actionAt)}</AppText>
                <AppText>{log.actionAt.substring(11, 16)}</AppText>
                <StatusBadge status={actionToStatus(log.action)} />
              </View>
            ))
          )}
        </InfoCard>

        <CareBottomActionBar
          paused={paused}
          onTogglePause={handleTogglePause}
          onDelete={handleDelete}
        />
      </ScrollView>
    </Screen>
  );
}

function InfoCard({
  icon,
  title,
  action,
  children,
}: {
  icon: ReactNode;
  title: string;
  action?: string;
  children: ReactNode;
}) {
  return (
    <AppCard style={styles.card}>
      <View style={styles.cardHeader}>
        {icon}
        <AppText variant="subheading" style={styles.cardTitle}>
          {title}
        </AppText>
        {action ? (
          <AppText variant="small" style={styles.cardAction}>
            {action}
          </AppText>
        ) : null}
      </View>
      {children}
    </AppCard>
  );
}

function InfoRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <AppText muted>{label}</AppText>
      <AppText style={[styles.infoValue, strong && styles.strongValue]}>{value}</AppText>
    </View>
  );
}

function scheduleLabel(kind: string) {
  if (kind === "dailyTimes") return "Todos os dias";
  if (kind === "intervalHours") return "Por intervalo";
  return "Dias selecionados";
}

function actionToStatus(action: DoseLog["action"]) {
  if (action === "taken") return "taken";
  if (action === "skipped") return "skipped";
  if (action === "snoozed") return "snoozed";
  return "pending";
}

function formatDate(value: string) {
  const [year, month, day] = value.substring(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  errorText: {
    color: colors.danger,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.md,
  },
  title: {
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
  },
  cardTitle: {
    flex: 1,
  },
  cardAction: {
    color: colors.primaryDark,
    fontWeight: "800",
  },
  infoRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  infoValue: {
    fontWeight: "700",
    maxWidth: "58%",
    textAlign: "right",
  },
  strongValue: {
    color: colors.primaryDark,
    fontSize: 20,
  },
  logRow: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
});
