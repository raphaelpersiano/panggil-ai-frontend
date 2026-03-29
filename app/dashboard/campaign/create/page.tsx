"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronUp, Plus, X, Zap, Calendar, Users, CheckSquare, Square, Clock, Search, Filter, Lightbulb, Info, AlertCircle } from "lucide-react";
import { createCampaign, listLeads } from "@/lib/api";
import type { CreateCampaignPayload, Lead, LeadStatus, Occasion, ScheduleMode } from "@/lib/types";

const DAYS = [
  { id: 1, short: "Sen", full: "Senin" },
  { id: 2, short: "Sel", full: "Selasa" },
  { id: 3, short: "Rab", full: "Rabu" },
  { id: 4, short: "Kam", full: "Kamis" },
  { id: 5, short: "Jum", full: "Jumat" },
  { id: 6, short: "Sab", full: "Sabtu" },
  { id: 0, short: "Min", full: "Minggu" },
];

const STATUS_LABELS: Record<LeadStatus, string> = {
  uncontacted: "Belum Dihubungi",
  connected: "Terhubung",
  follow_up: "Follow Up",
  promise_to_pay: "Promise to Pay",
  closed: "Closed",
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  uncontacted: "bg-gray-100 text-gray-500",
  connected: "bg-blue-50 text-blue-600",
  follow_up: "bg-amber-50 text-amber-600",
  promise_to_pay: "bg-purple-50 text-purple-600",
  closed: "bg-green-50 text-green-700",
};

