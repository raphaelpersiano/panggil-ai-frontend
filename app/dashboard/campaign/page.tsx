"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Megaphone, Plus, Play, Pause, Trash2,
  Calendar, Users, Clock, CheckCircle2,
  AlertCircle, FileEdit, BarChart2, Loader2, Eye, X,
} from "lucide-react";
import { deleteCampaign, getCampaign, getCampaignSummary, listCampaigns, updateCampaignStatus } from "@/lib/api";
import type { Campaign, CampaignStatus, Occasion, PaginationMeta } from "@/lib/types";

type CampaignTab = Occasion;

const FALLBACK: Record<CampaignTab, Campaign[]> = {
  telesales: [],
  collection: [],
};

const EMPTY_META: PaginationMeta = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
};

const STATUS_CONFIG: Record<CampaignStatus, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  draft: { label: "Draft", bg: "bg-gray-100", text: "text-gray-500", icon: FileEdit },
  scheduled: { label: "Terjadwal", bg: "bg-blue-50", text: "text-blue-600", icon: Calendar },
  active: { label: "Aktif", bg: "bg-green-50", text: "text-green-700", icon: Play },
  paused: { label: "Dijeda", bg: "bg-amber-50", text: "text-amber-600", icon: Pause },
  completed: { label: "Selesai", bg: "bg-slate-100", text: "text-slate-500", icon: CheckCircle2 },
};

function StatusBadge({ status }: { status: CampaignStatus }) {
  const { label, bg, text, icon: Icon } = STATUS_CONFIG[status];
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}><Icon className="w-3 h-3" />{label}</span>;
}

