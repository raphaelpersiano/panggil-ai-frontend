"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search, Phone, Clock, DollarSign, Hash, Megaphone,
  ChevronUp, ChevronDown, ChevronsUpDown, X, Filter, AlertCircle,
  FileAudio, FileText, Database, Loader2, ExternalLink,
} from "lucide-react";
import { getLogDetail, getLogSummary, listCampaigns, listLogs } from "@/lib/api";
import type { AgentType, CallLog, CallLogSummary, Campaign } from "@/lib/types";

type SortField = "createdAt" | "duration" | "cost";
type SortDir = "asc" | "desc";

const FALLBACK_CAMPAIGNS: Campaign[] = [];

const FALLBACK_LOGS: CallLog[] = [];

const FALLBACK_SUMMARY: CallLogSummary = {
  totalCalls: 0,
  totalDuration: 0,
  totalCost: 0,
  avgDuration: 0,
};

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtIDR(n: number): string {
  return "Rp " + n.toLocaleString("id-ID");
}

function fmtDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { day: value.slice(0, 10), time: value.slice(11, 16) };
  return {
    day: new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date),
    time: new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(date),
  };
}

function SortIcon({ field, active, dir }: { field: SortField; active: SortField; dir: SortDir }) {
  if (active !== field) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-300" />;
  return dir === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-[#12672a]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#12672a]" />;
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 truncate">{label}</p>
        <p className="text-lg font-bold text-gray-900 leading-tight tabular-nums">{value}</p>
        {sub && <p className="text-xs text-gray-400 truncate max-w-[160px]" title={sub}>{sub}</p>}
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-sm text-gray-700 break-words">{value || "—"}</p>
    </div>
  );
}

