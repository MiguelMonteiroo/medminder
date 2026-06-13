import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
} from "react-native";
import { useState } from "react";
import { MedicationCard } from "../components/MedicationCard";
import { Medication } from "../types/Medication";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export function HomeScreen() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  function addMedication() {
    if (!name.trim()){
      setError("Informe o nome do medicamento.");
      return;
    }

    if (!time.trim()) {
      setError("Informe o horario do medicamento.");
      return;
    }

     if (!timeRegex.test(time.trim())){
      setError("Informe o horario no formato 08:00.");
      return;
    }

    
    setError("");

    setMedications([
      ...medications,
      {
        id: Date.now().toString(),
        name: name.trim(),
        dosage: dosage.trim() || "Sem dosagem",
        time: time.trim(),
        notes: notes.trim(),
      },
    ]);

    setName("");
    setDosage("");
    setTime("");
    setNotes("");
  }

  function handleNameChange(text: string){
    setName(text);
    if(error){
      setError("");
    }
  }

   function handleTimeChange(text: string){
    setTime(text);
    if(error){
      setError("");
    }
  }

  function removeMedication(id: string) {
    setMedications(medications.filter((medication) => medication.id !== id));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MediTrack</Text>
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
        value={notes}
        onChangeText={setNotes}
        placeholder="Notas"
        style={styles.input}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable style={styles.addButton} onPress={addMedication}>
        <Text style={styles.addButtonText}>Adicionar</Text>
      </Pressable>

      <View style={styles.list}>
        <FlatList
          data={medications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MedicationCard
              name={item.name}
              dosage={item.dosage}
              time={item.time}
              notes={item.notes}
              onDelete={() => removeMedication(item.id)}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum medicamento cadastrado.</Text>
          }
          contentContainerStyle={styles.listContent}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 24,
    paddingTop: 60,
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
    flex: 1,
    marginTop: 20,
  },
  listContent: {
    paddingBottom: 80,
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
    marginTop: 48,
  },
  errorText: {
    color: "#DC2626",
    marginBottom: 10,
    fontWeight: "500",
  }
});
