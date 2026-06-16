export type OnboardingStage = "dashboard" | "assets" | "claims" | "completed";

const KEY = "claimpilot-onboarding";

export function getOnboarding(): OnboardingStage {
  if (typeof window === "undefined") return "completed";
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === "assets" || raw === "dashboard" || raw === "claims") return raw;
    return "completed";
  } catch {
    return "completed";
  }
}

export function setOnboarding(stage: OnboardingStage) {
  try {
    localStorage.setItem(KEY, stage);
  } catch {
    // localStorage not available
  }
}

export function clearOnboarding() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // localStorage not available
  }
}
