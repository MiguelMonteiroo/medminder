import { View, Text, Pressable, StyleSheet } from "react-native"

type Props = {
    name: string;
    dosage: string;
    time: string;
    frequency: string;
    notes?: string;
    taken: boolean;
    onToggleTaken: () => void;
    onDelete: () => void;
}

export function MedicationCard({name, dosage, time, frequency, notes, taken, onToggleTaken, onDelete} : Props){
    return(
        <View style={[styles.card, taken && styles.takenCard]}>
            <Text style={taken ? styles.takenName : styles.pendingName}>{name}</Text>
            <Text style={styles.dosage}>Dosagem: {dosage}</Text>
            <Text style={styles.time}>Horario: {time}</Text>
            {frequency ? <Text style={styles.frequency}>Frequencia: {frequency}</Text> : null}
            {notes ? <Text style={styles.notes}>Notas: {notes}</Text> : null}
            <Text style={taken ? styles.takenText : styles.pendingText}>{taken ? "Tomado" : "Pendente"}</Text>

            <Pressable style={styles.takenButton} onPress={onToggleTaken}>
                <Text style={styles.takenButtonText}>{taken ? "Desfazer" : "Marcar como tomado"}</Text>
            </Pressable>

            <Pressable style={styles.deleteButton} onPress={onDelete}>
                <Text style={styles.deleteButtonText}>Remover</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#FFF",
        padding: 16,
        borderRadius: 8,
        marginTop: 12,
        width: "100%"
    },
    takenCard: {
        borderWidth: 1,
        borderColor: "#16A34A",
    },
    takenName: {
        color: "#16A34A",
        fontSize: 18,
        fontWeight: "bold",
    },
    pendingName: {
        color: "#DC2626",
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
    takenText: {
        color: "#16A34A",
        fontWeight: "bold",
        marginTop: 8,
    },
    pendingText: {
        color: "#DC2626",
        fontWeight: "bold",
        marginTop: 8,
    },

    takenButton: {
        marginTop: 12,
        backgroundColor: "#2563EB",
        padding: 10,
        borderRadius: 8,
        alignItems: "center",
    },
    takenButtonText: {
        color: "#FFF",
        fontWeight: "bold",
        fontSize: 12,
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