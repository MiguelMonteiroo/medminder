import {View, TextInput, Button} from 'react-native'
import { useState } from 'react';
import { MedicationCard } from '../components/MedicationCard'; 



export function HomeScreen() {
    const [medications, setMedications] = useState([{
        id: "1",
        name: "Losartana",
        dosage:"50mg"
    },
    {
      id: "2",
      name: "Vitamina D",
      dosage: "1000UI",
    }]);

    const [name, setName] = useState("");

    function addMedication() {
        if (!name.trim()) return;

        setMedications([
            ...medications,
            {
            id: Date.now().toString(),
            name: name,
            dosage: "Sem dosagem",
            },
        ]);

        setName("");
    }
    return(
        <View
        style= {{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <TextInput
                value={name}
                onChangeText={setName}
                placeholder='Nome do medicamento'
                style={{
                    borderWidth: 1,
                    padding: 10,
                    marginBottom: 10
                }}
            />

            <Button
                title="Add"
                onPress={addMedication}
            />

            {medications.map((medication) => (
                <MedicationCard 
                key={medication.id}
                name={medication.name}
                dosage={medication.dosage}/>
            ))}
        </View>
    );
}