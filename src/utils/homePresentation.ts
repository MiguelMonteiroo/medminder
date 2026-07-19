type HomePresentationInput = {
  medicationCount: number;
  total: number;
  taken: number;
  pending: number;
};

export type HomePresentation =
  | { kind: "empty" }
  | { kind: "noDosesToday" }
  | {
      kind: "active" | "complete";
      headline: string;
      progressLabel: string;
      supportLabel: string;
    };

export function getHomePresentation({
  medicationCount,
  total,
  taken,
  pending,
}: HomePresentationInput): HomePresentation {
  if (medicationCount === 0) return { kind: "empty" };
  if (total === 0) return { kind: "noDosesToday" };

  const progressLabel = ptBR.home.progress(taken, total);
  if (pending === 0) {
    return {
      kind: "complete",
      headline: ptBR.home.allDosesRegistered,
      progressLabel,
      supportLabel: ptBR.home.allRegistered,
    };
  }

  return {
    kind: "active",
    headline: ptBR.home.remaining(pending),
    progressLabel,
    supportLabel: ptBR.home.oneDoseAtATime,
  };
}
import { ptBR } from "../i18n/ptBR";
