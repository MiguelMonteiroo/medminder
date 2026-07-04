import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppButton } from "../components/ui/AppButton";
import { AppCard } from "../components/ui/AppCard";
import { AppText } from "../components/ui/AppText";
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

type Props = NativeStackScreenProps<RootStackParamList, "AddMedication">;

const SCHEDULE_KINDS: { key: ScheduleKind; label: string; hint: string }[] = [
  { key: "dailyTimes", label: "Diário", hint: "Uma dose por dia" },
  { key: "intervalHours", label: "Intervalo", hint: "A cada N horas" },
  { key: "weekdays", label: "Semana", hint: "Dias específicos" },
];

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function AddMedicationScreen({ navigation }: Props) {
  const { addMedication } = useAppData();
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [scheduleKind, setScheduleKind] = useState<ScheduleKind>("dailyTimes");
  const [intervalHours, setIntervalHours] = useState("8");
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [error, setError] = useState("");

  function toggleWeekday(day: number) {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleAdd() {
    const nameError = validateMedicationName(name);
    if (nameError) {
      setError(nameError);
      return;
    }

    const timeError = validateTimeHHMM(time);
    if (timeError) {
      setError(
        scheduleKind === "intervalHours"
          ? "Informe o horário inicial no formato 08:00."
          : timeError
      );
      return;
    }

    if (scheduleKind === "intervalHours" && parseInt(intervalHours, 10) < 1) {
      setError("O intervalo deve ser de pelo menos 1 hora.");
      return;
    }

    if (scheduleKind === "weekdays" && weekdays.length === 0) {
      setError("Selecione pelo menos um dia da semana.");
      return;
    }

    setError("");
    const normalized = normalizeMedicationInput({ name, dosage, notes });

    await addMedication(
      normalized.name,
      normalized.dosage,
      time.trim(),
      normalized.notes,
      scheduleKind,
      parseInt(intervalHours, 10) || 8,
      weekdays
    );

    navigation.goBack();
  }

  function clearError() {
    if (error) setError("");
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <AppText variant="caption" muted>
          Nova rotina
        </AppText>
        <AppText variant="title" style={styles.title}>
          Adicionar medicamento
        </AppText>

        <AppCard style={styles.section}>
          <AppText variant="subheading">Medicamento</AppText>
          <AppText muted style={styles.sectionHint}>
            Comece com o nome e a dosagem que você reconhece no dia a dia.
          </AppText>
          <TextInput
            value={name}
            onChangeText={(text) => {
              setName(text);
              clearError();
            }}
            placeholder="Nome do medicamento"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
          <TextInput
            value={dosage}
            onChangeText={setDosage}
            placeholder="Dosagem, ex: 50mg"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
        </AppCard>

        <AppCard style={styles.section}>
          <AppText variant="subheading">Agendamento</AppText>
          <AppText muted style={styles.sectionHint}>
            Escolha como esta dose entra na sua rotina.
          </AppText>

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

          <TextInput
            value={time}
            onChangeText={(text) => {
              setTime(text);
              clearError();
            }}
            placeholder={
              scheduleKind === "intervalHours"
                ? "Horário inicial, ex: 08:00"
                : "Horário, ex: 08:00"
            }
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
          <AppText variant="caption" muted style={styles.helperText}>
            Use sempre dois dígitos para hora e minuto.
          </AppText>

          {scheduleKind === "intervalHours" ? (
            <TextInput
              value={intervalHours}
              onChangeText={setIntervalHours}
              placeholder="Intervalo em horas"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              style={styles.input}
            />
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
        </AppCard>

        <AppCard style={styles.section}>
          <AppText variant="subheading">Notas</AppText>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Ex: tomar após o café"
            placeholderTextColor={colors.textMuted}
            multiline
            style={[styles.input, styles.notesInput]}
          />
        </AppCard>

        {error ? (
          <AppText style={styles.errorText} accessibilityLiveRegion="polite">
            {error}
          </AppText>
        ) : null}

        <AppButton
          title="Salvar medicamento"
          variant="secondary"
          onPress={handleAdd}
          accessibilityLabel="Salvar medicamento"
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  title: {
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionHint: {
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    marginTop: spacing.md,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  notesInput: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  segmented: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  segmentButton: {
    flex: 1,
  },
  helperText: {
    marginTop: spacing.xs,
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
  errorText: {
    color: colors.danger,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
});
