"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, getOnboardingStep } from "@/lib/supabase";
import { t, type Language } from "@/lib/i18n";
import Link from "next/link";
import {
  Phone, CheckCircle, TrendingUp, Users, Zap,
  Eye, EyeOff, ChevronRight, Globe
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>("id");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const testimonials = [
    {
      id: "id",
      text: "\"Panggil AI membantu kami meningkatkan collection rate sebesar 45% dalam 3 bulan pertama.\"",
      en: "\"Panggil AI helped us increase collection rate by 45% in the first 3 months.\"",
      author: "Budi Santoso",
      role: "CFO, PT Finansial Maju",
    },
    {
      id: "id",
      text: "\"Tim telesales kami kini fokus pada konversi, bukan panggilan manual yang melelahkan.\"",
      en: "\"Our telesales team now focuses on conversion, not exhausting manual calls.\"",
      author: "Sari Wijaya",
      role: "VP Sales, TechCorp Indonesia",
    },
    {
      id: "id",
      text: "\"ROI-nya luar biasa. Dalam 2 bulan sudah balik modal dari biaya call center.\"",
      en: "\"The ROI is incredible. Within 2 months we recouped our call center costs.\"",
      author: "Dimas Pratama",
      role: "Direktur Operasional, Kredit Prima",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      // Existing users who completed onboarding go straight to dashboard
      if (session.user.user_metadata?.onboarding_complete === true) {
        router.replace("/dashboard");
        return;
      }
      // New / mid-onboarding users — resume from last step
      const step = getOnboardingStep(session.user.id);
      if (!step || step === "company-profile") {
        router.replace("/onboarding/company-profile");
      } else if (step === "otp") {
        router.replace("/onboarding/otp");
      } else {
        router.replace("/dashboard");
      }
    });
  }, [router]);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      // Existing user who already completed onboarding → dashboard directly
      if (data.session.user.user_metadata?.onboarding_complete === true) {
        router.replace("/dashboard");
        return;
      }
      // Resume mid-onboarding
      const step = getOnboardingStep(data.session.user.id);
      if (!step || step === "company-profile") {
        router.replace("/onboarding/company-profile");
      } else if (step === "otp") {
        router.replace("/onboarding/otp");
      } else {
        router.replace("/dashboard");
      }
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  }

  const features = [
    { icon: Zap, text: lang === "id" ? "Ribuan panggilan otomatis dalam hitungan menit" : "Thousands of automated calls in minutes" },
    { icon: CheckCircle, text: lang === "id" ? "AI percakapan natural berbahasa Indonesia" : "Natural AI conversation in Bahasa Indonesia" },
    { icon: TrendingUp, text: lang === "id" ? "Laporan real-time & analitik mendalam" : "Real-time reports & deep analytics" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left — Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 py-12 bg-white">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-md">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Panggil AI</span>
            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === "id" ? "en" : "id")}
              className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-gray-50"
            >
              <Globe className="w-3.5 h-3.5" />
              {t(lang, "switchLang")}
            </button>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t(lang, "loginTitle")}</h1>
          <p className="text-gray-500 mb-8">{t(lang, "loginSubtitle")}</p>

          {/* Error message */}
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Google Auth */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-xl text-gray-700 font-medium text-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 mb-5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {t(lang, "loginWithGoogle")}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">{t(lang, "orDivider")}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t(lang, "emailLabel")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t(lang, "emailPlaceholder")}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-gray-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  {t(lang, "passwordLabel")}
                </label>
                <button type="button" className="text-xs text-primary hover:underline">
                  {t(lang, "forgotPassword")}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t(lang, "passwordPlaceholder")}
                  required
                  className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all duration-200 text-sm shadow-md shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t(lang, "loginLoading")}
                </>
              ) : (
                <>
                  {t(lang, "loginButton")}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {t(lang, "noAccount")}{" "}
            <Link href="/register" className="text-[#12672a] font-medium hover:underline">
              {t(lang, "registerLink")}
            </Link>
          </p>
        </div>
      </div>

      {/* Right — Nudging Panel */}
      <div className="hidden lg:flex flex-col w-[52%] bg-gradient-hero relative overflow-hidden p-12 justify-between">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/3 blur-3xl" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        {/* Top — Logo & Headline */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">Panggil AI</span>
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-3">
            {t(lang, "nudgeHeadline")}
          </h2>
          <p className="text-white/70 text-lg mb-10">
            {t(lang, "nudgeSubheadline")}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { value: t(lang, "nudgeStat1Value"), label: t(lang, "nudgeStat1Label") },
              { value: t(lang, "nudgeStat2Value"), label: t(lang, "nudgeStat2Label") },
              { value: t(lang, "nudgeStat3Value"), label: t(lang, "nudgeStat3Label") },
            ].map((stat, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15">
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-white/65 text-xs leading-tight">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="space-y-3">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <feature.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white/85 text-sm">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom — Testimonials */}
        <div className="relative z-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/15">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-yellow-400 text-sm">★</span>
              ))}
            </div>
            <p className="text-white/90 text-sm leading-relaxed mb-4 min-h-[48px] transition-all duration-500">
              {lang === "id"
                ? testimonials[activeTestimonial].text
                : testimonials[activeTestimonial].en}
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold text-sm">{testimonials[activeTestimonial].author}</p>
                <p className="text-white/60 text-xs">{testimonials[activeTestimonial].role}</p>
              </div>
              <div className="flex gap-1.5">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTestimonial(i)}
                    className={`rounded-full transition-all duration-300 ${i === activeTestimonial ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/40"}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-3 mt-4">
            <div className="flex -space-x-2">
              {["#e74c3c", "#3498db", "#2ecc71", "#f39c12"].map((color, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: color }}
                >
                  {["B", "S", "D", "R"][i]}
                </div>
              ))}
            </div>
            <p className="text-white/70 text-xs">
              <span className="text-white font-semibold">500+</span>{" "}
              {lang === "id" ? "perusahaan Indonesia telah bergabung" : "Indonesian companies have joined"}
            </p>
            <Users className="w-4 h-4 text-white/50 ml-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