function ProgressBar({ called, total }: { called: number; total: number }) {
  const pct = total > 0 ? Math.round((called / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden"><div className="h-full bg-[#12672a] rounded-full transition-all" style={{ width: `${pct}%` }} /></div>
      <span className="text-xs text-gray-500 tabular-nums whitespace-nowrap">{called.toLocaleString("id-ID")} / {total.toLocaleString("id-ID")}</span>
    </div>
  );
}

function scheduleLabel(c: Campaign) {
  if (c.scheduleMode === "immediate") return "Mulai sekarang";
  if (!c.startDate && !c.endDate) return "Belum dijadwalkan";
  return [c.startDate, c.endDate].filter(Boolean).join(" → ");
}

function fmtDate(value: string | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function formatDayNumber(day: number) {
  return ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][day] ?? `Hari ${day}`;
}

function CampaignDetailModal({
  campaignId,
  onClose,
}: {
  campaignId: string | null;
  onClose: () => void;
}) {
  const isOpen = Boolean(campaignId);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) return;
    const currentCampaignId = campaignId;
    let cancelled = false;

    async function loadCampaign() {
      setLoading(true);
      setError(null);
      try {
        const detail = await getCampaign(currentCampaignId);
        if (cancelled) return;
        setCampaign(detail);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Gagal memuat detail campaign.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCampaign();
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  if (!isOpen) return null;

  const selectedDays = campaign?.selectedDays ?? [];
  const dayTimes = campaign?.dayTimes ?? {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden bg-[#f8faf8] shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 bg-white px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#12672a]">Campaign Detail</p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">{campaign?.name ?? "Memuat campaign..."}</h2>
            <p className="mt-1 text-sm text-gray-500">
              Sekarang operator bisa inspeksi campaign dari endpoint detail beneran. Kalau drawer ini kosong atau patah, ya backend <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs">GET /campaigns/:id</code> yang belum rapi.
            </p>
          </div>
          <button onClick={onClose} className="rounded-xl border border-gray-200 p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-16 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Memuat detail campaign...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">{error}</div>
          ) : campaign ? (
            <div className="space-y-5">
              <div className="grid gap-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:grid-cols-2">
                <div className="md:col-span-2">
                  <p className="mb-1.5 text-xs font-medium text-gray-500">Deskripsi</p>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                    {campaign.description?.trim() || "Backend tidak menyimpan deskripsi campaign ini."}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-gray-500">Status</p>
                  <StatusBadge status={campaign.status} />
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-gray-500">Tipe</p>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                    {campaign.type === "telesales" ? "Telesales" : "Collection"}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-gray-500">Dibuat</p>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">{fmtDate(campaign.createdAt)}</div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-gray-500">Jadwal</p>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">{scheduleLabel(campaign)}</div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-gray-500">Start Date</p>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">{fmtDate(campaign.startDate)}</div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-gray-500">End Date</p>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">{fmtDate(campaign.endDate)}</div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-gray-500">Max Retries</p>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">{campaign.maxRetries}</div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-gray-500">Retry Interval</p>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">{campaign.retryIntervalMinutes} menit</div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-gray-500">Max Concurrent</p>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">{campaign.maxConcurrent}</div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-gray-500">Progress Panggilan</p>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                    {campaign.calledLeads.toLocaleString("id-ID")} / {campaign.totalLeads.toLocaleString("id-ID")} leads
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-gray-800">Hari & Jam Operasional</h3>
                {campaign.scheduleMode === "immediate" ? (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-500">
                    Campaign ini berjalan immediate, jadi backend tidak mengirim slot hari/jam terjadwal.
                  </div>
                ) : selectedDays.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700">
                    Schedule mode sudah <strong>scheduled</strong> tapi <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">selectedDays</code> kosong. Ini kontrak backend yang bikin UX terlihat bohong.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDays.map((day) => {
                      const slots = dayTimes[String(day)] ?? [];
                      return (
                        <div key={day} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                          <div className="text-sm font-medium text-gray-700">{formatDayNumber(day)}</div>
                          <div className="mt-1 text-xs text-gray-500">
                            {slots.length > 0 ? slots.join(", ") : "Backend belum mengirim slot jam untuk hari ini."}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function CampaignPage() {
  const router = useRouter();
  const [tab, setTab] = useState<CampaignTab>("telesales");
  const [campaignsByTab, setCampaignsByTab] = useState<Record<CampaignTab, Campaign[]>>(FALLBACK);
  const [summaryByTab, setSummaryByTab] = useState<Record<CampaignTab, { totalCampaigns: number; activeCampaigns: number; totalLeads: number; totalCalls: number }>>({
    telesales: { totalCampaigns: 0, activeCampaigns: 0, totalLeads: 0, totalCalls: 0 },
    collection: { totalCampaigns: 0, activeCampaigns: 0, totalLeads: 0, totalCalls: 0 },
  });
  const [metaByTab, setMetaByTab] = useState<Record<CampaignTab, PaginationMeta>>({
    telesales: EMPTY_META,
    collection: EMPTY_META,
  });
  const [pageByTab, setPageByTab] = useState<Record<CampaignTab, number>>({
    telesales: 1,
    collection: 1,
  });
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const currentPage = pageByTab[tab];

  useEffect(() => {
    let cancelled = false;

    async function load(type: CampaignTab, page: number) {
      setLoading(true);
      setError(null);
      try {
        const [campaigns, summary] = await Promise.all([listCampaigns(type, page, 10), getCampaignSummary(type)]);
        if (cancelled) return;
        setCampaignsByTab((prev) => ({ ...prev, [type]: campaigns.data }));
        setMetaByTab((prev) => ({ ...prev, [type]: campaigns.meta ?? EMPTY_META }));
        setSummaryByTab((prev) => ({ ...prev, [type]: summary }));
        setUsingFallback(false);
      } catch (err) {
        if (cancelled) return;
        setUsingFallback(true);
        setError(err instanceof Error ? err.message : "Gagal memuat campaign.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load(tab, currentPage);
    return () => {
      cancelled = true;
    };
  }, [tab, currentPage]);

  async function refreshTab(type: CampaignTab) {
    const page = pageByTab[type];
    const [campaigns, summary] = await Promise.all([listCampaigns(type, page, 10), getCampaignSummary(type)]);
    setCampaignsByTab((prev) => ({ ...prev, [type]: campaigns.data }));
    setMetaByTab((prev) => ({ ...prev, [type]: campaigns.meta ?? EMPTY_META }));
    setSummaryByTab((prev) => ({ ...prev, [type]: summary }));
  }

  async function handleStatusAction(campaign: Campaign, status: Extract<CampaignStatus, "active" | "paused">) {
    setActionLoadingId(campaign.id);
    setActionError(null);

    try {
      const updated = await updateCampaignStatus(campaign.id, status);
      setCampaignsByTab((prev) => ({
        ...prev,
        [tab]: prev[tab].map((item) => (item.id === campaign.id ? updated : item)),
      }));
      await refreshTab(tab);
      setUsingFallback(false);
    } catch (err) {
      setUsingFallback(true);
      setActionError(err instanceof Error ? err.message : "Gagal memperbarui status campaign.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDeleteCampaign(campaign: Campaign) {
    const confirmed = window.confirm(`Hapus campaign \"${campaign.name}\"? Ini hanya boleh untuk campaign draft atau completed.`);
    if (!confirmed) return;

    setActionLoadingId(campaign.id);
    setActionError(null);

    try {
      await deleteCampaign(campaign.id);
      setCampaignsByTab((prev) => ({
        ...prev,
        [tab]: prev[tab].filter((item) => item.id !== campaign.id),
      }));
      await refreshTab(tab);
      setUsingFallback(false);
    } catch (err) {
      setUsingFallback(true);
      setActionError(err instanceof Error ? err.message : "Gagal menghapus campaign.");
    } finally {
      setActionLoadingId(null);
    }
  }

  const campaigns = useMemo(() => campaignsByTab[tab], [campaignsByTab, tab]);
  const summary = summaryByTab[tab];
  const meta = metaByTab[tab];

  return (
    <>
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#12672a] to-[#1d9a40] flex items-center justify-center shadow-md shadow-green-800/20"><Megaphone className="w-5 h-5 text-white" /></div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Campaign</h1>
              <p className="text-xs text-gray-400 mt-0.5">Kelola dan pantau semua campaign panggilan AI Anda</p>
            </div>
          </div>
          <button onClick={() => router.push(`/dashboard/campaign/create?type=${tab}`)} className="flex items-center gap-2 px-4 py-2.5 bg-[#12672a] hover:bg-[#0e5222] text-white text-sm font-medium rounded-xl transition-colors shadow-md shadow-green-800/20"><Plus className="w-4 h-4" />Buat Campaign {tab === "telesales" ? "Telesales" : "Collection"}</button>
        </div>

        <div className="flex bg-gray-100 rounded-xl p-1 gap-1 w-fit mb-6">
          {(["telesales", "collection"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${tab === t ? "bg-white text-[#12672a] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>{t === "telesales" ? "Telesales" : "Collection"}</button>
          ))}
        </div>

        {(usingFallback || error || actionError) && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Backend campaign masih bikin frontend kerja sambil ngedumel. List/read sudah jalan, tapi kalau status update, detail, atau delete gagal berarti kontrak backend-nya belum konsisten. {error ?? actionError ?? ""}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Campaign", value: summary.totalCampaigns, icon: Megaphone, color: "from-[#12672a] to-[#1d9a40]" },
            { label: "Sedang Aktif", value: summary.activeCampaigns, icon: Play, color: "from-blue-500 to-blue-600" },
            { label: "Total Leads", value: summary.totalLeads, icon: Users, color: "from-purple-500 to-purple-600" },
            { label: "Panggilan Dibuat", value: summary.totalCalls, icon: BarChart2, color: "from-amber-500 to-amber-600" },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-sm shrink-0`}><card.icon className="w-4 h-4 text-white" /></div>
              <div><div className="text-xl font-bold text-gray-900 tabular-nums">{card.value.toLocaleString("id-ID")}</div><div className="text-xs text-gray-400">{card.label}</div></div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {campaigns.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4"><Megaphone className="w-7 h-7 text-gray-300" /></div>
              <p className="text-gray-500 font-medium mb-1">Belum ada campaign</p>
              <p className="text-sm text-gray-400 mb-4">Mulai buat campaign pertama Anda</p>
              <button onClick={() => router.push(`/dashboard/campaign/create?type=${tab}`)} className="flex items-center gap-2 px-4 py-2 bg-[#12672a] text-white text-sm font-medium rounded-xl"><Plus className="w-4 h-4" /> Buat Campaign</button>
            </div>
          ) : (
            <>
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
                  {loading ? Array.from({ length: 4 }).map((_, i) => <tr key={i} className="animate-pulse">{Array.from({ length: 6 }).map((__, j) => <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded" /></td>)}</tr>) : campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="px-5 py-4"><p className="text-sm font-semibold text-gray-800">{c.name}</p><p className="text-xs text-gray-400 mt-0.5">Dibuat {fmtDate(c.createdAt)}</p></td>
                      <td className="px-4 py-4"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-4 hidden md:table-cell"><div className="flex items-center gap-1.5 text-xs text-gray-500"><Clock className="w-3.5 h-3.5 text-gray-300 shrink-0" />{scheduleLabel(c)}</div></td>
                      <td className="px-4 py-4"><ProgressBar called={c.calledLeads} total={c.totalLeads} /></td>
                      <td className="px-4 py-4 hidden lg:table-cell"><div className="flex items-center gap-1.5 text-xs text-gray-500"><Calendar className="w-3.5 h-3.5 text-gray-300 shrink-0" />{fmtDate(c.endDate)}</div></td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                          <button
                            onClick={() => setSelectedCampaignId(c.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-gray-400 hover:text-slate-600 transition-colors"
                            title="Lihat detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {c.status === "active" && (
                            <button
                              onClick={() => handleStatusAction(c, "paused")}
                              disabled={actionLoadingId === c.id}
                              className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Jeda"
                            >
                              {actionLoadingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
                            </button>
                          )}
                          {(c.status === "paused" || c.status === "scheduled") && (
                            <button
                              onClick={() => handleStatusAction(c, "active")}
                              disabled={actionLoadingId === c.id}
                              className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-[#12672a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Mulai / Lanjutkan"
                            >
                              {actionLoadingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteCampaign(c)}
                            disabled={actionLoadingId === c.id || !["draft", "completed"].includes(c.status)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={!['draft', 'completed'].includes(c.status) ? 'Hanya draft/completed yang bisa dihapus' : 'Hapus'}
                          >
                            {actionLoadingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
                <div>
                  Menampilkan {(campaigns.length === 0 ? 0 : (meta.page - 1) * meta.limit + 1).toLocaleString("id-ID")}–{Math.min(meta.page * meta.limit, meta.total).toLocaleString("id-ID")} dari {meta.total.toLocaleString("id-ID")} campaign.
                </div>
                <div className="flex items-center gap-2 self-end md:self-auto">
                  <button
                    onClick={() => setPageByTab((prev) => ({ ...prev, [tab]: Math.max(1, prev[tab] - 1) }))}
                    disabled={loading || meta.page <= 1}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Sebelumnya
                  </button>
                  <span className="px-2 text-xs font-medium text-gray-400">Halaman {meta.page} / {Math.max(1, meta.totalPages)}</span>
                  <button
                    onClick={() => setPageByTab((prev) => ({ ...prev, [tab]: Math.min(Math.max(1, meta.totalPages), prev[tab] + 1) }))}
                    disabled={loading || meta.page >= Math.max(1, meta.totalPages)}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex items-start gap-2 text-xs text-gray-400"><AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /><span>Campaign aktif akan berhenti otomatis saat melewati tanggal berakhir atau semua leads sudah dihubungi.</span></div>
      </div>

      <CampaignDetailModal campaignId={selectedCampaignId} onClose={() => setSelectedCampaignId(null)} />
    </>
  );
}
