import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ArrowLeft,
  CalendarClock,
  CircleCheck,
  NotebookPen,
  Pill,
} from "lucide-react-native";
import { AppButton } from "../components/ui/AppButton";
import { AppText } from "../components/ui/AppText";
import { CareAccordionStepCard } from "../components/CareAccordionStepCard";
import { IntervalHoursPicker } from "../components/IntervalHoursPicker";
import { WheelTimePicker } from "../components/WheelTimePicker";
import { IconButton } from "../components/ui/IconButton";
import { Screen } from "../components/ui/Screen";
import { RootStackParamList } from "../navigation/types";
import { useAppData } from "../services/appDataProvider";
import {
  validateMedicationName,
  validateTimeHHMM,
  normalizeMedicationInput,
} from "../utils/validation";
import { ScheduleKind } from "../types/domain";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { spacing } from "../theme/spacing";

type Props = NativeStackScreenProps<RootStackParamList, "EditMedication">;
type Step = 1 | 2 | 3 | 4;

const SCHEDULE_KINDS: { key: ScheduleKind; label: string; hint: string }[] = [
  { key: "dailyTimes", label: "Diário", hint: "Uma dose por dia" },
  { key: "intervalHours", label: "Intervalo", hint: "A cada N horas" },
  { key: "weekdays", label: "Semana", hint: "Dias específicos" },
];

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function EditMedicationScreen({ route, navigation }: Props) {
  const { medicationId } = route.params;
  const { medications, schedules, updateMedicationWithSchedule } = useAppData();

  const medication = medications.find((m) => m.id === medicationId);
  const existingSchedule = schedules.find((s) => s.medicationId === medicationId);

  const [name, setName] = useState(medication?.name ?? "");
  const [dosage, setDosage] = useState(medication?.dosage === "Sem dosagem" ? "" : (medication?.dosage ?? ""));
  const [time, setTime] = useState(existingSchedule?.times[0] ?? "08:00");
  const [notes, setNotes] = useState(medication?.notes ?? "");
  const [scheduleKind, setScheduleKind] = useState<ScheduleKind>(
    (existingSchedule?.kind as ScheduleKind) ?? "dailyTimes"
  );
  const [intervalHours, setIntervalHours] = useState(
    existingSchedule?.intervalHours || 8
  );
  const [weekdays, setWeekdays] = useState<number[]>(
    existingSchedule?.weekdays ?? [1, 2, 3, 4, 5]
  );
  const [error, setError] = useState("");
  const [step, setStep] = useState<Step>(1);

  function toggleWeekday(day: number) {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function validateStep(currentStep: Step): boolean {
    if (currentStep >= 1) {
      const nameError = validateMedicationName(name);
      if (nameError) {
        setError(nameError);
        setStep(1);
        return false;
      }
    }

    if (currentStep >= 2) {
      const timeError = validateTimeHHMM(time);
      if (timeError) {
        setError(
          scheduleKind === "intervalHours"
            ? "Informe o horário inicial no formato 08:00."
            : timeError
        );
        setStep(2);
        return false;
      }

      if (scheduleKind === "intervalHours" && intervalHours < 1) {
        setError("O intervalo deve ser de pelo menos 1 hora.");
        setStep(2);
        return false;
      }

      if (scheduleKind === "weekdays" && weekdays.length === 0) {
        setError("Selecione pelo menos um dia da semana.");
        setStep(2);
        return false;
      }
    }

    setError("");
    return true;
  }

  function handleContinue() {
    if (!validateStep(step)) return;
    if (step < 4) {
      setStep((step + 1) as Step);
      return;
    }
    handleSave();
  }

  async function handleSave() {
    if (!validateStep(4)) return;

    const normalized = normalizeMedicationInput({ name, dosage, notes });

    await updateMedicationWithSchedule(
      medicationId,
      normalized.name,
      normalized.dosage,
      normalized.notes,
      scheduleKind,
      time.trim(),
      intervalHours,
      weekdays
    );

    navigation.goBack();
  }

  function clearError() {
    if (error) setError("");
  }

  if (!medication) {
    return (
      <Screen style={styles.center}>
        <AppText variant="subheading" style={styles.errorText}>
          Medicamento não encontrado.
        </AppText>
      </Screen>
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
              Editar medicamento
            </AppText>
            <AppText muted>Altere os dados do cadastro.</AppText>
          </View>
        </View>

        <CareAccordionStepCard
          step={1}
          title="Medicamento"
          icon={Pill}
          expanded={step === 1}
          onPress={() => setStep(1)}
        >
          <FieldLabel label="Nome do medicamento" />
          <TextInput
            value={name}
            onChangeText={(text) => {
              setName(text);
              clearError();
            }}
            placeholder="Ex.: Losartana"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
          <FieldLabel label="Dosagem" />
          <TextInput
            value={dosage}
            onChangeText={setDosage}
            placeholder="Ex.: 50 mg"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
          {error && step === 1 ? <AppText style={styles.errorText}>{error}</AppText> : null}
        </CareAccordionStepCard>

        <CareAccordionStepCard
          step={2}
          title="Agendamento"
          icon={CalendarClock}
          expanded={step === 2}
          onPress={() => setStep(2)}
        >
          <View style={styles.segmented}>
            {SCHEDULE_KINDS.map((kind) => {
              const active = scheduleKind === kind.key;
              return (
                <AppButton
                  key={kind.key}
                  title={kind.label}
                  variant={active ? "primary" : "ghost"}
                  compact
                  style={styles.segmentButton}
                  onPress={() => setScheduleKind(kind.key)}
                  accessibilityLabel={`Agendamento ${kind.label}`}
                  accessibilityHint={kind.hint}
                />
              );
            })}
          </View>
          <FieldLabel label={scheduleKind === "intervalHours" ? "Horário inicial" : "Horário"} />
          <WheelTimePicker
            value={time}
            onChange={(nextTime) => {
              setTime(nextTime);
              clearError();
            }}
            label={scheduleKind === "intervalHours" ? "Horário inicial" : "Horário"}
          />
          {scheduleKind === "intervalHours" ? (
            <>
              <FieldLabel label="Intervalo em horas" />
              <IntervalHoursPicker
                value={intervalHours}
                onChange={(nextInterval) => {
                  setIntervalHours(nextInterval);
                  clearError();
                }}
              />
            </>
          ) : null}
          {scheduleKind === "weekdays" ? (
            <View style={styles.weekdayRow}>
              {WEEKDAY_LABELS.map((label, index) => {
                const active = weekdays.includes(index);
                return (
                  <AppButton
                    key={label}
                    title={label}
                    variant={active ? "primary" : "ghost"}
                    compact
                    style={styles.weekdayButton}
                    onPress={() => toggleWeekday(index)}
                    accessibilityLabel={`${active ? "Remover" : "Adicionar"} ${label}`}
                  />
                );
              })}
            </View>
          ) : null}
          {error && step === 2 ? <AppText style={styles.errorText}>{error}</AppText> : null}
        </CareAccordionStepCard>

        <CareAccordionStepCard
          step={3}
          title="Notas"
          icon={NotebookPen}
          optional
          expanded={step === 3}
          onPress={() => setStep(3)}
        >
          <FieldLabel label="Notas do cuidador" />
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Ex.: tomar após o café"
            placeholderTextColor={colors.textMuted}
            multiline
            style={[styles.input, styles.notesInput]}
          />
        </CareAccordionStepCard>

        <CareAccordionStepCard
          step={4}
          title="Revisar e salvar"
          icon={CircleCheck}
          expanded={step === 4}
          onPress={() => setStep(4)}
        >
          <SummaryLine label="Medicamento" value={name || "Não informado"} />
          <SummaryLine label="Dosagem" value={dosage || "Sem dosagem"} />
          <SummaryLine label="Horário" value={time || "--:--"} />
          {scheduleKind === "intervalHours" ? (
            <SummaryLine label="Intervalo" value={`A cada ${intervalHours}h`} />
          ) : null}
        </CareAccordionStepCard>

        <AppButton
          title={step === 4 ? "Salvar alterações" : "Continuar"}
          variant="primary"
          onPress={handleContinue}
          accessibilityLabel={step === 4 ? "Salvar alterações" : "Continuar edição"}
        />
      </ScrollView>
    </Screen>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <AppText style={styles.label}>{label}</AppText>;
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryLine}>
      <AppText muted>{label}</AppText>
      <AppText style={styles.summaryValue}>{value}</AppText>
    </View>
  );
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
    fontWeight: "700",
    marginTop: spacing.md,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    marginBottom: spacing.lg,
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  label: {
    fontWeight: "600",
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.white,
    borderColor: "#BFB5A8",
    borderRadius: radii.sm,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  notesInput: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  segmented: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  segmentButton: {
    flexGrow: 1,
    minWidth: 92,
  },
  weekdayRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  weekdayButton: {
    minWidth: 56,
  },
  summaryLine: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingVertical: spacing.md,
  },
  summaryValue: {
    fontWeight: "800",
    marginTop: spacing.xs,
  },
});
