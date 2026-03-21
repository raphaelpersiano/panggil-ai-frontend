"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { t, type Language } from "@/lib/i18n";
import {
  PartyPopper, X, Globe, Users, PhoneCall, BarChart2, ChevronRight,
} from "lucide-react";

const CONGRATS_KEY = "panggil_congrats_shown";

/* ─── Funnel data ─────────────────────────────────────────── */
const FUNNEL_DATA = {
  telesales: [
    { label: "Leads",           value: 1_240 },
    { label: "Connected",       value:   876 },
    { label: "Follow Up",       value:   512 },
    { label: "Promise to Pay",  value:   203 },
    { label: "Closing",         value:    87 },
  ],
  collection: [
    { label: "Leads",           value:   940 },
    { label: "Connected",       value:   621 },
    { label: "Follow Up",       value:   388 },
    { label: "Promise to Pay",  value:   156 },
    { label: "Closing",         value:    54 },
  ],
};

/* ─── Funnel SVG (trapezoid shape) ───────────────────────── */
function FunnelChart({ stages }: { stages: { label: string; value: number }[] }) {
  const W = 600;
  const H = 160;
  const CY = H / 2;
  const maxVal = stages[0].value;
  const stageW = W / stages.length; // 120 each

  // Left-edge height per stage (proportional to value, min 20)
  const heights = stages.map((s) =>
    Math.max((s.value / maxVal) * (H - 16), 20)
  );

  // Right-edge height: equals left of next stage; last stage tapers to ~40%
  const rightH = (i: number) =>
    i < stages.length - 1 ? heights[i + 1] : Math.max(heights[stages.length - 1] * 0.42, 12);

  const FILLS = ["#0d5222", "#12672a", "#1a8a38", "#25a849", "#35c45e"];

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ minWidth: 340, height: 160 }}
        preserveAspectRatio="xMidYMid meet"
      >
        {stages.map((stage, i) => {
          const x1 = i * stageW;
          const x2 = (i + 1) * stageW;
          const h1 = heights[i];
          const h2 = rightH(i);
          const gap = i < stages.length - 1 ? 2 : 0; // 2px gap between stages

          const points = [
            `${x1},${CY - h1 / 2}`,
            `${x2 - gap},${CY - h2 / 2}`,
            `${x2 - gap},${CY + h2 / 2}`,
            `${x1},${CY + h1 / 2}`,
          ].join(" ");

          const textX = x1 + (x2 - x1) / 2;

          // Conversion rate from previous stage
          const conv =
            i > 0
              ? `${((stage.value / stages[i - 1].value) * 100).toFixed(0)}%`
              : null;

          // Badge sits just above the junction (right edge of this trapezoid)
          const badgeX = x2 - gap;
          const badgeY = CY - h2 / 2;

          return (
            <g key={i}>
              {/* Trapezoid */}
              <polygon points={points} fill={FILLS[i]} />

              {/* Value label */}
              <text
                x={textX}
                y={CY - 7}
                textAnchor="middle"
                fill="white"
                fontSize="13"
                fontWeight="700"
              >
                {stage.value.toLocaleString("id-ID")}
              </text>

              {/* Stage name */}
              <text
                x={textX}
                y={CY + 11}
                textAnchor="middle"
                fill="rgba(255,255,255,0.82)"
                fontSize="9.5"
                fontWeight="500"
              >
                {stage.label}
              </text>

              {/* Conversion badge at junction — shown on stages 1–4 */}
              {conv && i < stages.length && (
                <g>
                  <rect
                    x={badgeX - 22}
                    y={badgeY - 20}
                    width="44"
                    height="16"
                    rx="8"
                    fill="white"
                    stroke="#d1d5db"
                    strokeWidth="1"
                  />
                  <text
                    x={badgeX}
                    y={badgeY - 8}
                    textAnchor="middle"
                    fill="#374151"
                    fontSize="9"
                    fontWeight="700"
                  >
                    {conv}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─── Quick-start steps ───────────────────────────────────── */
const QUICK_STEPS = (lang: Language) => [
  {
    step: "01",
    label: lang === "id" ? "Tambah Leads"  : "Add Leads",
    desc:  lang === "id" ? "Upload atau tambah leads manual ke platform" : "Upload or manually add leads to the platform",
    count: "0 leads",
    icon:  Users,
    href:  "/dashboard/leads",
  },
  {
    step: "02",
    label: lang === "id" ? "Mulai Campaign"  : "Start Campaign",
    desc:  lang === "id" ? "Buat kampanye panggilan AI pertama Anda"     : "Create your first AI calling campaign",
    count: "0 campaigns",
    icon:  PhoneCall,
    href:  "/dashboard/campaign",
  },
  {
    step: "03",
    label: lang === "id" ? "Pantau Logs"   : "Monitor Logs",
    desc:  lang === "id" ? "Lacak hasil dan rekaman setiap panggilan"    : "Track results and recordings of every call",
    count: "0 logs",
    icon:  BarChart2,
    href:  "/dashboard/logs",
  },
];

/* ─── Page ────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [lang,         setLang]         = useState<Language>("id");
  const [showCongrats, setShowCongrats] = useState(false);
  const [userName,     setUserName]     = useState("");
  const [activeTab,    setActiveTab]    = useState<"telesales" | "collection">("telesales");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      const name =
        session.user.user_metadata?.full_name ||
        session.user.email?.split("@")[0] ||
        "Pengguna";
      setUserName(name);

      const key = `${CONGRATS_KEY}_${session.user.id}`;
      if (!localStorage.getItem(key)) setShowCongrats(true);
    });
  }, []);

  function closeCongrats() {
    setShowCongrats(false);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      localStorage.setItem(`${CONGRATS_KEY}_${session.user.id}`, "1");
    });
  }

  const steps = QUICK_STEPS(lang);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* ── Congratulations Modal ── */}
      {showCongrats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
            <button
              onClick={closeCongrats}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>

            <div className="flex justify-center mb-5">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#12672a] to-[#1d9a40] flex items-center justify-center shadow-xl shadow-green-800/30">
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
                    top:  `${[15, 25, 10, 20, 18][i]}%`,
                    left: `${[10, 80, 45, 20, 70][i]}%`,
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
              className="w-full py-3 px-4 bg-[#12672a] hover:bg-[#0e5222] text-white font-semibold rounded-xl transition-all duration-200 text-sm"
            >
              {t(lang, "congratsClose")}
            </button>
          </div>
        </div>
      )}

      {/* ── Greeting ── */}
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

      {/* ── Funnel Section ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        {/* Header + Tabs */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-gray-900">
            {lang === "id" ? "Funnel Leads" : "Leads Funnel"}
          </h2>
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {(["telesales", "collection"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-white text-[#12672a] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "telesales" ? "Telesales" : "Collection"}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Funnel */}
        <FunnelChart stages={FUNNEL_DATA[activeTab]} />
      </div>

      {/* ── Quick Start ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-5">
          {lang === "id" ? "Mulai Sekarang" : "Get Started"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((step, i) => (
            <a
              key={i}
              href={step.href}
              className="group flex flex-col gap-3 p-5 rounded-xl border border-gray-200 hover:border-[#12672a] hover:bg-[#12672a]/5 transition-all duration-150"
            >
              {/* Step badge + icon */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#12672a] bg-[#12672a]/10 px-2 py-0.5 rounded-full tracking-wide">
                  STEP {step.step}
                </span>
                <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-[#12672a]/10 flex items-center justify-center transition-colors">
                  <step.icon className="w-4 h-4 text-gray-400 group-hover:text-[#12672a] transition-colors" />
                </div>
              </div>

              {/* Label + desc */}
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-[#12672a] transition-colors">
                  {step.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{step.desc}</p>
              </div>

              {/* Count + arrow */}
              <div className="flex items-center justify-between mt-auto pt-1">
                <span className="text-xs font-bold text-gray-500 tabular-nums">{step.count}</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#12672a] transition-colors" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
