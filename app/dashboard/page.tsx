"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { t, type Language } from "@/lib/i18n";
import { getLogSummary, listCampaigns, listLeads } from "@/lib/api";
import type { Lead, Occasion } from "@/lib/types";
import {
  PartyPopper, X, Globe, Users, PhoneCall, BarChart2, ChevronRight, AlertCircle,
} from "lucide-react";

const CONGRATS_KEY = "panggil_congrats_shown";

type FunnelStage = { label: string; value: number };

type DashboardMetrics = {
  leads: number;
  campaigns: number;
  logs: number;
  funnel: Record<Occasion, FunnelStage[]>;
};

const FALLBACK_METRICS: DashboardMetrics = {
  leads: 0,
  campaigns: 0,
  logs: 0,
  funnel: {
    telesales: [
      { label: "Leads", value: 0 },
      { label: "Connected", value: 0 },
      { label: "Follow Up", value: 0 },
      { label: "Closing", value: 0 },
    ],
    collection: [
      { label: "Leads", value: 0 },
      { label: "Connected", value: 0 },
      { label: "Follow Up", value: 0 },
      { label: "Promise to Pay", value: 0 },
      { label: "Closed", value: 0 },
    ],
  },
};

const STAGE_HEIGHTS = [200, 162, 126, 96, 72] as const;
const LAST_RIGHT_H = 48;
const FILLS = ["#0d5222", "#12672a", "#1a8a38", "#25a849", "#35c45e"];

function buildFunnel(type: Occasion, leads: Lead[]): FunnelStage[] {
  const total = leads.length;
  const connected = leads.filter((lead) => lead.status === "connected" || lead.status === "follow_up" || lead.status === "closed" || (type === "collection" && lead.status === "promise_to_pay")).length;
  const followUp = leads.filter((lead) => lead.status === "follow_up" || lead.status === "closed" || (type === "collection" && lead.status === "promise_to_pay")).length;

  if (type === "collection") {
    const promiseToPay = leads.filter((lead) => lead.status === "promise_to_pay" || lead.status === "closed").length;
    const closed = leads.filter((lead) => lead.status === "closed").length;
    return [
      { label: "Leads", value: total },
      { label: "Connected", value: connected },
      { label: "Follow Up", value: followUp },
      { label: "Promise to Pay", value: promiseToPay },
      { label: "Closed", value: closed },
    ];
  }

  const closing = leads.filter((lead) => lead.status === "closed").length;
  return [
    { label: "Leads", value: total },
    { label: "Connected", value: connected },
    { label: "Follow Up", value: followUp },
    { label: "Closing", value: closing },
  ];
}

