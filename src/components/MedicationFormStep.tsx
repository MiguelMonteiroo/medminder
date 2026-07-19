import type { ComponentProps } from "react";
import { CareAccordionStepCard } from "./CareAccordionStepCard";

type Props = ComponentProps<typeof CareAccordionStepCard>;

export function MedicationFormStep(props: Props) {
  return <CareAccordionStepCard {...props} />;
}
