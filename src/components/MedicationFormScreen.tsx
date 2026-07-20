import { useEffect, useRef, useState } from "react";
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { ArrowLeft, CalendarClock, CircleCheck, NotebookPen, Pill } from "lucide-react-native";
import { AppButton } from "./ui/AppButton";
import { AppText } from "./ui/AppText";
import { IconButton } from "./ui/IconButton";
import { Screen } from "./ui/Screen";
import { IntervalHoursPicker } from "./IntervalHoursPicker";
import { MedicationFormActionBar } from "./MedicationFormActionBar";
import { MedicationFormStep } from "./MedicationFormStep";
import { WheelTimePicker } from "./WheelTimePicker";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { spacing } from "../theme/spacing";
import { fontFamilies } from "../theme/typography";
import type { ScheduleKind } from "../types/domain";
import { normalizeMedicationInput, validateMedicationName, validateTimeHHMM } from "../utils/validation";
import { ptBR } from "../i18n/ptBR";

export type MedicationFormValues = {
  name: string;
  dosage: string;
  time: string;
  notes: string;
  scheduleKind: ScheduleKind;
  intervalHours: number;
  weekdays: number[];
};

type Props = {
  mode: "add" | "edit";
  initialValues: MedicationFormValues;
  onBack: () => void;
  onSubmit: (values: MedicationFormValues) => Promise<void>;
};

type Step = 1 | 2 | 3 | 4;

