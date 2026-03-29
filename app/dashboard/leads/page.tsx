"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users, Plus, Upload, Search, ChevronDown,
  Phone, Clock, Calendar, MoreHorizontal,
  TrendingUp, Wallet, X, Save, Trash2, Loader2, AlertCircle,
} from "lucide-react";
import { deleteLead, getLead, listLeads, updateLead } from "@/lib/api";
import type { Lead, LeadStatus, Occasion } from "@/lib/types";

type Tab = Occasion;

type LeadEditorState = {
  id: string;
  name: string;
  mobile: string;
  source: string;
  status: LeadStatus;
  outstanding: string;
  emi: string;
  emiDueDate: string;
};

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

function normalizeMobile(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return `62${digits}`;
}

function buildEditorState(lead: Lead): LeadEditorState {
  return {
    id: lead.id,
    name: lead.name,
    mobile: lead.mobile,
    source: lead.source,
    status: lead.status,
    outstanding: lead.outstanding ? String(lead.outstanding) : "",
    emi: lead.emi ? String(lead.emi) : "",
    emiDueDate: lead.emiDueDate ?? "",
  };
}

function LeadDetailModal({
  tab,
  leadId,
  onClose,
  onSaved,
  onDeleted,
}: {
  tab: Tab;
  leadId: string | null;
  onClose: () => void;
  onSaved: (lead: Lead) => void;
  onDeleted: (leadId: string) => void;
}) {
  const isOpen = Boolean(leadId);
  const isCollection = tab === "collection";
  const [lead, setLead] = useState<Lead | null>(null);
  const [form, setForm] = useState<LeadEditorState | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!leadId) return;
    const currentLeadId = leadId;
    let cancelled = false;

    async function loadLead() {
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const detail = await getLead(currentLeadId);
        if (cancelled) return;
        setLead(detail);
        setForm(buildEditorState(detail));
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Gagal memuat detail lead.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadLead();
    return () => {
      cancelled = true;
    };
  }, [leadId]);

  if (!isOpen) return null;

  async function handleSave() {
    if (!leadId || !form) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateLead(leadId, {
        type: tab,
        name: form.name.trim(),
        mobile: normalizeMobile(form.mobile),
        source: form.source.trim(),
        status: form.status,
        ...(isCollection
          ? {
              outstanding: Number(form.outstanding),
              emi: Number(form.emi),
              emiDueDate: form.emiDueDate,
            }
          : {}),
      });
      setLead(updated);
      setForm(buildEditorState(updated));
      setSuccess("Lead berhasil diperbarui.");
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui lead.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!leadId || !lead) return;
    const confirmed = window.confirm(`Hapus lead \"${lead.name}\"? Kalau backend masih menolak delete padahal lead ini harusnya aman, itu berarti business rule mereka belum beres.`);
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      await deleteLead(leadId);
      onDeleted(leadId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus lead.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden bg-[#f8faf8] shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 bg-white px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#12672a]">Lead Detail</p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">{lead?.name ?? "Memuat lead..."}</h2>
            <p className="mt-1 text-sm text-gray-500">
              Sekarang operator bisa audit, edit, dan delete lead dari UI. Kalau save/delete gagal, itu kontrak backend leads yang masih nyusahin, bukan lagi tabel frontend yang mandek.
            </p>
          </div>
          <button onClick={onClose} className="rounded-xl border border-gray-200 p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-16 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Memuat detail lead...
            </div>
          ) : error && !form ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">{error}</div>
          ) : form ? (
            <div className="space-y-5">
              {(error || success) && (
                <div className={`rounded-2xl px-4 py-3 text-sm ${error ? "border border-amber-200 bg-amber-50 text-amber-700" : "border border-green-200 bg-green-50 text-green-700"}`}>
                  {error ?? success}
                </div>
              )}

              <div className="grid gap-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">Nama</label>
                  <input value={form.name} onChange={(e) => setForm((prev) => prev ? { ...prev, name: e.target.value } : prev)} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#12672a] focus:outline-none focus:ring-2 focus:ring-[#12672a]/20" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">Nomor HP</label>
                  <input value={form.mobile} onChange={(e) => setForm((prev) => prev ? { ...prev, mobile: e.target.value } : prev)} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#12672a] focus:outline-none focus:ring-2 focus:ring-[#12672a]/20" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">Sumber</label>
                  <input value={form.source} onChange={(e) => setForm((prev) => prev ? { ...prev, source: e.target.value } : prev)} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#12672a] focus:outline-none focus:ring-2 focus:ring-[#12672a]/20" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">Status</label>
                  <select value={form.status} onChange={(e) => setForm((prev) => prev ? { ...prev, status: e.target.value as LeadStatus } : prev)} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#12672a] focus:outline-none focus:ring-2 focus:ring-[#12672a]/20">
                    <option value="uncontacted">Belum Dihubungi</option>
                    <option value="connected">Terhubung</option>
                    <option value="follow_up">Follow Up</option>
                    {isCollection && <option value="promise_to_pay">Janji Bayar</option>}
                    <option value="closed">Selesai</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">Dibuat</label>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500">{lead?.createdAt ? fmtDate(lead.createdAt, true) : "—"}</div>
                </div>
                {isCollection && (
                  <>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">Tunggakan</label>
                      <input type="number" min={1} value={form.outstanding} onChange={(e) => setForm((prev) => prev ? { ...prev, outstanding: e.target.value } : prev)} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#12672a] focus:outline-none focus:ring-2 focus:ring-[#12672a]/20" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">Cicilan / Bulan</label>
                      <input type="number" min={1} value={form.emi} onChange={(e) => setForm((prev) => prev ? { ...prev, emi: e.target.value } : prev)} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#12672a] focus:outline-none focus:ring-2 focus:ring-[#12672a]/20" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">Tanggal Jatuh Tempo</label>
                      <input type="date" value={form.emiDueDate} onChange={(e) => setForm((prev) => prev ? { ...prev, emiDueDate: e.target.value } : prev)} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#12672a] focus:outline-none focus:ring-2 focus:ring-[#12672a]/20" />
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-gray-200 bg-white px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button onClick={handleDelete} disabled={loading || saving || deleting || !lead} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Hapus Lead
            </button>
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50">Tutup</button>
              <button onClick={handleSave} disabled={loading || saving || deleting || !form} className="inline-flex items-center gap-2 rounded-xl bg-[#12672a] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0e5222] disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

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
    setSelectedLeadId(null);
    router.replace(`/dashboard/leads?tab=${tab}`, { scroll: false });
  }

  function handleLeadSaved(updated: Lead) {
    setRows((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].map((item) => (item.id === updated.id ? updated : item)),
    }));
  }

  function handleLeadDeleted(leadId: string) {
    setRows((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].filter((item) => item.id !== leadId),
    }));
    setTotals((prev) => ({
      ...prev,
      [activeTab]: Math.max(0, prev[activeTab] - 1),
    }));
  }

  const activeRows = useMemo(() => rows[activeTab], [rows, activeTab]);
  const totalPages = totalPagesByTab[activeTab];
  const total = totals[activeTab];
  const rangeStart = total === 0 ? 0 : (activePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(total, rangeStart + activeRows.length - 1);

  return (
    <>
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

        <div className="mb-4 flex items-start gap-2 rounded-xl border border-[#12672a]/15 bg-[#12672a]/5 px-4 py-3 text-sm text-[#12672a]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Klik baris lead atau ikon aksi untuk buka detail. Edit/delete sekarang langsung nyentuh endpoint backend, jadi kalau gagal ya ketahuan jelas backend rule-nya yang masih ngambek.
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {activeTab === "telesales" ? <TelesalesTable data={activeRows} loading={loading} onOpen={setSelectedLeadId} /> : <CollectionTable data={activeRows} loading={loading} onOpen={setSelectedLeadId} />}

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

      <LeadDetailModal tab={activeTab} leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} onSaved={handleLeadSaved} onDeleted={handleLeadDeleted} />
    </>
  );
}

