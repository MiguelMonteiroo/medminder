import { StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MedicationFormScreen, type MedicationFormValues } from "../components/MedicationFormScreen";
import { AppText } from "../components/ui/AppText";
import { Screen } from "../components/ui/Screen";
import { RootStackParamList } from "../navigation/types";
import { useAppData } from "../services/appDataProvider";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "EditMedication">;

export function EditMedicationScreen({ route, navigation }: Props) {
  const { medicationId } = route.params;
  const { medications, schedules, updateMedicationWithSchedule } = useAppData();
  const medication = medications.find((item) => item.id === medicationId);
  const schedule =
    schedules.find((item) => item.medicationId === medicationId && item.isActive) ??
    schedules.find((item) => item.medicationId === medicationId);

  if (!medication) {
    return (
      <Screen style={styles.center}>
        <AppText variant="subheading" style={styles.error}>Medicamento não encontrado.</AppText>
      </Screen>
    );
  }

  const initialValues: MedicationFormValues = {
    name: medication.name,
    dosage: medication.dosage === "Sem dosagem" ? "" : medication.dosage,
    time: schedule?.times[0] ?? "08:00",
    notes: medication.notes ?? "",
    scheduleKind: schedule?.kind ?? "dailyTimes",
    intervalHours: schedule?.intervalHours ?? 8,
    weekdays: schedule?.weekdays ?? [1, 2, 3, 4, 5],
  };

  async function handleSubmit(values: MedicationFormValues) {
    await updateMedicationWithSchedule(
      medicationId,
      values.name,
      values.dosage,
      values.notes,
      values.scheduleKind,
      values.time,
      values.intervalHours,
      values.weekdays
    );
    navigation.goBack();
  }

  return (
    <MedicationFormScreen
      initialValues={initialValues}
      mode="edit"
      onBack={() => navigation.goBack()}
      onSubmit={handleSubmit}
    />
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
  error: { color: colors.danger, textAlign: "center" },
});