const SCHEDULE_KINDS: { key: ScheduleKind; label: string; hint: string }[] = [
  { key: "dailyTimes", label: "Diário", hint: "Uma dose por dia" },
  { key: "intervalHours", label: "Intervalo", hint: "A cada número de horas" },
  { key: "weekdays", label: "Semana", hint: "Em dias específicos" },
];
const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function MedicationFormScreen({ mode, initialValues, onBack, onSubmit }: Props) {
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState("");
  const [step, setStep] = useState<Step>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const submissionInFlightRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const nameInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () =>
      submissionInFlightRef.current
    );
    return () => subscription.remove();
  }, []);

  function update<K extends keyof MedicationFormValues>(key: K, value: MedicationFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    if (error) setError("");
    if (submitError) setSubmitError("");
  }

  function goToStep(nextStep: Step) {
    if (!submissionInFlightRef.current) setStep(nextStep);
  }

  function toggleWeekday(day: number) {
    update(
      "weekdays",
      values.weekdays.includes(day)
        ? values.weekdays.filter((item) => item !== day)
        : [...values.weekdays, day]
    );
  }

  function validateStep(currentStep: Step) {
    if (currentStep >= 1) {
      const nameError = validateMedicationName(values.name);
      if (nameError) {
        setError(nameError);
        setStep(1);
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({ y: 0, animated: true });
          nameInputRef.current?.focus();
        });
        return false;
      }
    }
    if (currentStep >= 2) {
      const timeError = validateTimeHHMM(values.time);
      if (timeError) {
        setError(timeError);
        setStep(2);
        return false;
      }
      if (values.scheduleKind === "intervalHours" && values.intervalHours < 1) {
        setError(ptBR.form.minimumIntervalError);
        setStep(2);
        return false;
      }
      if (values.scheduleKind === "weekdays" && values.weekdays.length === 0) {
        setError(ptBR.form.weekdayRequiredError);
        setStep(2);
        return false;
      }
    }
    setError("");
    return true;
  }

  async function handleContinue() {
    if (submissionInFlightRef.current || isSaving || !validateStep(step)) return;
    if (step < 4) {
      setStep((step + 1) as Step);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    const normalized = normalizeMedicationInput(values);
    submissionInFlightRef.current = true;
    setIsSaving(true);
    setSubmitError("");
    try {
      await onSubmit({ ...values, ...normalized, time: values.time.trim() });
    } catch {
      setSubmitError(ptBR.form.saveError);
    } finally {
      submissionInFlightRef.current = false;
      setIsSaving(false);
    }
  }

  const title = mode === "add" ? ptBR.form.addTitle : ptBR.form.editTitle;

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardArea}>
        <View style={styles.header}>
          <IconButton
            disabled={isSaving}
            icon={ArrowLeft}
            label={ptBR.actions.back}
            onPress={() => {
              if (!submissionInFlightRef.current) onBack();
            }}
          />
          <View style={styles.headerText}>
            <AppText variant="title" style={styles.title}>{title}</AppText>
            <AppText muted>{ptBR.form.subtitle}</AppText>
          </View>
        </View>

        <View accessibilityLabel={`Etapa ${step} de 4`} accessible style={styles.progressBlock}>
          <View style={styles.progressHeading}>
            <AppText variant="caption" weight="semibold" style={styles.progressText}>Etapa {step} de 4</AppText>
            <AppText variant="caption" muted>{getStepTitle(step)}</AppText>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${step * 25}%` }]} />
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <MedicationFormStep step={1} title={ptBR.form.medication} icon={Pill} expanded={step === 1} onPress={() => goToStep(1)}>
            <FieldLabel label={ptBR.form.name} />
            <TextInput
              ref={nameInputRef}
              accessibilityLabel={ptBR.form.name}
              value={values.name}
              onChangeText={(text) => update("name", text)}
              placeholder={ptBR.form.namePlaceholder}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <FieldLabel label={ptBR.form.dosage} />
            <TextInput
              accessibilityLabel={ptBR.form.dosageAccessibility}
              value={values.dosage}
              onChangeText={(text) => update("dosage", text)}
              placeholder={ptBR.form.dosagePlaceholder}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            {error && step === 1 ? <FormError message={error} /> : null}
          </MedicationFormStep>

          <MedicationFormStep step={2} title={ptBR.form.schedule} icon={CalendarClock} expanded={step === 2} onPress={() => goToStep(2)}>
            <View style={styles.segmented}>
              {SCHEDULE_KINDS.map((kind) => {
                const active = values.scheduleKind === kind.key;
                return (
                  <AppButton
                    key={kind.key}
                    title={kind.label}
                    variant={active ? "primary" : "ghost"}
                    size="compact"
                    style={styles.segmentButton}
                    onPress={() => update("scheduleKind", kind.key)}
                    accessibilityHint={kind.hint}
                    accessibilityState={{ selected: active }}
                  />
                );
              })}
            </View>
            <FieldLabel label={values.scheduleKind === "intervalHours" ? ptBR.form.initialTime : ptBR.form.time} />
            <WheelTimePicker value={values.time} onChange={(time) => update("time", time)} />
            {values.scheduleKind === "intervalHours" ? (
              <>
                <FieldLabel label={ptBR.form.intervalHours} />
                <IntervalHoursPicker value={values.intervalHours} onChange={(hours) => update("intervalHours", hours)} />
              </>
            ) : null}
            {values.scheduleKind === "weekdays" ? (
              <View style={styles.weekdayRow}>
                {WEEKDAY_LABELS.map((label, index) => {
                  const active = values.weekdays.includes(index);
                  return (
                    <AppButton
                      key={label}
                      title={label}
                      variant={active ? "primary" : "ghost"}
                      size="compact"
                      style={styles.weekdayButton}
                      onPress={() => toggleWeekday(index)}
                      accessibilityState={{ selected: active }}
                    />
                  );
                })}
              </View>
            ) : null}
            {error && step === 2 ? <FormError message={error} /> : null}
          </MedicationFormStep>

          <MedicationFormStep step={3} title={ptBR.form.observations} icon={NotebookPen} optional expanded={step === 3} onPress={() => goToStep(3)}>
            <FieldLabel label={ptBR.form.observations} />
            <TextInput
              accessibilityLabel={ptBR.form.observationsAccessibility}
              value={values.notes}
              onChangeText={(text) => update("notes", text)}
              placeholder={ptBR.form.observationsPlaceholder}
              placeholderTextColor={colors.textMuted}
              multiline
              style={[styles.input, styles.notesInput]}
            />
          </MedicationFormStep>

          <MedicationFormStep step={4} title={ptBR.form.review} icon={CircleCheck} expanded={step === 4} onPress={() => goToStep(4)}>
            <SummaryLine label={ptBR.form.medication} value={values.name || ptBR.form.notProvided} />
            <SummaryLine label={ptBR.form.dosage} value={values.dosage || ptBR.form.noDosage} />
            <SummaryLine label={ptBR.form.time} value={values.time} />
            <SummaryLine label={ptBR.form.scheduleSummary} value={getScheduleSummary(values)} />
            {values.notes.trim() ? <SummaryLine label={ptBR.form.observations} value={values.notes.trim()} /> : null}
          </MedicationFormStep>
        </ScrollView>

        <MedicationFormActionBar
          accessibilityLabel={step === 4 ? (mode === "add" ? ptBR.actions.saveMedication : ptBR.actions.saveChanges) : ptBR.actions.continue}
          busy={isSaving}
          error={submitError}
          onPress={handleContinue}
          title={step === 4 ? (mode === "add" ? ptBR.actions.saveMedication : ptBR.actions.saveChanges) : ptBR.actions.continue}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

function getStepTitle(step: Step) {
  return [ptBR.form.medication, ptBR.form.schedule, ptBR.form.observations, ptBR.form.review][step - 1];
}

function getScheduleSummary(values: MedicationFormValues) {
  if (values.scheduleKind === "intervalHours") return `A cada ${values.intervalHours} horas, a partir de ${values.time}`;
  if (values.scheduleKind === "weekdays") return `Às ${values.time}, nos dias selecionados`;
  return `Todos os dias às ${values.time}`;
}

function FieldLabel({ label }: { label: string }) {
  return <AppText variant="small" weight="semibold" style={styles.label}>{label}</AppText>;
}

function FormError({ message }: { message: string }) {
  return <AppText accessibilityLiveRegion="assertive" accessibilityRole="alert" variant="small" style={styles.errorText}>{message}</AppText>;
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryLine}>
      <AppText variant="caption" muted>{label}</AppText>
      <AppText variant="small" weight="semibold" style={styles.summaryValue}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboardArea: { flex: 1 },
  header: { alignItems: "flex-start", flexDirection: "row", marginBottom: spacing.lg },
  headerText: { flex: 1, marginLeft: spacing.md },
  title: { color: colors.primaryDark },
  progressBlock: { marginBottom: spacing.lg },
  progressHeading: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm },
  progressText: { color: colors.primaryDark },
  progressTrack: { backgroundColor: colors.surfaceMuted, borderRadius: 8, height: 8, overflow: "hidden" },
  progressFill: { backgroundColor: colors.primary, borderRadius: 8, height: "100%" },
  content: { paddingBottom: spacing.xl },
  label: { marginBottom: spacing.sm, marginTop: spacing.md },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: colors.text,
    fontFamily: fontFamilies.regular,
    fontSize: 18,
    lineHeight: 27,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  notesInput: { minHeight: 112, textAlignVertical: "top" },
  segmented: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  segmentButton: { flexGrow: 1, minWidth: 96 },
  weekdayRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  weekdayButton: { minWidth: 62 },
  summaryLine: { borderBottomColor: colors.border, borderBottomWidth: 1, paddingVertical: spacing.md },
  summaryValue: { marginTop: spacing.xs },
  errorText: { color: colors.danger, marginTop: spacing.md },
});
