import React from "react";
// @ts-expect-error react-test-renderer does not ship declarations in this project.
import TestRenderer, { act } from "react-test-renderer";
import { WheelTimePicker } from "../../components/WheelTimePicker";

describe("WheelTimePicker concurrent adjustments", () => {
  it("combines hour and minute changes made before the next render", async () => {
    const onChange = jest.fn();
    let renderer!: ReturnType<typeof TestRenderer.create>;

    await act(async () => {
      renderer = TestRenderer.create(
        <WheelTimePicker value="08:00" onChange={onChange} />
      );
    });

    const hour = renderer.root.find(
      (node: { props: { accessibilityLabel?: string; onAccessibilityAction?: unknown } }) =>
        node.props.accessibilityLabel?.endsWith(", hora") === true &&
        typeof node.props.onAccessibilityAction === "function"
    );
    const minute = renderer.root.find(
      (node: { props: { accessibilityLabel?: string; onAccessibilityAction?: unknown } }) =>
        node.props.accessibilityLabel?.endsWith(", minuto") === true &&
        typeof node.props.onAccessibilityAction === "function"
    );

    await act(async () => {
      hour.props.onAccessibilityAction({
        nativeEvent: { actionName: "increment" },
      });
      minute.props.onAccessibilityAction({
        nativeEvent: { actionName: "increment" },
      });
    });

    expect(onChange).toHaveBeenLastCalledWith("09:01");

    await act(async () => renderer.unmount());
  });
});
