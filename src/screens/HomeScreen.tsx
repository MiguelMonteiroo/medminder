import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from "react-native";
import { useState } from "react";
import { MedicationCard } from "../components/MedicationCard";
import { Medication } from "../types/Medication";
import { MedicationForm } from "../components/MedicationForm";

export function HomeScreen() {
  const [medications, setMedications] = useState<Medication[]>([]);

  function handleAddMedication(medication: Medication) {
    setMedications([...medications, medication]);
  }

  function removeMedication(id: string) {
    setMedications(medications.filter((medication) => medication.id !== id));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MediTrack</Text>
    
      <MedicationForm onAddMedication={handleAddMedication} />
      <View style={styles.list}>
        <FlatList
          data={medications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MedicationCard
              name={item.name}
              dosage={item.dosage}
              time={item.time}
              frequency={item.frequency}
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
  list: {
    flex: 1,
    marginTop: 20,
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginTop: 48,
  }
});
