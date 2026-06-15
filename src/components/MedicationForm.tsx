import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import { Medication } from "../types/Medication";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

type Props = {
    onAddMedication: (medication: Medication) => void;
}

export function MedicationForm({onAddMedication}: Props) {
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [time, setTime] = useState("");
  const [frequency, setFrequency] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  function addMedication() {
    if (!name.trim()) {
      setError("Informe o nome do medicamento.");
      return;
    }

    if (!time.trim()) {
      setError("Informe o horario do medicamento.");
      return;
    }

    if (!timeRegex.test(time.trim())) {
      setError("Informe o horario no formato 08:00.");
      return;
    }

    setError("");

    onAddMedication({
        id: Date.now().toString(),
        name: name.trim(),
        dosage: dosage.trim() || "Sem dosagem",
        time: time.trim(),
        frequency: frequency.trim(),
        notes: notes.trim(),
        taken: false,
      });

    setName("");
    setDosage("");
    setTime("");
    setFrequency("");
    setNotes("");
  }

  function handleNameChange(text: string) {
    setName(text);
    if (error) {
      setError("");
    }
  }

  function handleTimeChange(text: string) {
    setTime(text);
    if (error) {
      setError("");
    }
  }

  return (
    <View>
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

      <TextInput
        value={time}
        onChangeText={handleTimeChange}
        placeholder="Horario: (ex: 08:00)"
        style={styles.input}
      />

      <TextInput
        value={frequency}
        onChangeText={setFrequency}
        placeholder="Frequencia: (ex: 1 vez ao dia)"
        style={styles.input}
      />
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Notas"
        style={styles.input}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable style={styles.addButton} onPress={addMedication}>
        <Text style={styles.addButtonText}>Adicionar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#FFF",
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
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
