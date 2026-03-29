"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, setOnboardingStep, setOnboardingData, getOnboardingData } from "@/lib/supabase";
import { t, type Language } from "@/lib/i18n";
import OnboardingLayout from "@/components/OnboardingLayout";
import { sendOtp, updateProfile } from "@/lib/api";
import { Building2, User, Phone, Briefcase, ChevronRight, AlertCircle } from "lucide-react";

type Occasion = "telesales" | "collection";

export default function CompanyProfilePage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>("id");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usingFallback, setUsingFallback] = useState(false);

  const [picName, setPicName] = useState("");
  const [picMobile, setPicMobile] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [occasions, setOccasions] = useState<Occasion[]>([]);

  // Auth guard + prefill saved data
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
        return;
      }
      setUserId(session.user.id);

      const saved = getOnboardingData(session.user.id);
      if (saved.picName) setPicName(saved.picName as string);
      if (saved.picMobile) setPicMobile(saved.picMobile as string);
      if (saved.companyName) setCompanyName(saved.companyName as string);
      if (saved.occasions) setOccasions(saved.occasions as Occasion[]);
    });
  }, [router]);

  function toggleOccasion(o: Occasion) {
    setOccasions((prev) =>
      prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]
    );
  }

  function formatMobile(value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 4) return digits;
    if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    if (occasions.length === 0) return;

    setLoading(true);
    setError("");

    const normalizedMobile = picMobile.replace(/\D/g, "");
    const payload = {
      picName: picName.trim(),
      picMobile: normalizedMobile,
      companyName: companyName.trim(),
      occasions,
    };

    setOnboardingData(userId, payload);

    try {
      await updateProfile(payload);
      await sendOtp({ mobile: normalizedMobile });
      setUsingFallback(false);
      setOnboardingStep(userId, "otp");
      router.push("/onboarding/otp");
    } catch (err) {
      setUsingFallback(true);
      setError(err instanceof Error ? err.message : "Gagal menyimpan profil perusahaan.");
    } finally {
      setLoading(false);
    }
  }

  const isValid =
    picName.trim().length > 0 &&
    picMobile.replace(/\D/g, "").length >= 10 &&
    companyName.trim().length > 0 &&
    occasions.length > 0;

  return (
    <OnboardingLayout
      currentStep={1}
      totalSteps={2}
      lang={lang}
      onLangToggle={() => setLang(lang === "id" ? "en" : "id")}
    >
      <div>
        {(usingFallback || error) && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Onboarding backend belum rapi. Profil perusahaan sekarang mencoba simpan ke backend dulu sebelum OTP dikirim. {error}
            </span>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/20 mb-5">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t(lang, "companyProfileTitle")}
          </h1>
          <p className="text-gray-500 text-sm">{t(lang, "companyProfileSubtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* PIC Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t(lang, "picNameLabel")}
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={picName}
                onChange={(e) => setPicName(e.target.value)}
                placeholder={t(lang, "picNamePlaceholder")}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* PIC Mobile */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t(lang, "picMobileLabel")}
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                value={picMobile}
                onChange={(e) => setPicMobile(formatMobile(e.target.value))}
                placeholder={t(lang, "picMobilePlaceholder")}
                required
                maxLength={14}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Company Legal Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t(lang, "companyNameLabel")}
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Building2 className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={t(lang, "companyNamePlaceholder")}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Occasion Checkboxes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t(lang, "occasionLabel")}
            </label>
            <p className="text-xs text-gray-400 mb-3">{t(lang, "occasionHint")}</p>
            <div className="grid grid-cols-2 gap-3">
              {(["telesales", "collection"] as Occasion[]).map((o) => {
                const checked = occasions.includes(o);
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => toggleOccasion(o)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all duration-200 text-left ${
                      checked
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                        checked ? "border-primary bg-primary" : "border-gray-300"
                      }`}
                    >
                      {checked && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      {o === "telesales"
                        ? t(lang, "occasionTelesales")
                        : t(lang, "occasionCollection")}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!isValid || loading}
              className="w-full py-3.5 px-4 bg-primary hover:bg-primary-dark disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 font-semibold rounded-xl transition-all duration-200 text-sm shadow-md shadow-primary/20 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t(lang, "saving")}
                </>
              ) : (
                <>
                  {t(lang, "next")}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </OnboardingLayout>
  );
}