function Section({ num, title, icon: Icon, children }: { num: string; title: string; icon: React.ElementType; children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"><div className="flex items-center gap-3 mb-5"><span className="text-[11px] font-bold text-[#12672a] bg-[#12672a]/10 px-2 py-0.5 rounded-full tracking-wide">{num}</span><div className="w-6 h-6 rounded-lg bg-[#12672a]/10 flex items-center justify-center"><Icon className="w-3.5 h-3.5 text-[#12672a]" /></div><h2 className="text-sm font-semibold text-gray-800">{title}</h2></div>{children}</div>;
}
function Label({ children, hint }: { children: React.ReactNode; hint?: string }) { return <div className="mb-1.5"><label className="block text-xs font-medium text-gray-600">{children}</label>{hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}</div>; }
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) { return <input {...props} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#12672a]/30 focus:border-[#12672a] transition-all placeholder:text-gray-300 bg-white disabled:bg-gray-50 disabled:text-gray-400" />; }

function CreateCampaignForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = ((searchParams.get("type") ?? "telesales") as Occasion);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("scheduled");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [dayTimes, setDayTimes] = useState<Record<number, string[]>>({ 1: ["09:00"], 2: ["09:00"], 3: ["09:00"], 4: ["09:00"], 5: ["09:00"] });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maxRetries, setMaxRetries] = useState(3);
  const [retryMinutes, setRetryMinutes] = useState(30);
  const [searchQ, setSearchQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [sortFilter, setSortFilter] = useState<"newest" | "oldest" | "last_call">("newest");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [leadMode, setLeadMode] = useState<"explicit" | "filter">("explicit");
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadLeads() {
      setLoadingLeads(true);
      setLoadError(null);
      try {
        const response = await listLeads({ type: initialType, page: 1, limit: 100, status: statusFilter, search: searchQ, sortBy: sortFilter });
        if (cancelled) return;
        setAllLeads(response.data);
        setMatchedCount(response.meta?.total ?? response.data.length);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Gagal memuat leads.");
      } finally {
        if (!cancelled) setLoadingLeads(false);
      }
    }
    loadLeads();
    return () => { cancelled = true; };
  }, [initialType, searchQ, statusFilter, sortFilter]);

  const filteredLeads = useMemo(() => allLeads, [allLeads]);
  const allFilteredSelected = filteredLeads.length > 0 && filteredLeads.every((l) => selectedIds.has(l.id));
  const selectedCount = selectedIds.size;
  const canSubmit = scheduleMode === "immediate" ? !!name && (leadMode === "filter" ? matchedCount > 0 : selectedCount > 0) : !!name && !!startDate && !!endDate && selectedDays.length > 0 && (leadMode === "filter" ? matchedCount > 0 : selectedCount > 0);

  function toggleDay(id: number) {
    setSelectedDays((prev) => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]);
    setDayTimes((prev) => {
      if (id in prev) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: ["09:00"] };
    });
  }
  function updateDayTime(dayId: number, index: number, time: string) { setDayTimes((prev) => ({ ...prev, [dayId]: (prev[dayId] ?? ["09:00"]).map((item, i) => i === index ? time : item) })); }
  function addDayTime(dayId: number) { setDayTimes((prev) => ({ ...prev, [dayId]: [...(prev[dayId] ?? ["09:00"]), "09:00"] })); }
  function removeDayTime(dayId: number, index: number) { setDayTimes((prev) => ({ ...prev, [dayId]: (prev[dayId] ?? []).filter((_, i) => i !== index).length ? (prev[dayId] ?? []).filter((_, i) => i !== index) : ["09:00"] })); }
  function toggleLead(id: string) { setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; }); }
  function toggleSelectAllFiltered() { setSelectedIds((prev) => { const next = new Set(prev); if (allFilteredSelected) filteredLeads.forEach((l) => next.delete(l.id)); else filteredLeads.forEach((l) => next.add(l.id)); return next; }); setLeadMode("explicit"); }
  function clearAll() { setSelectedIds(new Set()); setLeadMode("explicit"); }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const normalizedDayTimes = Object.fromEntries(Object.entries(dayTimes).filter(([key]) => selectedDays.includes(Number(key))).map(([key, values]) => [key, values.filter(Boolean)]));
      const payload: CreateCampaignPayload = {
        name: name.trim(),
        description: description.trim() || undefined,
        type: initialType,
        scheduleMode,
        startDate: scheduleMode === "scheduled" ? startDate : undefined,
        endDate: scheduleMode === "scheduled" ? endDate : undefined,
        selectedDays: scheduleMode === "scheduled" ? selectedDays : undefined,
        dayTimes: scheduleMode === "scheduled" ? normalizedDayTimes : undefined,
        maxRetries,
        retryIntervalMinutes: retryMinutes,
        maxConcurrent: 10,
        leadSelection: leadMode === "filter" ? { mode: "filter", filter: { status: statusFilter !== "all" ? statusFilter : undefined, search: searchQ || undefined } } : { mode: "explicit", leadIds: Array.from(selectedIds) },
      };
      await createCampaign(payload);
      router.push("/dashboard/campaign");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat campaign.");
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="min-h-screen bg-gray-50">
    <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3"><button onClick={() => router.back()} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"><ArrowLeft className="w-4 h-4 text-gray-500" /></button><div><h1 className="text-base font-bold text-gray-900">Buat Campaign Baru</h1><p className="text-xs text-gray-400">Form ini sekarang kirim ke backend sungguhan.</p></div></div>
      <div className="flex items-center gap-2"><button onClick={() => router.back()} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Batal</button><button onClick={handleSubmit} disabled={!canSubmit || submitting} className="px-4 py-2 bg-[#12672a] hover:bg-[#0e5222] text-white text-sm font-medium rounded-xl transition-colors shadow-md shadow-green-800/20 disabled:opacity-50">{submitting ? "Menyimpan..." : `Buat Campaign (${leadMode === "filter" ? matchedCount : selectedCount} leads)`}</button></div>
    </div>

    <div className="max-w-4xl mx-auto px-8 py-8 space-y-6">
      {(error || loadError) && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{error ?? loadError}</span></div>}
      <Section num="01" title="Detail Campaign" icon={Filter}><div className="grid grid-cols-1 md:grid-cols-2 gap-5"><div className="md:col-span-2"><Label hint="Nama yang mudah dikenali untuk campaign ini">Nama Campaign *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="cth. Promo April 2026 – Paket SME" /></div><div><Label hint="Tipe leads dan agent yang digunakan">Tipe Campaign</Label><div className="flex items-center h-10 px-4 rounded-xl border border-[#12672a] bg-[#12672a]/5 w-fit gap-2"><span className="w-2 h-2 rounded-full bg-[#12672a]" /><span className="text-sm font-semibold text-[#12672a]">{initialType === "telesales" ? "Telesales" : "Collection"}</span></div></div><div><Label hint="Opsional — catatan internal tentang campaign">Deskripsi</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="cth. Target leads Facebook Ads bulan April" /></div></div></Section>
      <Section num="02" title="Jadwal & Durasi" icon={Calendar}><div className="flex gap-3 mb-6">{([{ val: "immediate", icon: Zap, label: "Mulai Sekarang", desc: "Campaign dimulai segera setelah dibuat" }, { val: "scheduled", icon: Calendar, label: "Jadwalkan", desc: "Tentukan hari, jam, dan tanggal mulai" }] as const).map((opt) => <button key={opt.val} onClick={() => setScheduleMode(opt.val)} className={`flex-1 flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${scheduleMode === opt.val ? "bg-[#12672a]/5 border-[#12672a]" : "border-gray-200 hover:border-gray-300"}`}><div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${scheduleMode === opt.val ? "bg-[#12672a]/10" : "bg-gray-100"}`}><opt.icon className={`w-4 h-4 ${scheduleMode === opt.val ? "text-[#12672a]" : "text-gray-400"}`} /></div><div><p className={`text-sm font-semibold ${scheduleMode === opt.val ? "text-[#12672a]" : "text-gray-700"}`}>{opt.label}</p><p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p></div></button>)}</div>{scheduleMode === "scheduled" && <><div className="grid grid-cols-1 md:grid-cols-2 gap-5"><div><Label hint="Tanggal pertama campaign mulai berjalan">Tanggal Mulai *</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div><div><Label hint="Campaign akan berhenti otomatis setelah tanggal ini">Tanggal Berakhir *</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div></div><div className="mt-5 space-y-5"><div><Label hint="Hari di mana panggilan boleh dilakukan">Hari Aktif *</Label><div className="flex flex-wrap gap-2 mt-2">{DAYS.map((day) => { const active = selectedDays.includes(day.id); return <button key={day.id} onClick={() => toggleDay(day.id)} className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${active ? "bg-[#12672a] border-[#12672a] text-white shadow-sm shadow-green-800/20" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>{day.full}</button>; })}</div></div>{selectedDays.length > 0 && <div><Label hint="Tambahkan satu atau lebih waktu mulai panggilan per hari">Waktu Panggilan per Hari *</Label><div className="mt-2 border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">{DAYS.filter((d) => selectedDays.includes(d.id)).map((day) => <div key={day.id} className="flex items-start gap-3 px-4 py-3 bg-white hover:bg-gray-50/50 transition-colors"><div className="w-14 shrink-0 pt-1.5"><span className="text-xs font-semibold text-gray-600">{day.full}</span></div><div className="flex flex-wrap items-center gap-2 flex-1">{(dayTimes[day.id] ?? ["09:00"]).map((t, idx) => <div key={idx} className="inline-flex items-center gap-1.5 bg-[#12672a]/10 border border-[#12672a]/20 rounded-lg px-2.5 py-1.5 group"><Clock className="w-3 h-3 text-[#12672a]/70 shrink-0" /><input type="time" value={t} onChange={(e) => updateDayTime(day.id, idx, e.target.value)} className="text-xs font-medium text-[#12672a] bg-transparent outline-none w-[72px] tabular-nums" />{(dayTimes[day.id] ?? ["09:00"]).length > 1 && <button type="button" onClick={() => removeDayTime(day.id, idx)} className="w-3.5 h-3.5 rounded-full hover:bg-red-100 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors shrink-0"><X className="w-2.5 h-2.5" /></button>}</div>)}<button type="button" onClick={() => addDayTime(day.id)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-[#12672a] hover:text-[#12672a] hover:bg-[#12672a]/5 transition-all text-xs font-medium"><Plus className="w-3 h-3" />Tambah</button></div></div>)}</div></div>}</div></>}</Section>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"><button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/60 transition-colors"><div className="flex items-center gap-3"><span className="text-[11px] font-bold text-[#12672a] bg-[#12672a]/10 px-2 py-0.5 rounded-full tracking-wide">03</span><div className="w-6 h-6 rounded-lg bg-[#12672a]/10 flex items-center justify-center"><Filter className="w-3.5 h-3.5 text-[#12672a]" /></div><h2 className="text-sm font-semibold text-gray-800">Pengaturan Panggilan</h2><span className="text-xs text-gray-400">(Opsional)</span></div>{showAdvanced ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}</button>{showAdvanced && <div className="px-6 pb-6 border-t border-gray-50 pt-5"><div className="grid grid-cols-1 sm:grid-cols-3 gap-5"><div><Label hint="Berapa kali mencoba kembali jika panggilan tidak diangkat">Maks. Percobaan Ulang</Label><div className="relative"><Input type="number" min={1} max={10} value={maxRetries} onChange={(e) => setMaxRetries(+e.target.value)} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">kali</span></div></div><div><Label hint="Jeda waktu antar percobaan ulang ke lead yang sama">Interval Percobaan Ulang</Label><div className="relative"><Input type="number" min={15} max={120} value={retryMinutes} onChange={(e) => setRetryMinutes(+e.target.value)} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">menit</span></div></div><div><Label hint="Jumlah panggilan simultan yang dapat dilakukan campaign ini">Maks. Panggilan Bersamaan</Label><div className="relative"><Input type="number" value={10} disabled /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">saluran</span></div></div></div><div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4"><div className="flex items-start gap-2.5"><Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /><div><p className="text-xs font-semibold text-amber-700 mb-2">Catatan integrasi</p><ul className="space-y-1.5 text-xs text-amber-700/80"><li>• Frontend mengirim <strong>scheduleMode</strong>, <strong>selectedDays</strong>, dan <strong>dayTimes</strong> persis ke backend.</li><li>• Jika backend menolak validasi ini, masalahnya ada di kontrak beng, bukan di UI.</li></ul></div></div></div></div>}</div>
      <Section num="04" title="Pilih Leads" icon={Users}><div className="flex flex-wrap items-center gap-3 mb-4"><div className="relative flex-1 min-w-[180px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" /><input type="text" placeholder="Cari nama / nomor..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#12672a]/30 focus:border-[#12672a] transition-all placeholder:text-gray-300" /></div><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "all")} className="px-3 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#12672a]/30 focus:border-[#12672a] bg-white"><option value="all">Semua Status</option>{(Object.keys(STATUS_LABELS) as LeadStatus[]).filter((s) => initialType === "collection" || s !== "promise_to_pay").map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select><select value={sortFilter} onChange={(e) => setSortFilter(e.target.value as typeof sortFilter)} className="px-3 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#12672a]/30 focus:border-[#12672a] bg-white"><option value="newest">Terbaru Dibuat</option><option value="oldest">Terlama Dibuat</option><option value="last_call">Terakhir Dihubungi</option></select></div><div className="mb-4 flex items-center gap-2 text-xs"><button onClick={() => setLeadMode("explicit")} className={`px-3 py-1.5 rounded-full border ${leadMode === "explicit" ? "bg-[#12672a] text-white border-[#12672a]" : "border-gray-200 text-gray-500"}`}>Pilih manual</button><button onClick={() => setLeadMode("filter")} disabled={matchedCount === 0} className={`px-3 py-1.5 rounded-full border ${leadMode === "filter" ? "bg-[#12672a] text-white border-[#12672a]" : "border-gray-200 text-gray-500"} disabled:opacity-50`}>Gunakan semua hasil filter ({matchedCount})</button></div><div className="flex items-center justify-between mb-3 px-1"><div className="flex items-center gap-3"><button onClick={toggleSelectAllFiltered} className="flex items-center gap-1.5 text-xs font-medium text-[#12672a] hover:text-[#0e5222] transition-colors">{allFilteredSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}{allFilteredSelected ? "Batalkan Semua Hasil Filter" : `Pilih Semua Hasil Filter (${filteredLeads.length})`}</button>{selectedCount > 0 && <button onClick={clearAll} className="text-xs text-red-400 hover:text-red-600 transition-colors">Hapus Pilihan</button>}</div><span className="text-xs font-semibold text-[#12672a] bg-[#12672a]/10 px-2.5 py-1 rounded-full">Mode: {leadMode === "filter" ? `${matchedCount} leads dari filter backend` : `${selectedCount} leads dipilih`}</span></div><div className="border border-gray-200 rounded-xl overflow-hidden"><table className="w-full"><thead><tr className="bg-gray-50 border-b border-gray-200"><th className="w-10 px-4 py-2.5" /><th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Nama</th><th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Nomor HP</th><th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th><th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Dibuat</th></tr></thead><tbody className="divide-y divide-gray-100">{loadingLeads ? <tr><td colSpan={5} className="text-center py-10 text-sm text-gray-400">Memuat leads...</td></tr> : filteredLeads.length === 0 ? <tr><td colSpan={5} className="text-center py-10 text-sm text-gray-400">Tidak ada leads yang sesuai filter</td></tr> : filteredLeads.map((lead) => { const checked = selectedIds.has(lead.id); return <tr key={lead.id} onClick={() => toggleLead(lead.id)} className={`cursor-pointer transition-colors ${checked ? "bg-[#12672a]/5" : "hover:bg-gray-50/60"}`}><td className="px-4 py-3 text-center"><div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all mx-auto ${checked ? "bg-[#12672a] border-[#12672a]" : "border-gray-300"}`}>{checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10"><path d="M1.5 5l2.5 2.5 4.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}</div></td><td className="px-4 py-3"><p className="text-sm font-medium text-gray-800">{lead.name}</p><p className="text-xs text-gray-400 sm:hidden">{lead.mobile}</p></td><td className="px-4 py-3 hidden sm:table-cell"><span className="text-sm text-gray-500 tabular-nums">{lead.mobile}</span></td><td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status]}`}>{STATUS_LABELS[lead.status]}</span></td><td className="px-4 py-3 hidden md:table-cell"><span className="text-xs text-gray-400">{lead.createdAt}</span></td></tr>; })}</tbody></table></div><div className="mt-3 flex items-start gap-1.5 text-xs text-gray-400"><Info className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span>Frontend sekarang bergantung pada <strong>GET /leads</strong> untuk picker ini. Jika hanya 100 leads keluar, itu limit backend saat ini — belum usable untuk dataset besar.</span></div></Section>
      <div className="h-4" />
    </div>
  </div>;
}

export default function CreateCampaignPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-8 h-8 border-4 border-[#12672a] border-t-transparent rounded-full animate-spin" /></div>}><CreateCampaignForm /></Suspense>;
}
