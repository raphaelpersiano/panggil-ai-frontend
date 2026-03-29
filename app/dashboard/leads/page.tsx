"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users, Plus, Upload, Search, ChevronDown,
  Phone, Clock, Calendar, MoreHorizontal,
  TrendingUp, Wallet,
} from "lucide-react";
import { listLeads } from "@/lib/api";
import type { Lead, LeadStatus, Occasion } from "@/lib/types";

type Tab = Occasion;

const PAGE_SIZE = 20;

const FALLBACK_TELESALES: Lead[] = [];

const FALLBACK_COLLECTION: Lead[] = [];

const statusConfig: Record<LeadStatus, { label: string; className: string }> = {
  uncontacted: { label: "Belum Dihubungi", className: "bg-gray-100 text-gray-600" },
  connected: { label: "Terhubung", className: "bg-blue-100 text-blue-700" },
  follow_up: { label: "Follow Up", className: "bg-amber-100 text-amber-700" },
  promise_to_pay: { label: "Janji Bayar", className: "bg-purple-100 text-purple-700" },
  closed: { label: "Selesai", className: "bg-green-100 text-green-700" },
};

function StatusBadge({ status }: { status: LeadStatus }) {
  const cfg = statusConfig[status];
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>{cfg.label}</span>;
}

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function fmtDate(value: string | null | undefined, withTime = false) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

