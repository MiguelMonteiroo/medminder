import React from "react";
// @ts-expect-error react-test-renderer does not ship declarations in this project.
import TestRenderer, { act } from "react-test-renderer";
import { CareDoseActionCard } from "../../components/CareDoseActionCard";
import { CareNextDoseCard } from "../../components/CareNextDoseCard";

describe("dose time layout", () => {
  it.each([
    [
      "pending dose",
      <CareDoseActionCard
        key="pending"
        name="Dipirona"
        onTake={jest.fn()}
        time="08:00"
      />,
    ],
    [
      "next dose",
      <CareNextDoseCard key="next" name="Dipirona" time="08:00" />,
    ],
  ])("keeps the %s time on one line", async (_label, component) => {
    let renderer!: ReturnType<typeof TestRenderer.create>;

    await act(async () => {
      renderer = TestRenderer.create(component);
    });

    const time = renderer.root.find(
      (node: { props: { children?: unknown; numberOfLines?: number } }) =>
        node.props.children === "08:00" && node.props.numberOfLines === 1
    );

    expect(time.props.ellipsizeMode).toBe("clip");

    await act(async () => renderer.unmount());
  });
});
