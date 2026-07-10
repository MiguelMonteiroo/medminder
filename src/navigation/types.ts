export type RootStackParamList = {
  MainTabs: undefined;
  AddMedication: undefined;
  EditMedication: { medicationId: string };
  MedicationDetail: { medicationId: string };
};

export type RootTabParamList = {
  Home: undefined;
  Medications: undefined;
  History: undefined;
  Profile: undefined;
};
