import { View, Text, Pressable, StyleSheet } from "react-native"

type Props = {
    name: string;
    dosage: string;
    time: string;
    frequency: string;
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
    time: {
        color: "#555",
        marginTop: 4,
    },
    frequency: {
        color: "#555",
        marginTop: 4,
    },
    notes: {
        color: "#777",
        marginTop: 4,
    },
    deleteButton: {
        marginTop: 12,
        backgroundColor: "#DC2626",
        padding: 10,
        borderRadius: 8,
        alignSelf: "flex-end",
        paddingHorizontal: 12
    },
    deleteButtonText: {
        color: "#FFF",
        fontWeight: "bold",
        fontSize: 12,
    }
})

export function MedicationCard({name, dosage, time, frequency, notes, onDelete} : Props){
    return(
        <View style={styles.card}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.dosage}>Dosagem: {dosage}</Text>
            <Text style={styles.time}>Horario: {time}</Text>
            {frequency ? <Text style={styles.frequency}>Frequencia: {frequency}</Text> : null}
            {notes ? <Text style={styles.notes}>Notas: {notes}</Text> : null}

            <Pressable style={styles.deleteButton} onPress={onDelete}>
                <Text style={styles.deleteButtonText}>Remover</Text>
            </Pressable>
        </View>
    )
}