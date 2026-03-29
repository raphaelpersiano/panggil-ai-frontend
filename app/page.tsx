"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProfileSafe } from "@/lib/api";
import { supabase, getOnboardingStep } from "@/lib/supabase";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const profile = await getProfileSafe();
      if (profile?.onboardingComplete) {
        router.replace("/dashboard");
        return;
      }

      if (session.user.user_metadata?.onboarding_complete === true) {
        router.replace("/dashboard");
        return;
      }

      const step = getOnboardingStep(session.user.id);
      if (step === "otp") {
        router.replace("/onboarding/otp");
      } else {
        router.replace("/onboarding/company-profile");
      }
    }

    checkSession();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Memuat...</p>
      </div>
    </div>
  );
}