function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const W = 700;
  const H = 260;
  const CY = H / 2;
  const sw = W / stages.length;

  const leftH = (i: number) => STAGE_HEIGHTS[i] ?? STAGE_HEIGHTS[STAGE_HEIGHTS.length - 1];
  const rightH = (i: number) => (i < stages.length - 1 ? (STAGE_HEIGHTS[i + 1] ?? LAST_RIGHT_H) : LAST_RIGHT_H);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 480, height: 220 }} preserveAspectRatio="xMidYMid meet">
        {stages.map((stage, i) => {
          const x1 = i * sw;
          const x2 = (i + 1) * sw;
          const h1 = leftH(i);
          const h2 = rightH(i);
          const gap = i < stages.length - 1 ? 3 : 0;
          const points = [
            `${x1},${CY - h1 / 2}`,
            `${x2 - gap},${CY - h2 / 2}`,
            `${x2 - gap},${CY + h2 / 2}`,
            `${x1},${CY + h1 / 2}`,
          ].join(" ");
          const textX = x1 + sw / 2;
          const conv = i > 0 && stages[i - 1].value > 0 ? `${((stage.value / stages[i - 1].value) * 100).toFixed(0)}%` : null;
          const badgeCX = x1;
          const badgeTY = CY - h1 / 2;

          return (
            <g key={`${stage.label}-${i}`}>
              <polygon points={points} fill={FILLS[i] ?? FILLS[FILLS.length - 1]} />
              <text x={textX} y={CY - 9} textAnchor="middle" fill="white" fontSize="15" fontWeight="800" fontFamily="inherit">
                {stage.value.toLocaleString("id-ID")}
              </text>
              <text x={textX} y={CY + 13} textAnchor="middle" fill="rgba(255,255,255,0.88)" fontSize="10.5" fontWeight="500" fontFamily="inherit">
                {stage.label}
              </text>
              {conv && (
                <g>
                  <rect x={badgeCX - 24} y={badgeTY - 26} width="48" height="20" rx="10" fill="white" stroke="#d1d5db" strokeWidth="1" />
                  <text x={badgeCX} y={badgeTY - 11} textAnchor="middle" fill="#374151" fontSize="10" fontWeight="700" fontFamily="inherit">
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

const QUICK_STEPS = (lang: Language, counts: { leads: number; campaigns: number; logs: number }) => [
  {
    step: "01",
    label: lang === "id" ? "Tambah Leads" : "Add Leads",
    desc: lang === "id" ? "Upload atau tambah leads manual ke platform" : "Upload or manually add leads to the platform",
    count: `${counts.leads.toLocaleString("id-ID")} leads`,
    icon: Users,
    href: "/dashboard/leads",
  },
  {
    step: "02",
    label: lang === "id" ? "Mulai Campaign" : "Start Campaign",
    desc: lang === "id" ? "Buat dan jalankan campaign panggilan AI Anda" : "Create and run your AI calling campaigns",
    count: `${counts.campaigns.toLocaleString("id-ID")} campaigns`,
    icon: PhoneCall,
    href: "/dashboard/campaign",
  },
  {
    step: "03",
    label: lang === "id" ? "Pantau Logs" : "Monitor Logs",
    desc: lang === "id" ? "Lacak hasil dan rekaman setiap panggilan" : "Track results and recordings of every call",
    count: `${counts.logs.toLocaleString("id-ID")} logs`,
    icon: BarChart2,
    href: "/dashboard/logs",
  },
];

export default function DashboardPage() {
  const [lang, setLang] = useState<Language>("id");
  const [showCongrats, setShowCongrats] = useState(false);
  const [userName, setUserName] = useState("");
  const [activeTab, setActiveTab] = useState<Occasion>("telesales");
  const [metrics, setMetrics] = useState<DashboardMetrics>(FALLBACK_METRICS);
  const [usingFallback, setUsingFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      const name = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Pengguna";
      setUserName(name);

      const key = `${CONGRATS_KEY}_${session.user.id}`;
      if (!localStorage.getItem(key)) setShowCongrats(true);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      try {
        const [telesalesLeads, collectionLeads, telesalesCampaigns, collectionCampaigns, logsSummary] = await Promise.all([
          listLeads({ type: "telesales", page: 1, limit: 100, sortBy: "newest" }),
          listLeads({ type: "collection", page: 1, limit: 100, sortBy: "newest" }),
          listCampaigns("telesales", 1, 100),
          listCampaigns("collection", 1, 100),
          getLogSummary(),
        ]);

        if (cancelled) return;

        setMetrics({
          leads: (telesalesLeads.meta?.total ?? telesalesLeads.data.length) + (collectionLeads.meta?.total ?? collectionLeads.data.length),
          campaigns: (telesalesCampaigns.meta?.total ?? telesalesCampaigns.data.length) + (collectionCampaigns.meta?.total ?? collectionCampaigns.data.length),
          logs: logsSummary.totalCalls,
          funnel: {
            telesales: buildFunnel("telesales", telesalesLeads.data),
            collection: buildFunnel("collection", collectionLeads.data),
          },
        });
        setUsingFallback(false);
      } catch (err) {
        if (cancelled) return;
        setUsingFallback(true);
        setError(err instanceof Error ? err.message : "Gagal memuat ringkasan dashboard.");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function closeCongrats() {
    setShowCongrats(false);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      localStorage.setItem(`${CONGRATS_KEY}_${session.user.id}`, "1");
    });
  }

  const steps = useMemo(() => QUICK_STEPS(lang, metrics), [lang, metrics]);
  const stages = metrics.funnel[activeTab];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {showCongrats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
            <button onClick={closeCongrats} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>

            <div className="flex justify-center mb-5">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#12672a] to-[#1d9a40] flex items-center justify-center shadow-xl shadow-green-800/30">
                <PartyPopper className="w-9 h-9 text-white" />
              </div>
            </div>

            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
              {["#12672a", "#fbbf24", "#3b82f6", "#ef4444", "#8b5cf6"].map((color, i) => (
                <div key={i} className="absolute w-2 h-2 rounded-full opacity-70" style={{ backgroundColor: color, top: `${[15, 25, 10, 20, 18][i]}%`, left: `${[10, 80, 45, 20, 70][i]}%` }} />
              ))}
            </div>

            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">{t(lang, "congratsTitle")}</h2>
            <p className="text-gray-500 text-center text-sm leading-relaxed mb-6">{t(lang, "congratsMessage")}</p>
            <button onClick={closeCongrats} className="w-full py-3 px-4 bg-[#12672a] hover:bg-[#0e5222] text-white font-semibold rounded-xl transition-all duration-200 text-sm">
              {t(lang, "congratsClose")}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{lang === "id" ? `Halo, ${userName} 👋` : `Hello, ${userName} 👋`}</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {lang === "id" ? "Selamat datang di dashboard Panggil AI Anda" : "Welcome to your Panggil AI dashboard"}
          </p>
        </div>
        <button onClick={() => setLang(lang === "id" ? "en" : "id")} className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50 transition-colors">
          <Globe className="w-3.5 h-3.5" />
          {t(lang, "switchLang")}
        </button>
      </div>

      {(usingFallback || error) && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Dashboard summary belum punya endpoint backend yang proper, jadi funnel ini dihitung dari sample list read yang tersedia. {error ?? ""}
          </span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-gray-900">{lang === "id" ? "Funnel Leads" : "Leads Funnel"}</h2>
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {(["telesales", "collection"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab ? "bg-white text-[#12672a] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {tab === "telesales" ? "Telesales" : "Collection"}
              </button>
            ))}
          </div>
        </div>

        <FunnelChart stages={stages} />
        <p className="mt-3 text-xs text-gray-400">
          Funnel ini dihitung dari <strong>GET /leads</strong> per tipe. Belum ada endpoint summary dedicated, jadi kalau backend cuma kirim page pertama maka insight ini juga ikut kepotong.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-5">{lang === "id" ? "Mulai Sekarang" : "Get Started"}</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((step, i) => (
            <Link key={i} href={step.href} className="group flex flex-col gap-3 p-5 rounded-xl border border-gray-200 hover:border-[#12672a] hover:bg-[#12672a]/5 transition-all duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#12672a] bg-[#12672a]/10 px-2 py-0.5 rounded-full tracking-wide">STEP {step.step}</span>
                <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-[#12672a]/10 flex items-center justify-center transition-colors">
                  <step.icon className="w-4 h-4 text-gray-400 group-hover:text-[#12672a] transition-colors" />
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-[#12672a] transition-colors">{step.label}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{step.desc}</p>
              </div>

              <div className="flex items-center justify-between mt-auto pt-1">
                <span className="text-xs font-bold text-gray-500 tabular-nums">{step.count}</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#12672a] transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
