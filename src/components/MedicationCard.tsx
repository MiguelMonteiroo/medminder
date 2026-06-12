import {View, Text, Button, StyleSheet} from 'react-native'

type Props = {
    name: string;
    dosage: string;
    notes?: string;
    onDelete: () => void;
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#FFF",
        padding: 16,
        borderRadius: 8,
        marginTop: 12,
        width: "100%"
    },
    name: {
        fontSize: 18,
        fontWeight: "bold",
    },
    dosage: {
        color: "#555",
        marginTop: 4,
    },
    notes: {
        color: "#777",
        marginTop: 4,
    }
})

export function MedicationCard({name, dosage, notes, onDelete} : Props){
    return(
        <View style={styles.card}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.dosage}>{dosage}</Text>
            {notes ? <Text style={styles.notes}>{notes}</Text> : null}

            <Button title= "Remover" onPress={onDelete}/>
        </View>
    )
}