function TelesalesTable({ data, loading, onOpen }: { data: Lead[]; loading: boolean; onOpen: (leadId: string) => void }) {
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
            <tr key={lead.id} className="hover:bg-gray-50/60 transition-colors group cursor-pointer" onClick={() => onOpen(lead.id)}>
              <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center shrink-0"><span className="text-xs font-bold text-primary">{lead.name.charAt(0)}</span></div><span className="font-medium text-gray-900">{lead.name}</span></div></td>
              <td className="px-5 py-4 text-gray-600 font-mono text-xs">{lead.mobile}</td>
              <td className="px-5 py-4"><span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium">{lead.source}</span></td>
              <td className="px-5 py-4"><StatusBadge status={lead.status} /></td>
              <td className="px-5 py-4 text-gray-500 text-xs">{fmtDate(lead.lastCallTime, true) ?? <span className="text-gray-300">—</span>}</td>
              <td className="px-5 py-4 text-gray-500 text-xs">{fmtDate(lead.createdAt) ?? lead.createdAt}</td>
              <td className="px-5 py-4 text-right"><button onClick={(e) => { e.stopPropagation(); onOpen(lead.id); }} className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center ml-auto"><MoreHorizontal className="w-4 h-4 text-gray-500" /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CollectionTable({ data, loading, onOpen }: { data: Lead[]; loading: boolean; onOpen: (leadId: string) => void }) {
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
              <tr key={lead.id} className="hover:bg-gray-50/60 transition-colors group cursor-pointer" onClick={() => onOpen(lead.id)}>
                <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center shrink-0"><span className="text-xs font-bold text-orange-600">{lead.name.charAt(0)}</span></div><span className="font-medium text-gray-900 whitespace-nowrap">{lead.name}</span></div></td>
                <td className="px-5 py-4 text-gray-600 font-mono text-xs">{lead.mobile}</td>
                <td className="px-5 py-4"><span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium">{lead.source}</span></td>
                <td className="px-5 py-4"><StatusBadge status={lead.status} /></td>
                <td className="px-5 py-4 text-right">{(lead.outstanding ?? 0) > 0 ? <span className="font-semibold text-red-600 text-xs">{formatRupiah(lead.outstanding ?? 0)}</span> : <span className="text-green-600 text-xs font-semibold">Lunas</span>}</td>
                <td className="px-5 py-4 text-right text-gray-600 text-xs font-medium">{formatRupiah(lead.emi ?? 0)}</td>
                <td className="px-5 py-4"><span className={`text-xs font-medium ${isOverdue ? "text-red-600 font-bold" : "text-gray-600"}`}>{lead.emiDueDate ?? "—"}{isOverdue && <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[10px]">LEWAT</span>}</span></td>
                <td className="px-5 py-4 text-gray-500 text-xs">{fmtDate(lead.lastCallTime, true) ?? <span className="text-gray-300">—</span>}</td>
                <td className="px-5 py-4 text-gray-500 text-xs">{fmtDate(lead.createdAt) ?? lead.createdAt}</td>
                <td className="px-5 py-4 text-right"><button onClick={(e) => { e.stopPropagation(); onOpen(lead.id); }} className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center ml-auto"><MoreHorizontal className="w-4 h-4 text-gray-500" /></button></td>
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
