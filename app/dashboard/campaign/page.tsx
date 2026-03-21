"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Megaphone, Plus, Play, Pause, Trash2,
  Calendar, Users, Clock, CheckCircle2,
  AlertCircle, FileEdit, BarChart2,
} from "lucide-react";

/* ─── Types ───────────────────────────────────────────────── */
type CampaignStatus = "draft" | "scheduled" | "active" | "paused" | "completed";
type CampaignTab = "telesales" | "collection";

interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  schedule: string;
  endDate: string;
  totalLeads: number;
  calledLeads: number;
  createdAt: string;
}

/* ─── Dummy Data ──────────────────────────────────────────── */
const TELESALES: Campaign[] = [
  { id: "ts-1", name: "Q1 Product Launch 2026",   status: "active",    schedule: "Sen–Jum, 09:00–17:00",  endDate: "2026-03-31", totalLeads: 1240, calledLeads: 450, createdAt: "2026-02-25" },
  { id: "ts-2", name: "Promo Maret – Paket SME",  status: "scheduled", schedule: "Sen–Jum, 10:00–16:00",  endDate: "2026-03-31", totalLeads:  320, calledLeads:   0, createdAt: "2026-03-20" },
  { id: "ts-3", name: "Follow Up Februari Leads", status: "completed", schedule: "Sen–Sab, 09:00–17:00",  endDate: "2026-02-28", totalLeads:  180, calledLeads: 180, createdAt: "2026-02-01" },
  { id: "ts-4", name: "New Product Demo Q2",      status: "draft",     schedule: "Belum dijadwalkan",      endDate: "2026-04-30", totalLeads:    0, calledLeads:   0, createdAt: "2026-03-21" },
];

const COLLECTION: Campaign[] = [
  { id: "col-1", name: "DPD 1–30 Maret 2026",    status: "active",    schedule: "Sen–Sab, 08:00–16:00",  endDate: "2026-03-31", totalLeads:  621, calledLeads: 234, createdAt: "2026-03-01" },
  { id: "col-2", name: "Priority Accounts Q1",   status: "paused",    schedule: "Sen–Jum, 09:00–17:00",  endDate: "2026-04-30", totalLeads:  156, calledLeads:  89, createdAt: "2026-03-05" },
  { id: "col-3", name: "Q4 2025 Overdue",         status: "completed", schedule: "Sen–Sab, 08:00–17:00",  endDate: "2026-01-31", totalLeads:  940, calledLeads: 940, createdAt: "2025-12-01" },
  { id: "col-4", name: "High DPD Juni 2026",      status: "draft",     schedule: "Belum dijadwalkan",      endDate: "2026-06-30", totalLeads:    0, calledLeads:   0, createdAt: "2026-03-22" },
];

/* ─── Status helpers ──────────────────────────────────────── */
const STATUS_CONFIG: Record<CampaignStatus, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  draft:     { label: "Draft",      bg: "bg-gray-100",   text: "text-gray-500",  icon: FileEdit     },
  scheduled: { label: "Terjadwal",  bg: "bg-blue-50",    text: "text-blue-600",  icon: Calendar     },
  active:    { label: "Aktif",      bg: "bg-green-50",   text: "text-green-700", icon: Play         },
  paused:    { label: "Dijeda",     bg: "bg-amber-50",   text: "text-amber-600", icon: Pause        },
  completed: { label: "Selesai",    bg: "bg-slate-100",  text: "text-slate-500", icon: CheckCircle2 },
};

function StatusBadge({ status }: { status: CampaignStatus }) {
  const { label, bg, text, icon: Icon } = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function ProgressBar({ called, total }: { called: number; total: number }) {
  const pct = total > 0 ? Math.round((called / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-[#12672a] rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 tabular-nums whitespace-nowrap">
        {called.toLocaleString("id-ID")} / {total.toLocaleString("id-ID")}
      </span>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────── */
export default function CampaignPage() {
  const router  = useRouter();
  const [tab, setTab] = useState<CampaignTab>("telesales");
  const campaigns = tab === "telesales" ? TELESALES : COLLECTION;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#12672a] to-[#1d9a40] flex items-center justify-center shadow-md shadow-green-800/20">
            <Megaphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Campaign</h1>
            <p className="text-xs text-gray-400 mt-0.5">Kelola dan pantau semua campaign panggilan AI Anda</p>
          </div>
        </div>
        <button
          onClick={() => router.push(`/dashboard/campaign/create?type=${tab}`)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#12672a] hover:bg-[#0e5222] text-white text-sm font-medium rounded-xl transition-colors shadow-md shadow-green-800/20"
        >
          <Plus className="w-4 h-4" />
          Buat Campaign
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1 w-fit mb-6">
        {(["telesales", "collection"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === t ? "bg-white text-[#12672a] shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "telesales" ? "Telesales" : "Collection"}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Campaign",  value: campaigns.length,                                icon: Megaphone,   color: "from-[#12672a] to-[#1d9a40]" },
          { label: "Sedang Aktif",    value: campaigns.filter(c => c.status === "active").length,  icon: Play,        color: "from-blue-500 to-blue-600"   },
          { label: "Total Leads",     value: campaigns.reduce((a, c) => a + c.totalLeads, 0),      icon: Users,       color: "from-purple-500 to-purple-600"},
          { label: "Panggilan Dibuat",value: campaigns.reduce((a, c) => a + c.calledLeads, 0),     icon: BarChart2,   color: "from-amber-500 to-amber-600"  },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-sm shrink-0`}>
              <card.icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900 tabular-nums">{card.value.toLocaleString("id-ID")}</div>
              <div className="text-xs text-gray-400">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Megaphone className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium mb-1">Belum ada campaign</p>
            <p className="text-sm text-gray-400 mb-4">Mulai buat campaign pertama Anda</p>
            <button
              onClick={() => router.push(`/dashboard/campaign/create?type=${tab}`)}
              className="flex items-center gap-2 px-4 py-2 bg-[#12672a] text-white text-sm font-medium rounded-xl"
            >
              <Plus className="w-4 h-4" /> Buat Campaign
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Nama Campaign</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Jadwal</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Progress</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Berakhir</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/60 transition-colors group">
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Dibuat {c.createdAt}</p>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                      {c.schedule}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <ProgressBar called={c.calledLeads} total={c.totalLeads} />
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                      {c.endDate}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      {c.status === "active" && (
                        <button className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors" title="Jeda">
                          <Pause className="w-4 h-4" />
                        </button>
                      )}
                      {c.status === "paused" && (
                        <button className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-[#12672a] transition-colors" title="Lanjutkan">
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      {c.status === "scheduled" && (
                        <button className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-[#12672a] transition-colors" title="Mulai sekarang">
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      <button className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Hapus">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Info tip */}
      <div className="mt-4 flex items-start gap-2 text-xs text-gray-400">
        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>Campaign aktif akan berhenti otomatis saat melewati tanggal berakhir atau semua leads sudah dihubungi.</span>
      </div>
    </div>
  );
}
