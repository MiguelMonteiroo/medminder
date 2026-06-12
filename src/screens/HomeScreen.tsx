import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import { MedicationCard } from "../components/MedicationCard";
import { Medication } from "../types/Medication";

export function HomeScreen() {
  const [medications, setMedications] = useState<Medication[]>([]);

  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [notes, setNotes] = useState("");

  function addMedication() {
    if (!name.trim()) return;

    setMedications([
      ...medications,
      {
        id: Date.now().toString(),
        name: name,
        dosage: dosage || "Sem dosagem",
        notes: notes,
      },
    ]);

    setName("");
    setDosage("");
    setNotes("");
  }

  function removeMedication(id: string) {
    setMedications(medications.filter((medication) => medication.id !== id));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MediTrack</Text>
      <TextInput
        value={name}
        onChangeText={setName}
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
        value={notes}
        onChangeText={setNotes}
        placeholder="Notas"
        style={styles.input}
      />

      <Pressable style={styles.addButton} onPress={addMedication}>
        <Text style={styles.addButtonText}>Adicionar</Text>
      </Pressable>

      <View style={styles.list}>
        {medications.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum medicamento cadastrado.</Text>
        ) : (
          medications.map((medication) => (
            <MedicationCard
              key={medication.id}
              name={medication.name}
              dosage={medication.dosage}
              notes={medication.notes}
              onDelete={() => removeMedication(medication.id)}
            />
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    backgroundColor: "#F5F5F5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#FFF",
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
  },
  list: {
    marginTop: 20,
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
  emptyText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginTop: 24,
  },
});
