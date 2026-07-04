import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { RootStackParamList } from "../navigation/types";
import { useAppData } from "../services/appDataProvider";

type Props = NativeStackScreenProps<RootStackParamList, "MedicationDetail">;

export function MedicationDetailScreen({ route }: Props) {
  const { medicationId } = route.params;
  const { medications, schedules, setMedicationPaused } = useAppData();
  const [isPaused, setIsPaused] = useState(false);

  const medication = medications.find((m) => m.id === medicationId);
  const medSchedules = schedules.filter((s) => s.medicationId === medicationId);

  if (!medication) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Medicamento não encontrado.</Text>
      </View>
    );
  }

  const firstSchedule = medSchedules[0];
  const paused = medication.isPaused;

  async function handleTogglePause() {
    await setMedicationPaused(medicationId, !paused);
    setIsPaused(!paused);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{medication.name}</Text>
      <Text style={styles.detail}>Dosagem: {medication.dosage}</Text>
      {firstSchedule && (
        <>
          <Text style={styles.detail}>
            Horário(s): {firstSchedule.times.join(", ")}
          </Text>
          <Text style={styles.detail}>
            Tipo:{" "}
            {firstSchedule.kind === "dailyTimes"
              ? "Diário"
              : firstSchedule.kind === "intervalHours"
              ? `A cada ${firstSchedule.intervalHours}h`
              : "Dias da semana"}
          </Text>
        </>
      )}
      {medication.notes ? (
        <Text style={styles.detail}>Notas: {medication.notes}</Text>
      ) : null}
      <Text style={styles.detail}>
        Status: {paused ? "Pausado" : "Ativo"}
      </Text>

      <Pressable
        style={[styles.pauseButton, paused && styles.resumeButton]}
        onPress={handleTogglePause}
      >
        <Text style={styles.pauseButtonText}>
          {paused ? "Reativar Medicamento" : "Pausar Medicamento"}
        </Text>
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  detail: {
    fontSize: 16,
    color: "#555",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#DC2626",
  },
  pauseButton: {
    marginTop: 24,
    backgroundColor: "#F59E0B",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  resumeButton: {
    backgroundColor: "#16A34A",
  },
  pauseButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
