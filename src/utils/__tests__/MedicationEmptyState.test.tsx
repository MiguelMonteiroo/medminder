import React from "react";
// @ts-expect-error react-test-renderer does not ship declarations in this project.
import TestRenderer, { act } from "react-test-renderer";
import { MedicationEmptyState } from "../../components/MedicationEmptyState";

describe("MedicationEmptyState", () => {
  it("exposes one clear action for creating a medication", async () => {
    const onAction = jest.fn();
    let renderer!: ReturnType<typeof TestRenderer.create>;

    await act(async () => {
      renderer = TestRenderer.create(
        <MedicationEmptyState
          actionLabel="Adicionar medicamento"
          message="Adicione seu primeiro medicamento."
          onAction={onAction}
          title="Nenhum medicamento cadastrado"
        />
      );
    });

    const action = renderer.root.findByProps({ accessibilityLabel: "Adicionar medicamento" });
    await act(async () => action.props.onPress());
    expect(onAction).toHaveBeenCalledTimes(1);

    await act(async () => renderer.unmount());
  });
});
