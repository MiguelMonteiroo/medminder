import { View, Text, Pressable, StyleSheet, Alert } from "react-native";

type Props = {
  name: string;
  dosage: string;
  time: string;
  frequency: string;
  notes?: string;
  taken: boolean;
  onToggleTaken: () => void;
  onDelete: () => void;
  onPress?: () => void;
};

export function MedicationCard({
  name,
  dosage,
  time,
  frequency,
  notes,
  taken,
  onToggleTaken,
  onDelete,
  onPress,
}: Props) {
  function handleDelete() {
    Alert.alert(
      "Remover Medicamento",
      `Tem certeza que deseja remover ${name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Remover", style: "destructive", onPress: onDelete },
      ]
    );
  }

  return (
    <Pressable
      style={[styles.card, taken && styles.takenCard]}
      onPress={onPress}
      accessibilityLabel={`${name}, ${taken ? "tomado" : "pendente"}`}
      accessibilityHint="Toque para ver detalhes do medicamento"
    >
      <Text
        style={taken ? styles.takenName : styles.pendingName}
        accessibilityRole="header"
      >
        {name}
      </Text>
      {dosage ? <Text style={styles.detail}>Dosagem: {dosage}</Text> : null}
      <Text style={styles.detail}>Horário: {time}</Text>
      {frequency ? (
        <Text style={styles.detail}>Frequência: {frequency}</Text>
      ) : null}
      {notes ? <Text style={styles.notes}>{notes}</Text> : null}
      <Text
        style={taken ? styles.takenText : styles.pendingText}
        accessibilityLiveRegion="polite"
      >
        {taken ? "Tomado" : "Pendente"}
      </Text>

      <View style={styles.actions}>
        <Pressable
          style={styles.takenButton}
          onPress={onToggleTaken}
          accessibilityLabel={taken ? "Desfazer" : "Marcar como tomado"}
          accessibilityHint={
            taken
              ? "Reverte o medicamento para pendente"
              : "Registra o medicamento como tomado"
          }
        >
          <Text style={styles.buttonText}>
            {taken ? "Desfazer" : "Tomado"}
          </Text>
        </Pressable>

        <Pressable
          style={styles.deleteButton}
          onPress={handleDelete}
          accessibilityLabel="Remover medicamento"
          accessibilityHint="Remove este medicamento da lista"
        >
          <Text style={styles.buttonText}>Remover</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
    width: "100%",
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
  detail: {
    color: "#555",
    marginTop: 4,
  },
  notes: {
    color: "#777",
    marginTop: 4,
    fontStyle: "italic",
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
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  takenButton: {
    backgroundColor: "#2563EB",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#DC2626",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
  },
});
