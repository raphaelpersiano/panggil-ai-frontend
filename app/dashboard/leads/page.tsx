"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users, Plus, Upload, Search, ChevronDown,
  Phone, Clock, Calendar, MoreHorizontal,
  TrendingUp, Wallet,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────────────── */
type Status = "uncontacted" | "connected" | "follow_up" | "promise_to_pay" | "closed";
type Tab = "telesales" | "collection";

interface TelesalesLead {
  id: number;
  name: string;
  mobile: string;
  source: string;
  status: Status;
  lastCallTime: string | null;
  createdAt: string;
}

interface CollectionLead {
  id: number;
  name: string;
  mobile: string;
  source: string;
  status: Status;
  outstanding: number;
  emi: number;
  emiDueDate: string;
  lastCallTime: string | null;
  createdAt: string;
}

/* ─── Dummy Data ─────────────────────────────────────────────────────────── */
const telesalesLeads: TelesalesLead[] = [
  { id: 1,  name: "Budi Santoso",       mobile: "081234567890", source: "Facebook Ads",  status: "connected",       lastCallTime: "2026-03-19 14:32", createdAt: "2026-03-10" },
  { id: 2,  name: "Siti Rahayu",        mobile: "082345678901", source: "Instagram",     status: "follow_up",       lastCallTime: "2026-03-18 09:15", createdAt: "2026-03-10" },
  { id: 3,  name: "Andi Wijaya",        mobile: "083456789012", source: "Website",       status: "uncontacted",     lastCallTime: null,               createdAt: "2026-03-11" },
  { id: 4,  name: "Dewi Kusuma",        mobile: "084567890123", source: "Referral",      status: "promise_to_pay",  lastCallTime: "2026-03-17 16:00", createdAt: "2026-03-11" },
  { id: 5,  name: "Rizky Pratama",      mobile: "085678901234", source: "WhatsApp",      status: "closed",          lastCallTime: "2026-03-15 11:45", createdAt: "2026-03-12" },
  { id: 6,  name: "Fitriani Hasan",     mobile: "086789012345", source: "Tokopedia",     status: "uncontacted",     lastCallTime: null,               createdAt: "2026-03-13" },
  { id: 7,  name: "Hendra Gunawan",     mobile: "087890123456", source: "Cold Call",     status: "connected",       lastCallTime: "2026-03-19 10:20", createdAt: "2026-03-13" },
  { id: 8,  name: "Mega Lestari",       mobile: "088901234567", source: "Facebook Ads",  status: "follow_up",       lastCallTime: "2026-03-18 13:55", createdAt: "2026-03-14" },
  { id: 9,  name: "Agus Permana",       mobile: "089012345678", source: "Shopee",        status: "uncontacted",     lastCallTime: null,               createdAt: "2026-03-15" },
  { id: 10, name: "Yulia Anggraini",    mobile: "081123456789", source: "Referral",      status: "closed",          lastCallTime: "2026-03-16 08:30", createdAt: "2026-03-15" },
];

