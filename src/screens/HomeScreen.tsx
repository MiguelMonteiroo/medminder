import {View, Text, TextInput, Button, StyleSheet} from 'react-native'
import { useState } from 'react';
import { MedicationCard } from '../components/MedicationCard'; 
import { Medication } from '../types/Medication';


export function HomeScreen() {
    const [medications, setMedications] = useState<Medication[]>([{
        id: "1",
        name: "Losartana",
        dosage:"50mg",
    },
    {
      id: "2",
      name: "Vitamina D",
      dosage: "1000UI",
    }]);

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
            notes: notes

            },
        ]);

        setName("");
        setDosage("");
        setNotes("");
    }

    function removeMedication(id: string) {
        setMedications(medications.filter((medication) => medication.id !== id))
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
            marginBottom: 20
        },
        input: {
            borderWidth: 1,
            borderColor: "#DDD",
            backgroundColor: "#FFF",
            padding: 12,
            marginBottom: 10,
            borderRadius:8,
        }
    })

    return(
        <View style={styles.container}>
            <Text style ={styles.title}>MediTrack</Text>
            <TextInput
                value={name}
                onChangeText={setName}
                placeholder='Nome do medicamento'
                style={styles.input}
            />

             <TextInput
                value={dosage}
                onChangeText={setDosage}
                placeholder='Dosagem do medicamento'
                style={styles.input}

            />

              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder='Notas'
                style={styles.input}
            />
            <Button
                title="Add"
                onPress={addMedication}
            />
            <View style={{ marginTop: 20 }}>
                {medications.map((medication) => (
                <MedicationCard 
                key={medication.id}
                name={medication.name}
                dosage={medication.dosage}
                notes={medication.notes}
                onDelete={() => removeMedication(medication.id)}/>
            ))}
            </View>
            
        </View>



    );
}