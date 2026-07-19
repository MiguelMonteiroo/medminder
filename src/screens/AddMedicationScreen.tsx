import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MedicationFormScreen, type MedicationFormValues } from "../components/MedicationFormScreen";
import { RootStackParamList } from "../navigation/types";
import { useAppData } from "../services/appDataProvider";

type Props = NativeStackScreenProps<RootStackParamList, "AddMedication">;

const INITIAL_VALUES: MedicationFormValues = {
  name: "",
  dosage: "",
  time: "08:00",
  notes: "",
  scheduleKind: "dailyTimes",
  intervalHours: 8,
  weekdays: [1, 2, 3, 4, 5],
};

export function AddMedicationScreen({ navigation }: Props) {
  const { addMedication } = useAppData();

  async function handleSubmit(values: MedicationFormValues) {
    await addMedication(
      values.name,
      values.dosage,
      values.time,
      values.notes,
      values.scheduleKind,
      values.intervalHours,
      values.weekdays
    );
    navigation.goBack();
  }

  return (
    <MedicationFormScreen
      initialValues={INITIAL_VALUES}
      mode="add"
      onBack={() => navigation.goBack()}
      onSubmit={handleSubmit}
    />
  );
}