const collectionLeads: CollectionLead[] = [
  { id: 1,  name: "Bambang Sudarsono", mobile: "081298765432", source: "Internal DB",   status: "connected",      outstanding: 45000000,  emi: 2500000,  emiDueDate: "2026-03-25", lastCallTime: "2026-03-19 09:00", createdAt: "2026-03-01" },
  { id: 2,  name: "Rina Marlina",      mobile: "082187654321", source: "Internal DB",   status: "follow_up",      outstanding: 12500000,  emi: 850000,   emiDueDate: "2026-03-20", lastCallTime: "2026-03-17 14:10", createdAt: "2026-03-01" },
  { id: 3,  name: "Joko Susilo",       mobile: "083276543210", source: "Core Banking",  status: "uncontacted",    outstanding: 78000000,  emi: 4200000,  emiDueDate: "2026-03-22", lastCallTime: null,               createdAt: "2026-03-02" },
  { id: 4,  name: "Nisa Fadilah",      mobile: "084365432109", source: "Core Banking",  status: "promise_to_pay", outstanding: 5500000,   emi: 600000,   emiDueDate: "2026-03-21", lastCallTime: "2026-03-18 16:45", createdAt: "2026-03-02" },
  { id: 5,  name: "Arief Budiman",     mobile: "085454321098", source: "Internal DB",   status: "closed",         outstanding: 0,         emi: 1100000,  emiDueDate: "2026-03-18", lastCallTime: "2026-03-18 10:00", createdAt: "2026-03-03" },
  { id: 6,  name: "Lilis Suryani",     mobile: "086543210987", source: "CSV Import",    status: "uncontacted",    outstanding: 33000000,  emi: 1800000,  emiDueDate: "2026-03-28", lastCallTime: null,               createdAt: "2026-03-05" },
  { id: 7,  name: "Doni Setiawan",     mobile: "087632109876", source: "Core Banking",  status: "connected",      outstanding: 18750000,  emi: 1250000,  emiDueDate: "2026-03-27", lastCallTime: "2026-03-19 11:30", createdAt: "2026-03-06" },
  { id: 8,  name: "Wulandari Putri",   mobile: "088721098765", source: "CSV Import",    status: "follow_up",      outstanding: 62000000,  emi: 3100000,  emiDueDate: "2026-03-24", lastCallTime: "2026-03-18 15:20", createdAt: "2026-03-07" },
  { id: 9,  name: "Fajar Nugroho",     mobile: "089810987654", source: "Internal DB",   status: "uncontacted",    outstanding: 9200000,   emi: 750000,   emiDueDate: "2026-03-30", lastCallTime: null,               createdAt: "2026-03-08" },
  { id: 10, name: "Citra Dewi",        mobile: "081909876543", source: "Core Banking",  status: "promise_to_pay", outstanding: 27500000,  emi: 2000000,  emiDueDate: "2026-03-26", lastCallTime: "2026-03-17 09:45", createdAt: "2026-03-09" },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const statusConfig: Record<Status, { label: string; className: string }> = {
  uncontacted:    { label: "Belum Dihubungi", className: "bg-gray-100 text-gray-600" },
  connected:      { label: "Terhubung",       className: "bg-blue-100 text-blue-700" },
  follow_up:      { label: "Follow Up",       className: "bg-amber-100 text-amber-700" },
  promise_to_pay: { label: "Janji Bayar",     className: "bg-purple-100 text-purple-700" },
  closed:         { label: "Selesai",         className: "bg-green-100 text-green-700" },
};

function StatusBadge({ status }: { status: Status }) {
  const cfg = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function LeadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) ?? "telesales";

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    setSearch("");
    setStatusFilter("all");
    router.replace(`/dashboard/leads?tab=${tab}`, { scroll: false });
  }

  const filteredTelesales = telesalesLeads.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.name.toLowerCase().includes(q) || l.mobile.includes(q) || l.source.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredCollection = collectionLeads.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.name.toLowerCase().includes(q) || l.mobile.includes(q) || l.source.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalTelesales = telesalesLeads.length;
  const totalCollection = collectionLeads.length;

  return (
    <div className="p-6 lg:p-8 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Kelola dan pantau semua prospek Anda
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/dashboard/leads/import?tab=${activeTab}`)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={() => router.push(`/dashboard/leads/create?tab=${activeTab}`)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary-dark transition-all shadow-sm shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Buat Lead
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-6">
        <button
          onClick={() => switchTab("telesales")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "telesales"
              ? "bg-white text-primary shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Telesales
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${activeTab === "telesales" ? "bg-primary/10 text-primary" : "bg-gray-200 text-gray-500"}`}>
            {totalTelesales}
          </span>
        </button>
        <button
          onClick={() => switchTab("collection")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "collection"
              ? "bg-white text-primary shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Wallet className="w-4 h-4" />
          Collection
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${activeTab === "collection" ? "bg-primary/10 text-primary" : "bg-gray-200 text-gray-500"}`}>
            {totalCollection}
          </span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama, nomor, atau sumber..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Status | "all")}
            className="appearance-none pl-3 pr-9 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-700 cursor-pointer"
          >
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

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {activeTab === "telesales" ? (
          <TelesalesTable data={filteredTelesales} />
        ) : (
          <CollectionTable data={filteredCollection} />
        )}
      </div>

      {/* Footer count */}
      <p className="text-xs text-gray-400 mt-3 text-right">
        Menampilkan {activeTab === "telesales" ? filteredTelesales.length : filteredCollection.length} dari{" "}
        {activeTab === "telesales" ? totalTelesales : totalCollection} leads
      </p>
    </div>
  );
}

/* ─── Telesales Table ────────────────────────────────────────────────────── */
function TelesalesTable({ data }: { data: TelesalesLead[] }) {
  if (data.length === 0) return <EmptyState />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60">
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Nama</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
              <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />Nomor</span>
            </th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Sumber</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Status</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Terakhir Dihubungi</span>
            </th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Dibuat</span>
            </th>
            <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((lead) => (
            <tr key={lead.id} className="hover:bg-gray-50/60 transition-colors group">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{lead.name.charAt(0)}</span>
                  </div>
                  <span className="font-medium text-gray-900">{lead.name}</span>
                </div>
              </td>
              <td className="px-5 py-4 text-gray-600 font-mono text-xs">{lead.mobile}</td>
              <td className="px-5 py-4">
                <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium">{lead.source}</span>
              </td>
              <td className="px-5 py-4"><StatusBadge status={lead.status} /></td>
              <td className="px-5 py-4 text-gray-500 text-xs">
                {lead.lastCallTime ?? <span className="text-gray-300">—</span>}
              </td>
              <td className="px-5 py-4 text-gray-500 text-xs">{lead.createdAt}</td>
              <td className="px-5 py-4 text-right">
                <button className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center ml-auto">
                  <MoreHorizontal className="w-4 h-4 text-gray-500" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Collection Table ───────────────────────────────────────────────────── */
function CollectionTable({ data }: { data: CollectionLead[] }) {
  if (data.length === 0) return <EmptyState />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60">
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Nama</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
              <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />Nomor</span>
            </th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Sumber</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Status</th>
            <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Tunggakan</th>
            <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Cicilan/Bln</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Jatuh Tempo</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Terakhir Dihubungi</span>
            </th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Dibuat</span>
            </th>
            <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((lead) => {
            const isOverdue = new Date(lead.emiDueDate) < new Date() && lead.outstanding > 0;
            return (
              <tr key={lead.id} className="hover:bg-gray-50/60 transition-colors group">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-orange-600">{lead.name.charAt(0)}</span>
                    </div>
                    <span className="font-medium text-gray-900 whitespace-nowrap">{lead.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-600 font-mono text-xs">{lead.mobile}</td>
                <td className="px-5 py-4">
                  <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium">{lead.source}</span>
                </td>
                <td className="px-5 py-4"><StatusBadge status={lead.status} /></td>
                <td className="px-5 py-4 text-right">
                  {lead.outstanding > 0 ? (
                    <span className="font-semibold text-red-600 text-xs">{formatRupiah(lead.outstanding)}</span>
                  ) : (
                    <span className="text-green-600 text-xs font-semibold">Lunas</span>
                  )}
                </td>
                <td className="px-5 py-4 text-right text-gray-600 text-xs font-medium">{formatRupiah(lead.emi)}</td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-medium ${isOverdue ? "text-red-600 font-bold" : "text-gray-600"}`}>
                    {lead.emiDueDate}
                    {isOverdue && <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[10px]">LEWAT</span>}
                  </span>
                </td>
                <td className="px-5 py-4 text-gray-500 text-xs">
                  {lead.lastCallTime ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-5 py-4 text-gray-500 text-xs">{lead.createdAt}</td>
                <td className="px-5 py-4 text-right">
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center ml-auto">
                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Empty State ────────────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Users className="w-7 h-7 text-gray-400" />
      </div>
      <p className="text-gray-600 font-medium">Tidak ada leads ditemukan</p>
      <p className="text-gray-400 text-sm mt-1">Coba ubah filter atau kata kunci pencarian.</p>
    </div>
  );
}
