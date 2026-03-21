"use client";

import { useState, useMemo } from "react";
import {
  Search, Phone, Clock, DollarSign, Hash,
  ChevronUp, ChevronDown, ChevronsUpDown, X, Filter,
} from "lucide-react";

/* ─── Types ───────────────────────────────────────────────── */
type AgentType  = "telesales" | "collection";
type EndedBy    = "agent" | "leads";
type SortField  = "createdAt" | "duration" | "cost" | "callId";
type SortDir    = "asc" | "desc";

interface CallLog {
  callId:     string;
  agent:      AgentType;
  fromNumber: string;
  toNumber:   string;
  duration:   number;   // seconds
  endedBy:    EndedBy;
  createdAt:  string;   // "YYYY-MM-DD HH:mm:ss"
  cost:       number;   // IDR
}

/* ─── 30 dummy logs ───────────────────────────────────────── */
const LOGS: CallLog[] = [
  { callId: "CALL-001", agent: "telesales",  fromNumber: "02150001001", toNumber: "081234567890", duration: 187, endedBy: "agent",  createdAt: "2026-03-22 09:12:34", cost: 5610  },
  { callId: "CALL-002", agent: "collection", fromNumber: "02150001002", toNumber: "081298765432", duration: 312, endedBy: "leads",  createdAt: "2026-03-22 09:25:01", cost: 9360  },
  { callId: "CALL-003", agent: "telesales",  fromNumber: "02150001001", toNumber: "082345678901", duration:  45, endedBy: "leads",  createdAt: "2026-03-22 09:38:15", cost: 1350  },
  { callId: "CALL-004", agent: "collection", fromNumber: "02150001002", toNumber: "083276543210", duration: 421, endedBy: "agent",  createdAt: "2026-03-22 10:05:47", cost: 12630 },
  { callId: "CALL-005", agent: "telesales",  fromNumber: "02150001001", toNumber: "084567890123", duration: 263, endedBy: "agent",  createdAt: "2026-03-22 10:22:09", cost: 7890  },
  { callId: "CALL-006", agent: "collection", fromNumber: "02150001003", toNumber: "085454321098", duration: 156, endedBy: "leads",  createdAt: "2026-03-22 10:45:33", cost: 4680  },
  { callId: "CALL-007", agent: "telesales",  fromNumber: "02150001001", toNumber: "086789012345", duration:  92, endedBy: "leads",  createdAt: "2026-03-22 11:01:22", cost: 2760  },
  { callId: "CALL-008", agent: "collection", fromNumber: "02150001002", toNumber: "087632109876", duration: 538, endedBy: "agent",  createdAt: "2026-03-22 11:18:55", cost: 16140 },
  { callId: "CALL-009", agent: "telesales",  fromNumber: "02150001001", toNumber: "088901234567", duration: 344, endedBy: "agent",  createdAt: "2026-03-22 11:34:12", cost: 10320 },
  { callId: "CALL-010", agent: "telesales",  fromNumber: "02150001004", toNumber: "089012345678", duration: 211, endedBy: "leads",  createdAt: "2026-03-22 11:52:40", cost: 6330  },
  { callId: "CALL-011", agent: "collection", fromNumber: "02150001002", toNumber: "081909876543", duration: 476, endedBy: "agent",  createdAt: "2026-03-21 09:05:18", cost: 14280 },
  { callId: "CALL-012", agent: "telesales",  fromNumber: "02150001001", toNumber: "081123456789", duration: 128, endedBy: "agent",  createdAt: "2026-03-21 09:31:04", cost: 3840  },
  { callId: "CALL-013", agent: "collection", fromNumber: "02150001003", toNumber: "082187654321", duration: 389, endedBy: "leads",  createdAt: "2026-03-21 10:14:27", cost: 11670 },
  { callId: "CALL-014", agent: "telesales",  fromNumber: "02150001004", toNumber: "083456789012", duration:  67, endedBy: "leads",  createdAt: "2026-03-21 10:48:51", cost: 2010  },
  { callId: "CALL-015", agent: "collection", fromNumber: "02150001002", toNumber: "084365432109", duration: 602, endedBy: "agent",  createdAt: "2026-03-21 11:22:09", cost: 18060 },
  { callId: "CALL-016", agent: "telesales",  fromNumber: "02150001001", toNumber: "085678901234", duration: 295, endedBy: "agent",  createdAt: "2026-03-21 13:05:37", cost: 8850  },
  { callId: "CALL-017", agent: "collection", fromNumber: "02150001003", toNumber: "086543210987", duration: 143, endedBy: "leads",  createdAt: "2026-03-21 13:44:22", cost: 4290  },
  { callId: "CALL-018", agent: "telesales",  fromNumber: "02150001004", toNumber: "087890123456", duration: 418, endedBy: "agent",  createdAt: "2026-03-21 14:17:08", cost: 12540 },
  { callId: "CALL-019", agent: "collection", fromNumber: "02150001002", toNumber: "088721098765", duration: 257, endedBy: "agent",  createdAt: "2026-03-21 14:55:30", cost: 7710  },
  { callId: "CALL-020", agent: "telesales",  fromNumber: "02150001001", toNumber: "089810987654", duration:  34, endedBy: "leads",  createdAt: "2026-03-21 15:28:44", cost: 1020  },
  { callId: "CALL-021", agent: "collection", fromNumber: "02150001003", toNumber: "081234567890", duration: 509, endedBy: "agent",  createdAt: "2026-03-20 09:11:03", cost: 15270 },
  { callId: "CALL-022", agent: "telesales",  fromNumber: "02150001001", toNumber: "082345678901", duration: 176, endedBy: "leads",  createdAt: "2026-03-20 09:45:19", cost: 5280  },
  { callId: "CALL-023", agent: "collection", fromNumber: "02150001002", toNumber: "083276543210", duration: 333, endedBy: "agent",  createdAt: "2026-03-20 10:28:55", cost: 9990  },
  { callId: "CALL-024", agent: "telesales",  fromNumber: "02150001004", toNumber: "084567890123", duration: 452, endedBy: "agent",  createdAt: "2026-03-20 11:03:27", cost: 13560 },
  { callId: "CALL-025", agent: "collection", fromNumber: "02150001003", toNumber: "085454321098", duration:  88, endedBy: "leads",  createdAt: "2026-03-20 11:41:12", cost: 2640  },
  { callId: "CALL-026", agent: "telesales",  fromNumber: "02150001001", toNumber: "086789012345", duration: 371, endedBy: "agent",  createdAt: "2026-03-20 13:22:40", cost: 11130 },
  { callId: "CALL-027", agent: "collection", fromNumber: "02150001002", toNumber: "087632109876", duration: 224, endedBy: "leads",  createdAt: "2026-03-20 14:05:18", cost: 6720  },
  { callId: "CALL-028", agent: "telesales",  fromNumber: "02150001004", toNumber: "088901234567", duration: 493, endedBy: "agent",  createdAt: "2026-03-20 14:48:33", cost: 14790 },
  { callId: "CALL-029", agent: "collection", fromNumber: "02150001003", toNumber: "089012345678", duration: 115, endedBy: "leads",  createdAt: "2026-03-20 15:30:07", cost: 3450  },
  { callId: "CALL-030", agent: "telesales",  fromNumber: "02150001001", toNumber: "081909876543", duration: 287, endedBy: "agent",  createdAt: "2026-03-19 10:14:52", cost: 8610  },
];

