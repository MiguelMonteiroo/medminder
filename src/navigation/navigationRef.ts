import { createNavigationContainerRef } from "@react-navigation/native";
import type { RootStackParamList } from "./types";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

let resetHomeWhenReady = false;

export function resetToHome(): void {
  if (!navigationRef.isReady()) {
    resetHomeWhenReady = true;
    return;
  }

  resetHomeWhenReady = false;
  navigationRef.resetRoot({
    index: 0,
    routes: [
      {
        name: "MainTabs",
        params: { screen: "Home" },
        state: { index: 0, routes: [{ name: "Home" }] },
      },
    ],
  });
}

export function handleNavigationReady(): void {
  if (!resetHomeWhenReady) return;
  setTimeout(() => resetToHome(), 0);
}
