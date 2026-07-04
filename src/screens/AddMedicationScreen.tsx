import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useAppData } from "../services/appDataProvider";
import {
  validateMedicationName,
  validateTimeHHMM,
  normalizeMedicationInput,
} from "../utils/validation";
import { ScheduleKind } from "../types/domain";

type Props = NativeStackScreenProps<RootStackParamList, "AddMedication">;

const SCHEDULE_KINDS: { key: ScheduleKind; label: string }[] = [
  { key: "dailyTimes", label: "Horários Fixos" },
  { key: "intervalHours", label: "A Cada N Horas" },
  { key: "weekdays", label: "Dias da Semana" },
];

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

  const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

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

    if (scheduleKind === "dailyTimes" || scheduleKind === "weekdays") {
      const timeError = validateTimeHHMM(time);
      if (timeError) {
        setError(timeError);
        return;
      }
    }

    if (scheduleKind === "intervalHours") {
      if (!time) {
        setError("Informe o horário inicial.");
        return;
      }
      const timeError = validateTimeHHMM(time);
      if (timeError) {
        setError(timeError);
        return;
      }
      if (!intervalHours || parseInt(intervalHours, 10) < 1) {
        setError("O intervalo deve ser de pelo menos 1 hora.");
        return;
      }
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

    setName("");
    setDosage("");
    setTime("");
    setNotes("");
    navigation.goBack();
  }

  function handleNameChange(text: string) {
    setName(text);
    if (error) setError("");
  }

  function handleTimeChange(text: string) {
    setTime(text);
    if (error) setError("");
  }

  return (
    <View style={styles.container}>
      <TextInput
        value={name}
        onChangeText={handleNameChange}
        placeholder="Nome do medicamento"
        style={styles.input}
      />

      <TextInput
        value={dosage}
        onChangeText={setDosage}
        placeholder="Dosagem do medicamento"
        style={styles.input}
      />

      <Text style={styles.label}>Tipo de Agendamento</Text>
      <View style={styles.kindRow}>
        {SCHEDULE_KINDS.map((kind) => (
          <Pressable
            key={kind.key}
            style={[
              styles.kindButton,
              scheduleKind === kind.key && styles.kindButtonActive,
            ]}
            onPress={() => setScheduleKind(kind.key)}
          >
            <Text
              style={[
                styles.kindButtonText,
                scheduleKind === kind.key && styles.kindButtonTextActive,
              ]}
            >
              {kind.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        value={time}
        onChangeText={handleTimeChange}
        placeholder={
          scheduleKind === "intervalHours"
            ? "Horário inicial: (ex: 08:00)"
            : "Horário: (ex: 08:00)"
        }
        style={styles.input}
      />

      {scheduleKind === "intervalHours" && (
        <TextInput
          value={intervalHours}
          onChangeText={setIntervalHours}
          placeholder="Intervalo em horas"
          keyboardType="numeric"
          style={styles.input}
        />
      )}

      {scheduleKind === "weekdays" && (
        <View style={styles.weekdayRow}>
          {WEEKDAY_LABELS.map((label, index) => (
            <Pressable
              key={index}
              style={[
                styles.weekdayButton,
                weekdays.includes(index) && styles.weekdayButtonActive,
              ]}
              onPress={() => toggleWeekday(index)}
            >
              <Text
                style={[
                  styles.weekdayText,
                  weekdays.includes(index) && styles.weekdayTextActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Notas"
        style={styles.input}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable style={styles.addButton} onPress={handleAdd}>
        <Text style={styles.addButtonText}>Adicionar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#FFF",
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6B7280",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  kindRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  kindButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#FFF",
    alignItems: "center",
  },
  kindButtonActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  kindButtonText: {
    fontSize: 11,
    color: "#555",
    fontWeight: "500",
  },
  kindButtonTextActive: {
    color: "#FFF",
  },
  weekdayRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },
  weekdayButton: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#FFF",
    alignItems: "center",
  },
  weekdayButtonActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  weekdayText: {
    fontSize: 11,
    color: "#555",
  },
  weekdayTextActive: {
    color: "#FFF",
  },
  addButton: {
    backgroundColor: "#14ce68",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  addButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  errorText: {
    color: "#DC2626",
    marginBottom: 10,
    fontWeight: "500",
  },
});
