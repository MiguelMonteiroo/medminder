import React from "react";
// The runtime package is intentionally sufficient for this focused component test.
// @ts-expect-error react-test-renderer does not ship declarations in this project.
import TestRenderer, { act } from "react-test-renderer";
import { ConfirmationDialog } from "../../components/ui/ConfirmationDialog";

describe("ConfirmationDialog", () => {
  it("only confirms a destructive action from its explicit confirm button", async () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    let renderer!: ReturnType<typeof TestRenderer.create>;

    await act(async () => {
      renderer = TestRenderer.create(
        <ConfirmationDialog
          cancelLabel="Cancelar"
          confirmAccessibilityLabel="Confirmar remoção"
          confirmLabel="Remover"
          description="Esta ação não pode ser desfeita."
          onCancel={onCancel}
          onConfirm={onConfirm}
          title="Remover medicamento"
          variant="destructive"
          visible
        />
      );
    });

    const cancel = renderer.root.findByProps({ accessibilityLabel: "Cancelar" });
    const header = renderer.root.findByProps({
      accessibilityLabel: "Remover medicamento",
      accessibilityRole: "header",
    });
    expect(header.props.accessible).toBe(true);
    await act(async () => cancel.props.onPress());
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();

    const confirm = renderer.root.findByProps({
      accessibilityLabel: "Confirmar remoção",
    });
    await act(async () => confirm.props.onPress());
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await act(async () => renderer.unmount());
  });
});
