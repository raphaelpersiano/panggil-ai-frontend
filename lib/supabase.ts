import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type OnboardingStep = "company-profile" | "otp" | "complete";

export const ONBOARDING_STEP_KEY = "panggil_onboarding_step";
export const ONBOARDING_DATA_KEY = "panggil_onboarding_data";

export function getOnboardingStep(userId: string): OnboardingStep | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(`${ONBOARDING_STEP_KEY}_${userId}`);
  return (raw as OnboardingStep) ?? null;
}

export function setOnboardingStep(userId: string, step: OnboardingStep) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${ONBOARDING_STEP_KEY}_${userId}`, step);
}

export function getOnboardingData(userId: string): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(`${ONBOARDING_DATA_KEY}_${userId}`);
  return raw ? JSON.parse(raw) : {};
}

export function setOnboardingData(userId: string, data: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const existing = getOnboardingData(userId);
  localStorage.setItem(
    `${ONBOARDING_DATA_KEY}_${userId}`,
    JSON.stringify({ ...existing, ...data })
  );
}