export default function LeadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) ?? "telesales";

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [pageByTab, setPageByTab] = useState<Record<Tab, number>>({ telesales: 1, collection: 1 });
  const [rows, setRows] = useState<Record<Tab, Lead[]>>({ telesales: FALLBACK_TELESALES, collection: FALLBACK_COLLECTION });
  const [totals, setTotals] = useState<Record<Tab, number>>({ telesales: FALLBACK_TELESALES.length, collection: FALLBACK_COLLECTION.length });
  const [totalPagesByTab, setTotalPagesByTab] = useState<Record<Tab, number>>({ telesales: 1, collection: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const activePage = pageByTab[activeTab];

  useEffect(() => {
    let cancelled = false;

    async function load(tab: Tab, page: number) {
      setLoading(true);
      setError(null);

      try {
        const [active, inactive] = await Promise.all([
          listLeads({ type: tab, page, limit: PAGE_SIZE, status: statusFilter, search, sortBy: "newest" }),
          listLeads({ type: tab === "telesales" ? "collection" : "telesales", page: 1, limit: 1, sortBy: "newest" }),
        ]);

        if (cancelled) return;

        const inactiveTab = tab === "telesales" ? "collection" : "telesales";
        setRows((prev) => ({
          ...prev,
          [tab]: active.data,
          [inactiveTab]: prev[inactiveTab],
        }));
        setTotals((prev) => ({
          ...prev,
          [tab]: active.meta?.total ?? active.data.length,
          [inactiveTab]: inactive.meta?.total ?? prev[inactiveTab],
        }));
        setTotalPagesByTab((prev) => ({
          ...prev,
          [tab]: active.meta?.totalPages ?? Math.max(1, Math.ceil((active.meta?.total ?? active.data.length) / PAGE_SIZE)),
          [inactiveTab]: inactive.meta?.totalPages ?? prev[inactiveTab],
        }));
        setUsingFallback(false);
      } catch (err) {
        if (cancelled) return;
        setUsingFallback(true);
        setError(err instanceof Error ? err.message : "Gagal memuat leads.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load(activeTab, activePage);
    return () => {
      cancelled = true;
    };
  }, [activeTab, activePage, search, statusFilter]);

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    setSearch("");
    setStatusFilter("all");
    setPageByTab((prev) => ({ ...prev, [tab]: 1 }));
    router.replace(`/dashboard/leads?tab=${tab}`, { scroll: false });
  }

  const activeRows = useMemo(() => rows[activeTab], [rows, activeTab]);
  const totalPages = totalPagesByTab[activeTab];
  const total = totals[activeTab];
  const rangeStart = total === 0 ? 0 : (activePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(total, rangeStart + activeRows.length - 1);

  return (
    <div className="p-6 lg:p-8 min-h-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola dan pantau semua prospek Anda tanpa memuat seluruh dataset sekaligus</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => router.push(`/dashboard/leads/import?tab=${activeTab}`)} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button onClick={() => router.push(`/dashboard/leads/create?tab=${activeTab}`)} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary-dark transition-all shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" />
            Buat Lead
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-6">
        <button onClick={() => switchTab("telesales")} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "telesales" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          <TrendingUp className="w-4 h-4" />
          Telesales
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${activeTab === "telesales" ? "bg-primary/10 text-primary" : "bg-gray-200 text-gray-500"}`}>{totals.telesales}</span>
        </button>
        <button onClick={() => switchTab("collection")} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "collection" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          <Wallet className="w-4 h-4" />
          Collection
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${activeTab === "collection" ? "bg-primary/10 text-primary" : "bg-gray-200 text-gray-500"}`}>{totals.collection}</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Cari nama, nomor, atau sumber..." value={search} onChange={(e) => { setSearch(e.target.value); setPageByTab((prev) => ({ ...prev, [activeTab]: 1 })); }} className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
        </div>

        <div className="relative">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as LeadStatus | "all"); setPageByTab((prev) => ({ ...prev, [activeTab]: 1 })); }} className="appearance-none pl-3 pr-9 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-700 cursor-pointer">
            <option value="all">Semua Status</option>
            <option value="uncontacted">Belum Dihubungi</option>
            <option value="connected">Terhubung</option>
            <option value="follow_up">Follow Up</option>
            <option value="promise_to_pay">Janji Bayar</option>
            <option value="closed">Selesai</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {(error || usingFallback) && (
        <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${usingFallback ? "border-amber-200 bg-amber-50 text-amber-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {usingFallback ? `Backend leads belum siap sepenuhnya. Menampilkan fallback UI. ${error ?? ""}` : error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {activeTab === "telesales" ? <TelesalesTable data={activeRows} loading={loading} /> : <CollectionTable data={activeRows} loading={loading} />}

        <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-gray-500">
            Menampilkan <span className="font-semibold text-gray-700">{rangeStart}-{rangeEnd}</span> dari <span className="font-semibold text-gray-700">{total}</span> leads
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Halaman {activePage} dari {totalPages}</span>
            <button onClick={() => setPageByTab((prev) => ({ ...prev, [activeTab]: Math.max(1, prev[activeTab] - 1) }))} disabled={activePage === 1 || loading} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">← Prev</button>
            <button onClick={() => setPageByTab((prev) => ({ ...prev, [activeTab]: Math.min(totalPages, prev[activeTab] + 1) }))} disabled={activePage === totalPages || loading} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TelesalesTable({ data, loading }: { data: Lead[]; loading: boolean }) {
  if (!loading && data.length === 0) return <EmptyState />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60">
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Nama</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"><span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />Nomor</span></th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Sumber</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Status</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"><span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Terakhir Dihubungi</span></th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"><span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Dibuat</span></th>
            <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading ? <LoadingRows cols={7} /> : data.map((lead) => (
            <tr key={lead.id} className="hover:bg-gray-50/60 transition-colors group">
              <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center shrink-0"><span className="text-xs font-bold text-primary">{lead.name.charAt(0)}</span></div><span className="font-medium text-gray-900">{lead.name}</span></div></td>
              <td className="px-5 py-4 text-gray-600 font-mono text-xs">{lead.mobile}</td>
              <td className="px-5 py-4"><span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium">{lead.source}</span></td>
              <td className="px-5 py-4"><StatusBadge status={lead.status} /></td>
              <td className="px-5 py-4 text-gray-500 text-xs">{fmtDate(lead.lastCallTime, true) ?? <span className="text-gray-300">—</span>}</td>
              <td className="px-5 py-4 text-gray-500 text-xs">{fmtDate(lead.createdAt) ?? lead.createdAt}</td>
              <td className="px-5 py-4 text-right"><button className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center ml-auto"><MoreHorizontal className="w-4 h-4 text-gray-500" /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CollectionTable({ data, loading }: { data: Lead[]; loading: boolean }) {
  if (!loading && data.length === 0) return <EmptyState />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60">
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Nama</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"><span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />Nomor</span></th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Sumber</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Status</th>
            <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Tunggakan</th>
            <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Cicilan/Bln</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Jatuh Tempo</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"><span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Terakhir Dihubungi</span></th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"><span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Dibuat</span></th>
            <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading ? <LoadingRows cols={10} /> : data.map((lead) => {
            const isOverdue = !!lead.emiDueDate && new Date(lead.emiDueDate) < new Date() && (lead.outstanding ?? 0) > 0;
            return (
              <tr key={lead.id} className="hover:bg-gray-50/60 transition-colors group">
                <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center shrink-0"><span className="text-xs font-bold text-orange-600">{lead.name.charAt(0)}</span></div><span className="font-medium text-gray-900 whitespace-nowrap">{lead.name}</span></div></td>
                <td className="px-5 py-4 text-gray-600 font-mono text-xs">{lead.mobile}</td>
                <td className="px-5 py-4"><span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium">{lead.source}</span></td>
                <td className="px-5 py-4"><StatusBadge status={lead.status} /></td>
                <td className="px-5 py-4 text-right">{(lead.outstanding ?? 0) > 0 ? <span className="font-semibold text-red-600 text-xs">{formatRupiah(lead.outstanding ?? 0)}</span> : <span className="text-green-600 text-xs font-semibold">Lunas</span>}</td>
                <td className="px-5 py-4 text-right text-gray-600 text-xs font-medium">{formatRupiah(lead.emi ?? 0)}</td>
                <td className="px-5 py-4"><span className={`text-xs font-medium ${isOverdue ? "text-red-600 font-bold" : "text-gray-600"}`}>{lead.emiDueDate ?? "—"}{isOverdue && <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[10px]">LEWAT</span>}</span></td>
                <td className="px-5 py-4 text-gray-500 text-xs">{fmtDate(lead.lastCallTime, true) ?? <span className="text-gray-300">—</span>}</td>
                <td className="px-5 py-4 text-gray-500 text-xs">{fmtDate(lead.createdAt) ?? lead.createdAt}</td>
                <td className="px-5 py-4 text-right"><button className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center ml-auto"><MoreHorizontal className="w-4 h-4 text-gray-500" /></button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LoadingRows({ cols }: { cols: number }) {
  return Array.from({ length: 4 }).map((_, idx) => (
    <tr key={idx} className="animate-pulse">
      {Array.from({ length: cols }).map((__, col) => <td key={col} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded" /></td>)}
    </tr>
  ));
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4"><Users className="w-7 h-7 text-gray-400" /></div>
      <p className="text-gray-600 font-medium">Tidak ada leads ditemukan</p>
      <p className="text-gray-400 text-sm mt-1">Coba ubah filter atau kata kunci pencarian.</p>
    </div>
  );
}
