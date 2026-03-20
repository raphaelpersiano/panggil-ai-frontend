"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { t, type Language } from "@/lib/i18n";
import {
  PartyPopper, X, Phone, TrendingUp, Users, Clock,
  Globe, PhoneCall, PhoneOff, CheckCircle2
} from "lucide-react";

const CONGRATS_KEY = "panggil_congrats_shown";

export default function DashboardPage() {
  const [lang, setLang] = useState<Language>("id");
  const [showCongrats, setShowCongrats] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;

      const name =
        session.user.user_metadata?.full_name ||
        session.user.email?.split("@")[0] ||
        "Pengguna";
      setUserName(name);

      const key = `${CONGRATS_KEY}_${session.user.id}`;
      if (!localStorage.getItem(key)) {
        setShowCongrats(true);
      }
    });
  }, []);

  function closeCongrats() {
    setShowCongrats(false);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      localStorage.setItem(`${CONGRATS_KEY}_${session.user.id}`, "1");
    });
  }

  // Dummy stats
  const stats = [
    {
      label: lang === "id" ? "Total Panggilan" : "Total Calls",
      value: "0",
      icon: Phone,
      color: "from-primary to-primary-light",
      change: null,
    },
    {
      label: lang === "id" ? "Panggilan Sukses" : "Successful Calls",
      value: "0",
      icon: CheckCircle2,
      color: "from-blue-500 to-blue-600",
      change: null,
    },
    {
      label: lang === "id" ? "Leads Aktif" : "Active Leads",
      value: "0",
      icon: Users,
      color: "from-purple-500 to-purple-600",
      change: null,
    },
    {
      label: lang === "id" ? "Durasi Rata-rata" : "Avg Duration",
      value: "—",
      icon: Clock,
      color: "from-orange-500 to-orange-600",
      change: null,
    },
  ];

  const quickActions = [
    {
      label: lang === "id" ? "Mulai Campaign" : "Start Campaign",
      icon: PhoneCall,
      desc: lang === "id" ? "Buat kampanye panggilan baru" : "Create a new calling campaign",
    },
    {
      label: lang === "id" ? "Tambah Leads" : "Add Leads",
      icon: Users,
      desc: lang === "id" ? "Upload atau tambah leads manual" : "Upload or add leads manually",
    },
    {
      label: lang === "id" ? "Konfigurasi Agent" : "Configure Agent",
      icon: TrendingUp,
      desc: lang === "id" ? "Sesuaikan skrip AI Anda" : "Customize your AI script",
    },
  ];

  return (
    <div className="p-8">
      {/* Congratulations Modal */}
      {showCongrats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative animate-slide-up">
            {/* Close button */}
            <button
              onClick={closeCongrats}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-xl shadow-primary/30">
                <PartyPopper className="w-9 h-9 text-white" />
              </div>
            </div>

            {/* Confetti dots */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
              {["#12672a", "#fbbf24", "#3b82f6", "#ef4444", "#8b5cf6"].map((color, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full opacity-70"
                  style={{
                    backgroundColor: color,
                    top: `${[15, 25, 10, 20, 18][i]}%`,
                    left: `${[10, 80, 45, 20, 70][i]}%`,
                    animation: `pulse-slow ${1.5 + i * 0.3}s ease-in-out infinite`,
                  }}
                />
              ))}
            </div>

            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              {t(lang, "congratsTitle")}
            </h2>
            <p className="text-gray-500 text-center text-sm leading-relaxed mb-6">
              {t(lang, "congratsMessage")}
            </p>

            <button
              onClick={closeCongrats}
              className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all duration-200 text-sm shadow-md shadow-primary/20"
            >
              {t(lang, "congratsClose")}
            </button>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {lang === "id" ? `Halo, ${userName} 👋` : `Hello, ${userName} 👋`}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {lang === "id"
              ? "Selamat datang di dashboard Panggil AI Anda"
              : "Welcome to your Panggil AI dashboard"}
          </p>
        </div>

        <button
          onClick={() => setLang(lang === "id" ? "en" : "id")}
          className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <Globe className="w-3.5 h-3.5" />
          {t(lang, "switchLang")}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md`}>
                <stat.icon className="w-4.5 h-4.5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">
          {lang === "id" ? "Mulai Sekarang" : "Get Started"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, i) => (
            <button
              key={i}
              className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all duration-150 text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors">
                <action.icon className="w-4.5 h-4.5 text-gray-500 group-hover:text-primary transition-colors" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 group-hover:text-primary transition-colors">
                  {action.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{action.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Empty state banner */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-6 flex items-center gap-5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
          <PhoneOff className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-primary mb-1">
            {lang === "id" ? "Belum ada campaign aktif" : "No active campaigns"}
          </h3>
          <p className="text-sm text-gray-500">
            {lang === "id"
              ? "Buat campaign pertama Anda dan mulai mengotomatisasi panggilan bisnis."
              : "Create your first campaign and start automating business calls."}
          </p>
        </div>
        <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-xl transition-colors shrink-0 shadow-md shadow-primary/20">
          {lang === "id" ? "Buat Campaign" : "Create Campaign"}
        </button>
      </div>
    </div>
  );
}
