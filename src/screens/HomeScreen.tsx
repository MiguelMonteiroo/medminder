import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MedicationCard } from "../components/MedicationCard";
import { MedicationSummary } from "../components/MedicationSummary";
import { useAppData } from "../services/appDataProvider";
import { RootStackParamList } from "../navigation/types";
import { DoseOccurrence } from "../types/domain";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const {
    medications,
    todayOccurrences,
    todaySummary,
    loading,
    error,
    removeMedication,
    setDoseTaken,
  } = useAppData();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorHint}>Reinicie o aplicativo.</Text>
      </View>
    );
  }

  const pendingOccurrences = todayOccurrences.filter(
    (o) => o.status === "pending" || o.status === "snoozed"
  );
  const completedOccurrences = todayOccurrences.filter(
    (o) => o.status === "taken" || o.status === "skipped"
  );

  function renderOccurrence({ item }: { item: DoseOccurrence }) {
    const medication = medications.find((m) => m.id === item.medicationId);
    if (!medication) return null;

    return (
      <MedicationCard
        name={medication.name}
        dosage=""
        time={item.scheduledAt.split("T")[1]?.substring(0, 5) || ""}
        frequency=""
        taken={item.status === "taken"}
        notes={
          item.status === "snoozed"
            ? "Adiado"
            : item.status === "skipped"
            ? "Pulado"
            : undefined
        }
        onToggleTaken={() =>
          setDoseTaken(
            item.id,
            item.medicationId,
            item.scheduleId,
            item.status === "taken"
          )
        }
        onDelete={() => removeMedication(item.medicationId)}
        onPress={() =>
          navigation.navigate("MedicationDetail", { medicationId: item.medicationId })
        }
      />
    );
  }

  return (
    <View style={styles.container}>
      <MedicationSummary
        takenCount={todaySummary.taken}
        totalCount={todaySummary.total}
      />

      <Pressable
        style={styles.addButton}
        onPress={() => navigation.navigate("AddMedication")}
        accessibilityLabel="Adicionar novo medicamento"
        accessibilityHint="Abre o formulário para cadastrar um novo medicamento"
      >
        <Text style={styles.addButtonText}>+ Adicionar Medicamento</Text>
      </Pressable>

      <View style={styles.list}>
        {pendingOccurrences.length > 0 && (
          <Text style={styles.sectionTitle}>Pendentes</Text>
        )}
        <FlatList
          data={pendingOccurrences}
          keyExtractor={(item) => item.id}
          renderItem={renderOccurrence}
          ListEmptyComponent={
            todayOccurrences.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum medicamento cadastrado.</Text>
            ) : (
              <Text style={styles.emptyText}>Nenhuma dose pendente.</Text>
            )
          }
          contentContainerStyle={styles.listContent}
        />

        {completedOccurrences.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, styles.completedTitle]}>
              Concluídas
            </Text>
            <FlatList
              data={completedOccurrences}
              keyExtractor={(item) => item.id}
              renderItem={renderOccurrence}
              scrollEnabled={false}
            />
          </>
        )}
      </View>

      <View style={styles.bottomButtons}>
        <Pressable
          style={styles.historyButton}
          onPress={() => navigation.navigate("History")}
          accessibilityLabel="Histórico"
          accessibilityHint="Abre o histórico e estatísticas"
        >
          <Text style={styles.bottomButtonText}>Histórico</Text>
        </Pressable>

        <Pressable
          style={styles.settingsButton}
          onPress={() => navigation.navigate("Settings")}
          accessibilityLabel="Configurações"
          accessibilityHint="Abre a tela de configurações do aplicativo"
        >
          <Text style={styles.bottomButtonText}>Configurações</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 24,
    paddingTop: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  errorText: {
    fontSize: 16,
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  list: {
    flex: 1,
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginTop: 48,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6B7280",
    textTransform: "uppercase",
    marginTop: 16,
    marginBottom: 4,
  },
  completedTitle: {
    marginTop: 24,
  },
  addButton: {
    backgroundColor: "#14ce68",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  addButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  bottomButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  historyButton: {
    backgroundColor: "#2563EB",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
  },
  settingsButton: {
    backgroundColor: "#6B7280",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
  },
  bottomButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
});