/* ─── Helpers ─────────────────────────────────────────────── */
function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtIDR(n: number): string {
  return "Rp " + n.toLocaleString("id-ID");
}

function logDate(log: CallLog): string {
  return log.createdAt.slice(0, 10); // YYYY-MM-DD
}

/* ─── Sort icon ───────────────────────────────────────────── */
function SortIcon({ field, active, dir }: { field: SortField; active: SortField; dir: SortDir }) {
  if (active !== field) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-300" />;
  return dir === "asc"
    ? <ChevronUp   className="w-3.5 h-3.5 text-[#12672a]" />
    : <ChevronDown className="w-3.5 h-3.5 text-[#12672a]" />;
}

/* ─── Stat Card ───────────────────────────────────────────── */
function StatCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 truncate">{label}</p>
        <p className="text-lg font-bold text-gray-900 leading-tight tabular-nums">{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────── */
export default function LogsPage() {
  /* filters */
  const [search,      setSearch]      = useState("");
  const [agentFilter, setAgentFilter] = useState<AgentType | "all">("all");
  const [dateFrom,    setDateFrom]    = useState("");
  const [dateTo,      setDateTo]      = useState("");
  /* sort */
  const [sortField,   setSortField]   = useState<SortField>("createdAt");
  const [sortDir,     setSortDir]     = useState<SortDir>("desc");
  /* pagination */
  const [page,        setPage]        = useState(1);
  const PAGE_SIZE = 10;

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
    setPage(1);
  }

  function clearFilters() {
    setSearch(""); setAgentFilter("all"); setDateFrom(""); setDateTo(""); setPage(1);
  }

  const hasFilter = search || agentFilter !== "all" || dateFrom || dateTo;

  /* ── Apply filters ── */
  const filtered = useMemo(() => {
    let rows = LOGS;
    if (agentFilter !== "all") rows = rows.filter(l => l.agent === agentFilter);
    if (dateFrom) rows = rows.filter(l => logDate(l) >= dateFrom);
    if (dateTo)   rows = rows.filter(l => logDate(l) <= dateTo);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(l =>
        l.callId.toLowerCase().includes(q) ||
        l.fromNumber.includes(q) ||
        l.toNumber.includes(q)
      );
    }
    return rows;
  }, [search, agentFilter, dateFrom, dateTo]);

  /* ── Apply sort ── */
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: string | number, bv: string | number;
      if (sortField === "callId")    { av = a.callId;    bv = b.callId;    }
      else if (sortField === "duration") { av = a.duration;  bv = b.duration;  }
      else if (sortField === "cost")     { av = a.cost;      bv = b.cost;      }
      else                               { av = a.createdAt; bv = b.createdAt; }
      return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
  }, [filtered, sortField, sortDir]);

  /* ── Pagination ── */
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageRows   = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ── Stats (based on agentFilter + dateFrom/dateTo) ── */
  const statsRows = useMemo(() => {
    let rows = LOGS;
    if (agentFilter !== "all") rows = rows.filter(l => l.agent === agentFilter);
    if (dateFrom) rows = rows.filter(l => logDate(l) >= dateFrom);
    if (dateTo)   rows = rows.filter(l => logDate(l) <= dateTo);
    return rows;
  }, [agentFilter, dateFrom, dateTo]);

  const totalSeconds  = statsRows.reduce((s, l) => s + l.duration, 0);
  const totalMinutes  = (totalSeconds / 60).toFixed(1);
  const totalCalls    = statsRows.length;
  const totalCost     = statsRows.reduce((s, l) => s + l.cost, 0);
  const avgCost       = totalCalls > 0 ? Math.round(totalCost / totalCalls) : 0;

  const agentLabel = agentFilter !== "all" ? (agentFilter === "telesales" ? "Telesales" : "Collection") : null;
  const dateLabel  = dateFrom || dateTo ? `${dateFrom || "—"} s/d ${dateTo || "—"}` : null;
  const statsLabel = [agentLabel, dateLabel].filter(Boolean).join(" · ") || "Semua waktu";

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Call Logs</h1>
        <p className="text-xs text-gray-400 mt-0.5">Riwayat seluruh panggilan yang dilakukan oleh AI agent</p>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={Clock}
          label="Total Menit Panggilan"
          value={`${Number(totalMinutes).toLocaleString("id-ID")} mnt`}
          sub={statsLabel}
          color="bg-gradient-to-br from-[#12672a] to-[#1d9a40]"
        />
        <StatCard
          icon={Hash}
          label="Jumlah Panggilan"
          value={totalCalls.toLocaleString("id-ID")}
          sub={statsLabel}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          icon={DollarSign}
          label="Total Biaya"
          value={fmtIDR(totalCost)}
          sub={statsLabel}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <StatCard
          icon={Phone}
          label="Rata-rata Biaya / Panggilan"
          value={fmtIDR(avgCost)}
          sub={statsLabel}
          color="bg-gradient-to-br from-amber-500 to-amber-600"
        />
      </div>

      {/* ── Filter & Search Bar ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
            <input
              type="text"
              placeholder="Cari Call ID, nomor..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#12672a]/30 focus:border-[#12672a] transition-all placeholder:text-gray-300"
            />
          </div>

          {/* Agent filter */}
          <select
            value={agentFilter}
            onChange={e => { setAgentFilter(e.target.value as AgentType | "all"); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#12672a]/30 focus:border-[#12672a] bg-white"
          >
            <option value="all">Semua Agent</option>
            <option value="telesales">Telesales</option>
            <option value="collection">Collection</option>
          </select>

          {/* Date from */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 whitespace-nowrap">Dari</span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#12672a]/30 focus:border-[#12672a] bg-white"
            />
          </div>

          {/* Date to */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 whitespace-nowrap">Sampai</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#12672a]/30 focus:border-[#12672a] bg-white"
            />
          </div>

          {/* Clear */}
          {hasFilter && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
            >
              <X className="w-3.5 h-3.5" />
              Reset
            </button>
          )}

          {/* Result count */}
          <span className="ml-auto text-xs text-gray-400 whitespace-nowrap">
            {filtered.length} dari {LOGS.length} log
          </span>
        </div>

        {/* Active filter chips */}
        {hasFilter && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Filter className="w-3 h-3" />
              <span>Filter aktif:</span>
            </div>
            {agentFilter !== "all" && (
              <span className="px-2 py-0.5 bg-[#12672a]/10 text-[#12672a] rounded-full text-xs font-medium capitalize">
                {agentFilter}
              </span>
            )}
            {dateFrom && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                Dari: {dateFrom}
              </span>
            )}
            {dateTo && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                Sampai: {dateTo}
              </span>
            )}
            {search && (
              <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-xs font-medium">
                &ldquo;{search}&rdquo;
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {/* Call ID */}
                <th className="text-left px-4 py-3">
                  <button
                    onClick={() => toggleSort("callId")}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hover:text-gray-600 transition-colors"
                  >
                    Call ID <SortIcon field="callId" active={sortField} dir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Agent</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">From</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">To</th>
                {/* Duration */}
                <th className="text-left px-4 py-3">
                  <button
                    onClick={() => toggleSort("duration")}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hover:text-gray-600 transition-colors"
                  >
                    Durasi <SortIcon field="duration" active={sortField} dir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Diakhiri Oleh</th>
                {/* Created At */}
                <th className="text-left px-4 py-3">
                  <button
                    onClick={() => toggleSort("createdAt")}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hover:text-gray-600 transition-colors"
                  >
                    Waktu <SortIcon field="createdAt" active={sortField} dir={sortDir} />
                  </button>
                </th>
                {/* Cost */}
                <th className="text-right px-4 py-3">
                  <button
                    onClick={() => toggleSort("cost")}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hover:text-gray-600 transition-colors ml-auto"
                  >
                    Biaya <SortIcon field="cost" active={sortField} dir={sortDir} />
                  </button>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-sm text-gray-400">
                    Tidak ada log yang sesuai filter
                  </td>
                </tr>
              ) : (
                pageRows.map((log) => (
                  <tr key={log.callId} className="hover:bg-gray-50/60 transition-colors">
                    {/* Call ID */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                        {log.callId}
                      </span>
                    </td>

                    {/* Agent badge */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        log.agent === "telesales"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-purple-50 text-purple-600"
                      }`}>
                        {log.agent === "telesales" ? "Telesales" : "Collection"}
                      </span>
                    </td>

                    {/* From */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-gray-500 font-mono">{log.fromNumber}</span>
                    </td>

                    {/* To */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700 font-mono">{log.toNumber}</span>
                    </td>

                    {/* Duration */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                        <span className="text-sm text-gray-700 tabular-nums">{fmtDuration(log.duration)}</span>
                      </div>
                    </td>

                    {/* Ended by */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        log.endedBy === "agent"
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${log.endedBy === "agent" ? "bg-green-500" : "bg-gray-400"}`} />
                        {log.endedBy === "agent" ? "Agent" : "Leads"}
                      </span>
                    </td>

                    {/* Created At */}
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-600">{log.createdAt.slice(0, 10)}</div>
                      <div className="text-xs text-gray-400">{log.createdAt.slice(11, 16)}</div>
                    </td>

                    {/* Cost */}
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-gray-800 tabular-nums">
                        {fmtIDR(log.cost)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/40">
            <span className="text-xs text-gray-400">
              Halaman {page} dari {totalPages} · {filtered.length} hasil
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const p = start + i;
                if (p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 text-xs font-medium rounded-lg transition-colors ${
                      p === page
                        ? "bg-[#12672a] text-white shadow-sm"
                        : "border border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
