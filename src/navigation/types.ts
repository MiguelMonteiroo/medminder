import type { NavigatorScreenParams } from "@react-navigation/native";

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<RootTabParamList> | undefined;
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