function DetailSection({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#12672a]/10">
          <Icon className="h-4 w-4 text-[#12672a]" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function LogDetailModal({
  log,
  loading,
  error,
  onClose,
}: {
  log: CallLog | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}) {
  if (!log && !loading && !error) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-[#f8faf8] shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 bg-white px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#12672a]">Log Detail</p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">{log?.callId ?? "Memuat detail panggilan..."}</h2>
            <p className="mt-1 text-sm text-gray-500">
              Frontend sudah siap membaca transcript, rekaman, dan structured output. Kalau kosong, itu bukan masalah UI — backend memang belum kirim artefaknya.
            </p>
          </div>
          <button onClick={onClose} className="rounded-xl border border-gray-200 p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(90vh-96px)] overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-16 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Memuat detail call log...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">
              Detail log gagal dimuat. Kalau endpoint <code className="font-mono">GET /logs/:callId</code> belum stabil, operator ya cuma bisa lihat tabel list tanpa konteks percakapan. {error}
            </div>
          ) : log ? (
            <div className="space-y-5">
              <DetailSection icon={Phone} title="Informasi Panggilan">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <DetailField label="Call ID" value={log.callId} />
                  <DetailField label="Campaign ID" value={log.campaignId} />
                  <DetailField label="Campaign" value={log.campaignName ?? "—"} />
                  <DetailField label="Agent" value={log.agentType === "telesales" ? "Telesales" : "Collection"} />
                  <DetailField label="Lead" value={log.leadName ?? "—"} />
                  <DetailField label="Diakhiri Oleh" value={log.endedBy} />
                  <DetailField label="Dari Nomor" value={log.fromNumber} />
                  <DetailField label="Ke Nomor" value={log.toNumber} />
                  <DetailField label="Waktu" value={`${fmtDate(log.createdAt).day} • ${fmtDate(log.createdAt).time}`} />
                  <DetailField label="Durasi" value={fmtDuration(log.duration)} />
                  <DetailField label="Biaya" value={fmtIDR(log.cost)} />
                </div>
              </DetailSection>

              <DetailSection icon={FileAudio} title="Recording">
                {log.recordingUrl ? (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Rekaman tersedia</p>
                        <p className="text-xs text-gray-500">Jika URL ini valid dari backend, operator bisa audit kualitas call tanpa menebak-nebak.</p>
                      </div>
                      <a
                        href={log.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#12672a] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0e5222]"
                      >
                        Buka <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                    <audio controls className="w-full" src={log.recordingUrl}>
                      Browser ini tidak mendukung audio player.
                    </audio>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
                    Backend belum mengirim <code className="font-mono">recordingUrl</code> untuk call ini.
                  </div>
                )}
              </DetailSection>

              <DetailSection icon={FileText} title="Transcript">
                {log.transcript ? (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm leading-7 text-gray-700 whitespace-pre-wrap">
                    {log.transcript}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
                    Tidak ada transcript. Kalau backend memang belum melakukan ASR atau belum expose field ini, QA percakapan jadi tetap gelap.
                  </div>
                )}
              </DetailSection>

              <DetailSection icon={Database} title="Structured Output">
                {log.structuredOutput && Object.keys(log.structuredOutput).length > 0 ? (
                  <pre className="overflow-x-auto rounded-2xl border border-gray-200 bg-gray-950 px-4 py-4 text-xs leading-6 text-green-200">
                    {JSON.stringify(log.structuredOutput, null, 2)}
                  </pre>
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
                    Backend belum mengirim <code className="font-mono">structuredOutput</code> untuk call ini. Padahal justru ini yang dibutuhkan operator untuk tahu hasil call tanpa baca transcript penuh.
                  </div>
                )}
              </DetailSection>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function LogsPage() {
  const [search, setSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState<AgentType | "all">("all");
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<CallLog[]>(FALLBACK_LOGS);
  const [campaigns, setCampaigns] = useState<Campaign[]>(FALLBACK_CAMPAIGNS);
  const [summary, setSummary] = useState<CallLogSummary>(FALLBACK_SUMMARY);
  const [total, setTotal] = useState(FALLBACK_LOGS.length);
  const [loading, setLoading] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<CallLog | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const PAGE_SIZE = 10;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [tsCampaigns, colCampaigns, logsResponse, summaryResponse] = await Promise.all([
          listCampaigns("telesales", 1, 100),
          listCampaigns("collection", 1, 100),
          listLogs({
            page,
            limit: PAGE_SIZE,
            campaignId: campaignFilter !== "all" ? campaignFilter : undefined,
            agentType: agentFilter,
            search,
            sortBy: sortField,
            sortOrder: sortDir,
          }),
          getLogSummary(),
        ]);

        if (cancelled) return;
        setCampaigns([...tsCampaigns.data, ...colCampaigns.data]);
        setRows(logsResponse.data);
        setSummary(summaryResponse);
        setTotal(logsResponse.meta?.total ?? logsResponse.data.length);
        setUsingFallback(false);
      } catch (err) {
        if (cancelled) return;
        setUsingFallback(true);
        setError(err instanceof Error ? err.message : "Gagal memuat call logs.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [page, campaignFilter, agentFilter, search, sortField, sortDir]);

  useEffect(() => {
    if (!selectedCallId) return;

    const callId = selectedCallId;
    let cancelled = false;

    async function loadDetail() {
      setDetailLoading(true);
      setDetailError(null);
      setSelectedLog(null);

      try {
        const detail = await getLogDetail(callId);
        if (cancelled) return;
        setSelectedLog(detail);
      } catch (err) {
        if (cancelled) return;
        setDetailError(err instanceof Error ? err.message : "Gagal memuat detail call log.");
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    }

    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [selectedCallId]);

  const visibleCampaigns = useMemo(
    () => (agentFilter === "all" ? campaigns : campaigns.filter((c) => c.type === agentFilter)),
    [agentFilter, campaigns],
  );

  const visibleTotalCalls = rows.length;
  const visibleTotalCost = rows.reduce((sum, log) => sum + log.cost, 0);
  const avgCost = visibleTotalCalls > 0 ? Math.round(visibleTotalCost / visibleTotalCalls) : 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilter = Boolean(search || agentFilter !== "all" || campaignFilter !== "all");
  const campaignName = campaigns.find((c) => c.id === campaignFilter)?.name ?? null;

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setAgentFilter("all");
    setCampaignFilter("all");
    setPage(1);
  }

  function handleAgentChange(val: AgentType | "all") {
    setAgentFilter(val);
    if (val !== "all") {
      const stillVisible = campaigns.find((c) => c.id === campaignFilter && c.type === val);
      if (!stillVisible) setCampaignFilter("all");
    }
    setPage(1);
  }

  function closeDetail() {
    setSelectedCallId(null);
    setSelectedLog(null);
    setDetailError(null);
    setDetailLoading(false);
  }

  return (
    <>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Outbound Call Logs</h1>
          <p className="text-xs text-gray-400 mt-0.5">Riwayat panggilan keluar dari tabel Supabase <code className="font-mono">calls</code> via backend API</p>
        </div>

        {(usingFallback || error) && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Backend logs belum sepenuhnya aktif. Tabel list sudah siap, detail per call juga sudah disiapkan, tapi tanpa endpoint stabil operator tetap cuma dapat potongan data. {error ?? ""}</span>
          </div>
        )}

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
          <StatCard icon={Clock} label="Total Menit Panggilan" value={`${(summary.totalDuration / 60).toFixed(1)} mnt`} sub="Semua log dari backend" color="bg-gradient-to-br from-[#12672a] to-[#1d9a40]" />
          <StatCard icon={Hash} label="Jumlah Panggilan" value={summary.totalCalls.toLocaleString("id-ID")} sub="Semua log dari backend" color="bg-gradient-to-br from-blue-500 to-blue-600" />
          <StatCard icon={DollarSign} label="Total Biaya" value={fmtIDR(summary.totalCost)} sub="Semua log dari backend" color="bg-gradient-to-br from-purple-500 to-purple-600" />
          <StatCard icon={Phone} label="Rata-rata Biaya / Panggilan" value={fmtIDR(avgCost)} sub="Halaman/filter saat ini" color="bg-gradient-to-br from-amber-500 to-amber-600" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
              <input
                type="text"
                placeholder="Cari Call ID, nomor..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#12672a]/30 focus:border-[#12672a] transition-all placeholder:text-gray-300"
              />
            </div>

            <select
              value={agentFilter}
              onChange={(e) => handleAgentChange(e.target.value as AgentType | "all")}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#12672a]/30 focus:border-[#12672a] bg-white"
            >
              <option value="all">Semua Agent</option>
              <option value="telesales">Telesales</option>
              <option value="collection">Collection</option>
            </select>

            <select
              value={campaignFilter}
              onChange={(e) => { setCampaignFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#12672a]/30 focus:border-[#12672a] bg-white max-w-[220px]"
            >
              <option value="all">Semua Campaign</option>
              {visibleCampaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {hasFilter && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
              >
                <X className="w-3.5 h-3.5" />
                Reset
              </button>
            )}

            <span className="ml-auto text-xs text-gray-400 whitespace-nowrap">
              {rows.length} dari {total} log
            </span>
          </div>

          {hasFilter && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Filter className="w-3 h-3" />
                <span>Filter aktif:</span>
              </div>
              {agentFilter !== "all" && <span className="px-2 py-0.5 bg-[#12672a]/10 text-[#12672a] rounded-full text-xs font-medium capitalize">{agentFilter}</span>}
              {campaignFilter !== "all" && campaignName && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                  <Megaphone className="w-3 h-3" />
                  {campaignName}
                </span>
              )}
              {search && <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-xs font-medium">&ldquo;{search}&rdquo;</span>}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Call ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Agent</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden xl:table-cell">Campaign</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">From</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">To</th>
                  <th className="text-left px-4 py-3">
                    <button onClick={() => toggleSort("duration")} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hover:text-gray-600 transition-colors">
                      Durasi <SortIcon field="duration" active={sortField} dir={sortDir} />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3">
                    <button onClick={() => toggleSort("createdAt")} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hover:text-gray-600 transition-colors">
                      Waktu <SortIcon field="createdAt" active={sortField} dir={sortDir} />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3">
                    <button onClick={() => toggleSort("cost")} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hover:text-gray-600 transition-colors ml-auto">
                      Biaya <SortIcon field="cost" active={sortField} dir={sortDir} />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      {Array.from({ length: 8 }).map((__, col) => <td key={col} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded" /></td>)}
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-sm text-gray-400">Tidak ada log yang sesuai filter</td>
                  </tr>
                ) : (
                  rows.map((log) => {
                    const campaign = campaigns.find((c) => c.id === log.campaignId);
                    const when = fmtDate(log.createdAt);
                    return (
                      <tr
                        key={log.callId}
                        className="cursor-pointer hover:bg-gray-50/60 transition-colors"
                        onClick={() => setSelectedCallId(log.callId)}
                      >
                        <td className="px-4 py-3"><span className="font-mono text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">{log.callId}</span></td>
                        <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${log.agentType === "telesales" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>{log.agentType === "telesales" ? "Telesales" : "Collection"}</span></td>
                        <td className="px-4 py-3 hidden xl:table-cell"><span className="text-xs text-gray-500">{log.campaignName ?? campaign?.name ?? "—"}</span></td>
                        <td className="px-4 py-3 hidden md:table-cell"><span className="text-xs text-gray-500 font-mono">{log.fromNumber}</span></td>
                        <td className="px-4 py-3"><span className="text-sm text-gray-700 font-mono">{log.toNumber}</span></td>
                        <td className="px-4 py-3"><div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-300 shrink-0" /><span className="text-sm text-gray-700 tabular-nums">{fmtDuration(log.duration)}</span></div></td>
                        <td className="px-4 py-3"><div className="text-xs text-gray-600">{when.day}</div><div className="text-xs text-gray-400">{when.time}</div></td>
                        <td className="px-4 py-3 text-right"><span className="text-sm font-semibold text-gray-800 tabular-nums">{fmtIDR(log.cost)}</span></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/40">
              <span className="text-xs text-gray-400">Halaman {page} dari {totalPages} · {total} hasil</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">← Prev</button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <LogDetailModal log={selectedLog} loading={detailLoading} error={detailError} onClose={closeDetail} />
    </>
  );
}
