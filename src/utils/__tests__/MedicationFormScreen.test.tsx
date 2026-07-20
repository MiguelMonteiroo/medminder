import React from "react";
// @ts-expect-error react-test-renderer does not ship declarations in this project.
import TestRenderer, { act } from "react-test-renderer";
import {
  MedicationFormScreen,
  type MedicationFormValues,
} from "../../components/MedicationFormScreen";

const INITIAL_VALUES: MedicationFormValues = {
  name: "Dipirona",
  dosage: "500 mg",
  time: "08:00",
  notes: "",
  scheduleKind: "dailyTimes",
  intervalHours: 8,
  weekdays: [1, 2, 3, 4, 5],
};

describe("MedicationFormScreen", () => {
  it("submits only once when the save action is pressed twice quickly", async () => {
    let finishSaving!: () => void;
    const pendingSave = new Promise<void>((resolve) => {
      finishSaving = resolve;
    });
    const onSubmit = jest.fn(() => pendingSave);
    const onBack = jest.fn();
    let renderer!: ReturnType<typeof TestRenderer.create>;

    await act(async () => {
      renderer = TestRenderer.create(
        <MedicationFormScreen
          initialValues={INITIAL_VALUES}
          mode="add"
          onBack={onBack}
          onSubmit={onSubmit}
        />
      );
    });

    for (let step = 1; step < 4; step += 1) {
      const continueButton = renderer.root.findByProps({
        accessibilityLabel: "Continuar",
      });
      await act(async () => continueButton.props.onPress());
    }

    const saveButton = renderer.root.findByProps({
      accessibilityLabel: "Salvar medicamento",
    });
    const backButton = renderer.root.findByProps({ accessibilityLabel: "Voltar" });
    await act(async () => {
      void saveButton.props.onPress();
      void saveButton.props.onPress();
      void backButton.props.onPress();
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onBack).not.toHaveBeenCalled();

    await act(async () => finishSaving());
    await act(async () => renderer.unmount());
  });
});
