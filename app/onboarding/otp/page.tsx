"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase, setOnboardingStep, getOnboardingData } from "@/lib/supabase";
import { t, type Language } from "@/lib/i18n";
import OnboardingLayout from "@/components/OnboardingLayout";
import { sendOtp, verifyOtp } from "@/lib/api";
import { ShieldCheck, RefreshCw, ChevronRight, ChevronLeft, AlertCircle } from "lucide-react";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function OtpPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>("id");
  const [userId, setUserId] = useState<string | null>(null);
  const [picMobile, setPicMobile] = useState("");

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState("");
  const [usingFallback, setUsingFallback] = useState(false);

  // Auth guard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
        return;
      }
      setUserId(session.user.id);
      const saved = getOnboardingData(session.user.id);
      if (saved.picMobile) setPicMobile(saved.picMobile as string);
    });
  }, [router]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      const digit = value.replace(/\D/g, "").slice(-1);
      const newOtp = [...otp];
      newOtp[index] = digit;
      setOtp(newOtp);

      if (digit && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [otp]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        if (otp[index]) {
          const newOtp = [...otp];
          newOtp[index] = "";
          setOtp(newOtp);
        } else if (index > 0) {
          inputRefs.current[index - 1]?.focus();
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [otp]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
      const newOtp = Array(OTP_LENGTH).fill("");
      pasted.split("").forEach((digit, i) => {
        newOtp[i] = digit;
      });
      setOtp(newOtp);
      const lastFilled = Math.min(pasted.length, OTP_LENGTH - 1);
      inputRefs.current[lastFilled]?.focus();
    },
    []
  );

  async function handleVerify() {
    if (!userId) return;
    const code = otp.join("");
    if (code.length < OTP_LENGTH) return;

    setLoading(true);
    setError("");

    try {
      const result = await verifyOtp({
        mobile: picMobile.replace(/\D/g, ""),
        otp: code,
      });

      if (!result.verified) {
        throw new Error("Kode OTP tidak valid.");
      }

      await supabase.auth.updateUser({ data: { onboarding_complete: result.onboardingComplete } });
      setUsingFallback(false);
      setOnboardingStep(userId, "complete");
      router.push("/dashboard");
    } catch (err) {
      setUsingFallback(true);
      setShake(true);
      setTimeout(() => setShake(false), 350);
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      setError(err instanceof Error ? err.message : "Gagal memverifikasi OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendLoading(true);
    setError("");

    try {
      const response = await sendOtp({ mobile: picMobile.replace(/\D/g, "") });
      setCountdown(response.expiresIn || RESEND_COOLDOWN);
      setCanResend(false);
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      setUsingFallback(false);
    } catch (err) {
      setUsingFallback(true);
      setError(err instanceof Error ? err.message : "Gagal mengirim ulang OTP.");
    } finally {
      setResendLoading(false);
    }
  }

  const maskedPhone = picMobile
    ? picMobile.replace(/(\d{4})(\d+)(\d{4})$/, "$1-****-$3")
    : "****";

  const isFilled = otp.every((d) => d !== "");

  return (
    <OnboardingLayout
      currentStep={2}
      totalSteps={2}
      lang={lang}
      onLangToggle={() => setLang(lang === "id" ? "en" : "id")}
    >
      <div>
        {(usingFallback || error) && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              OTP sekarang mencoba endpoint backend sungguhan. Kalau gagal, itu bukan UX issue lagi—itu backend onboarding yang belum siap. {error}
            </span>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/20 mb-5">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t(lang, "otpTitle")}</h1>
          <p className="text-gray-500 text-sm">
            {t(lang, "otpSubtitle")}
            {picMobile && (
              <span className="ml-1 font-medium text-gray-700">{maskedPhone}</span>
            )}
          </p>
        </div>

        {/* OTP Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            {t(lang, "otpLabel")}
          </label>

          <div
            className={`flex gap-3 justify-center transition-all duration-200 ${shake ? "animate-[shake_0.3s_ease-in-out]" : ""}`}
          >
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="otp-input"
                autoFocus={index === 0}
              />
            ))}
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">{t(lang, "otpNote")}</p>
        </div>

        {/* Resend */}
        <div className="text-center mb-8">
          {canResend ? (
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? "animate-spin" : ""}`} />
              {t(lang, "otpResend")}
            </button>
          ) : (
            <p className="text-sm text-gray-400">
              {t(lang, "otpResendIn")}{" "}
              <span className="font-semibold text-gray-600 tabular-nums">{countdown}</span>{" "}
              {t(lang, "otpSeconds")}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/onboarding/company-profile")}
            className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            {t(lang, "back")}
          </button>

          <button
            onClick={handleVerify}
            disabled={!isFilled || loading}
            className="flex-1 py-3 px-4 bg-primary hover:bg-primary-dark disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 font-semibold rounded-xl transition-all duration-200 text-sm shadow-md shadow-primary/20 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t(lang, "otpVerifying")}
              </>
            ) : (
              <>
                {t(lang, "otpVerify")}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
