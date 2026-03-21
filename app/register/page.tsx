"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, setOnboardingStep } from "@/lib/supabase";
import { t, type Language } from "@/lib/i18n";
import {
  Phone, Eye, EyeOff, ChevronRight, Globe,
  CheckCircle, Zap, TrendingUp, Mail, ArrowRight,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>("id");
  const [email,            setEmail]            = useState("");
  const [password,         setPassword]         = useState("");
  const [confirmPassword,  setConfirmPassword]  = useState("");
  const [showPassword,     setShowPassword]     = useState(false);
  const [showConfirm,      setShowConfirm]      = useState(false);
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState("");
  const [emailSent,        setEmailSent]        = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const done = session.user.user_metadata?.onboarding_complete === true;
        router.replace(done ? "/dashboard" : "/onboarding/company-profile");
      }
    });
  }, [router]);

  const passwordError =
    password.length > 0 && password.length < 8
      ? t(lang, "passwordMinLength")
      : password.length >= 8 && confirmPassword.length > 0 && password !== confirmPassword
      ? t(lang, "passwordMismatch")
      : "";

  const isValid =
    email.trim().length > 0 &&
    password.length >= 8 &&
    password === confirmPassword;

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      // Email confirmation disabled — user is immediately logged in
      setOnboardingStep(data.session.user.id, "company-profile");
      router.replace("/onboarding/company-profile");
    } else if (data.user) {
      // Email confirmation required — prompt user to check inbox
      setEmailSent(true);
      setLoading(false);
    }
  }

  async function handleGoogleRegister() {
    setLoading(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  }

  // ── Email sent confirmation screen ──
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-[#12672a]/10 flex items-center justify-center mx-auto mb-5">
            <Mail className="w-8 h-8 text-[#12672a]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t(lang, "emailConfirmTitle")}</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">{t(lang, "emailConfirmMessage")}</p>
          <p className="text-xs text-gray-400 mb-6 font-medium">{email}</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#12672a] text-white text-sm font-semibold rounded-xl hover:bg-[#0e5222] transition-colors"
          >
            {t(lang, "loginLink")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const steps = [
    { num: "01", label: lang === "id" ? "Profil Perusahaan" : "Company Profile" },
    { num: "02", label: lang === "id" ? "Verifikasi OTP"    : "OTP Verification" },
    { num: "03", label: lang === "id" ? "Mulai Gunakan!"    : "Start Using!"     },
  ];

  const features = [
    { icon: Zap,          text: lang === "id" ? "Ribuan panggilan otomatis dalam hitungan menit"  : "Thousands of automated calls in minutes"     },
    { icon: CheckCircle,  text: lang === "id" ? "AI percakapan natural berbahasa Indonesia"        : "Natural AI conversation in Bahasa Indonesia"  },
    { icon: TrendingUp,   text: lang === "id" ? "Laporan real-time & analitik mendalam"            : "Real-time reports & deep analytics"          },
  ];

  return (
    <div className="min-h-screen flex">
      {/* ── Left — Form ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 py-12 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Logo + lang */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#12672a] to-[#0d5222] flex items-center justify-center shadow-md">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Panggil AI</span>
            <button
              onClick={() => setLang(lang === "id" ? "en" : "id")}
              className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#12672a] transition-colors px-2 py-1 rounded-lg hover:bg-gray-50"
            >
              <Globe className="w-3.5 h-3.5" />
              {t(lang, "switchLang")}
            </button>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-1">{t(lang, "registerTitle")}</h1>
          <p className="text-gray-500 mb-7 text-sm">{t(lang, "registerSubtitle")}</p>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Google */}
          <button
            onClick={handleGoogleRegister}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-xl text-gray-700 font-medium text-sm hover:bg-gray-50 hover:border-gray-300 transition-all mb-5 disabled:opacity-60"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {t(lang, "registerWithGoogle")}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">{t(lang, "orDivider")}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t(lang, "emailLabel")}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t(lang, "emailPlaceholder")}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#12672a]/30 focus:border-[#12672a] transition-all placeholder:text-gray-400"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t(lang, "passwordLabel")}</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t(lang, "passwordPlaceholder")}
                  required
                  className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#12672a]/30 focus:border-[#12672a] transition-all placeholder:text-gray-400"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t(lang, "confirmPasswordLabel")}</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder={t(lang, "confirmPasswordPlaceholder")}
                  required
                  className={`w-full px-4 py-3 pr-11 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 ${
                    passwordError
                      ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                      : "border-gray-200 focus:ring-[#12672a]/30 focus:border-[#12672a]"
                  }`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="mt-1.5 text-xs text-red-500">{passwordError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!isValid || loading}
              className="w-full py-3 px-4 bg-[#12672a] hover:bg-[#0e5222] disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 font-semibold rounded-xl transition-all text-sm shadow-md shadow-green-800/20 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t(lang, "registerLoading")}
                </>
              ) : (
                <>
                  {t(lang, "registerButton")}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {t(lang, "hasAccount")}{" "}
            <Link href="/login" className="text-[#12672a] font-medium hover:underline">
              {t(lang, "loginLink")}
            </Link>
          </p>
        </div>
      </div>

      {/* ── Right — Nudging Panel ── */}
      <div className="hidden lg:flex flex-col w-[50%] bg-gradient-to-br from-[#12672a] via-[#1a8a38] to-[#0d5222] relative overflow-hidden p-12 justify-between">
        {/* Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
          <div
            className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "32px 32px" }}
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">Panggil AI</span>
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-3">
            {lang === "id" ? "Otomatisasi Dimulai dari Sini" : "Automation Starts Here"}
          </h2>
          <p className="text-white/70 text-lg mb-10">
            {lang === "id" ? "Daftar gratis dan mulai dalam 5 menit" : "Sign up free and start in 5 minutes"}
          </p>

          {/* Onboarding steps preview */}
          <div className="mb-10">
            <p className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-4">
              {lang === "id" ? "Setelah daftar, 3 langkah mudah:" : "After signing up, 3 easy steps:"}
            </p>
            <div className="space-y-3">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-xs">{s.num}</span>
                  </div>
                  <span className="text-white/85 text-sm font-medium">{s.label}</span>
                  {i < steps.length - 1 && (
                    <div className="ml-auto">
                      <ArrowRight className="w-3.5 h-3.5 text-white/30" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <f.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white/85 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom — trust indicators */}
        <div className="relative z-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/15">
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { val: "500+",  label: lang === "id" ? "Klien B2B"       : "B2B Clients"      },
                { val: "70%",   label: lang === "id" ? "Hemat Biaya"     : "Cost Savings"     },
                { val: "10×",   label: lang === "id" ? "Lebih Cepat"     : "Faster"           },
              ].map((s, i) => (
                <div key={i}>
                  <div className="text-2xl font-bold text-white">{s.val}</div>
                  <div className="text-white/60 text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-white/50 text-xs text-center mt-3">
            {lang === "id" ? "Tidak perlu kartu kredit · Gratis 14 hari" : "No credit card · 14 days free"}
          </p>
        </div>
      </div>
    </div>
  );
}
