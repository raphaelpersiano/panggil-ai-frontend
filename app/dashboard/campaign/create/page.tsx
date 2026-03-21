"use client";

import { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, ChevronDown, ChevronUp, Plus, X,
  Zap, Calendar, Users, CheckSquare, Square,
  Clock, Search, Filter, Lightbulb, Info,
} from "lucide-react";

/* ─── Types ───────────────────────────────────────────────── */
type CampaignType = "telesales" | "collection";
type ScheduleMode = "immediate" | "scheduled";
type LeadStatus = "uncontacted" | "connected" | "follow_up" | "promise_to_pay" | "closed";

interface Lead {
  id: string;
  name: string;
  mobile: string;
  source: string;
  status: LeadStatus;
  lastCallTime: string | null;
  createdAt: string;
}


/* ─── Dummy lead pools ────────────────────────────────────── */
const ALL_TELESALES_LEADS: Lead[] = [
  { id: "ts-1",  name: "Budi Santoso",    mobile: "081234567890", source: "Facebook Ads", status: "connected",      lastCallTime: "2026-03-19 14:32", createdAt: "2026-03-10" },
  { id: "ts-2",  name: "Siti Rahayu",     mobile: "082345678901", source: "Instagram",    status: "follow_up",      lastCallTime: "2026-03-18 09:15", createdAt: "2026-03-10" },
  { id: "ts-3",  name: "Andi Wijaya",     mobile: "083456789012", source: "Website",      status: "uncontacted",    lastCallTime: null,               createdAt: "2026-03-11" },
  { id: "ts-4",  name: "Dewi Kusuma",     mobile: "084567890123", source: "Referral",     status: "promise_to_pay", lastCallTime: "2026-03-17 16:00", createdAt: "2026-03-11" },
  { id: "ts-5",  name: "Rizky Pratama",   mobile: "085678901234", source: "WhatsApp",     status: "closed",         lastCallTime: "2026-03-15 11:45", createdAt: "2026-03-12" },
  { id: "ts-6",  name: "Fitriani Hasan",  mobile: "086789012345", source: "Tokopedia",    status: "uncontacted",    lastCallTime: null,               createdAt: "2026-03-13" },
  { id: "ts-7",  name: "Hendra Gunawan",  mobile: "087890123456", source: "Cold Call",    status: "connected",      lastCallTime: "2026-03-19 10:20", createdAt: "2026-03-13" },
  { id: "ts-8",  name: "Mega Lestari",    mobile: "088901234567", source: "Facebook Ads", status: "follow_up",      lastCallTime: "2026-03-18 13:55", createdAt: "2026-03-14" },
  { id: "ts-9",  name: "Agus Permana",    mobile: "089012345678", source: "Shopee",       status: "uncontacted",    lastCallTime: null,               createdAt: "2026-03-15" },
  { id: "ts-10", name: "Yulia Anggraini", mobile: "081123456789", source: "Referral",     status: "closed",         lastCallTime: "2026-03-16 08:30", createdAt: "2026-03-15" },
];

const ALL_COLLECTION_LEADS: Lead[] = [
  { id: "col-1",  name: "Bambang Sudarsono", mobile: "081298765432", source: "Internal DB",  status: "connected",      lastCallTime: "2026-03-19 09:00", createdAt: "2026-03-01" },
  { id: "col-2",  name: "Rina Marlina",      mobile: "082187654321", source: "Internal DB",  status: "follow_up",      lastCallTime: "2026-03-17 14:10", createdAt: "2026-03-01" },
  { id: "col-3",  name: "Joko Susilo",       mobile: "083276543210", source: "Core Banking", status: "uncontacted",    lastCallTime: null,               createdAt: "2026-03-02" },
  { id: "col-4",  name: "Nisa Fadilah",      mobile: "084365432109", source: "Core Banking", status: "promise_to_pay", lastCallTime: "2026-03-18 16:45", createdAt: "2026-03-02" },
  { id: "col-5",  name: "Arief Budiman",     mobile: "085454321098", source: "Internal DB",  status: "closed",         lastCallTime: "2026-03-18 10:00", createdAt: "2026-03-03" },
  { id: "col-6",  name: "Lilis Suryani",     mobile: "086543210987", source: "CSV Import",   status: "uncontacted",    lastCallTime: null,               createdAt: "2026-03-05" },
  { id: "col-7",  name: "Doni Setiawan",     mobile: "087632109876", source: "Core Banking", status: "connected",      lastCallTime: "2026-03-19 11:30", createdAt: "2026-03-06" },
  { id: "col-8",  name: "Wulandari Putri",   mobile: "088721098765", source: "CSV Import",   status: "follow_up",      lastCallTime: "2026-03-18 15:20", createdAt: "2026-03-07" },
  { id: "col-9",  name: "Teguh Prabowo",     mobile: "089810987654", source: "Internal DB",  status: "uncontacted",    lastCallTime: null,               createdAt: "2026-03-08" },
  { id: "col-10", name: "Indah Permatasari", mobile: "081909876543", source: "Core Banking", status: "promise_to_pay", lastCallTime: "2026-03-16 13:00", createdAt: "2026-03-09" },
];

/* ─── Constants ───────────────────────────────────────────── */
const DAYS = [
  { id: 1, short: "Sen", full: "Senin"  },
  { id: 2, short: "Sel", full: "Selasa" },
  { id: 3, short: "Rab", full: "Rabu"   },
  { id: 4, short: "Kam", full: "Kamis"  },
  { id: 5, short: "Jum", full: "Jumat"  },
  { id: 6, short: "Sab", full: "Sabtu"  },
  { id: 0, short: "Min", full: "Minggu" },
];

const STATUS_LABELS: Record<LeadStatus, string> = {
  uncontacted:    "Belum Dihubungi",
  connected:      "Terhubung",
  follow_up:      "Follow Up",
  promise_to_pay: "Promise to Pay",
  closed:         "Closed",
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  uncontacted:    "bg-gray-100 text-gray-500",
  connected:      "bg-blue-50 text-blue-600",
  follow_up:      "bg-amber-50 text-amber-600",
  promise_to_pay: "bg-purple-50 text-purple-600",
  closed:         "bg-green-50 text-green-700",
};

/* ─── Section wrapper ─────────────────────────────────────── */
function Section({ num, title, icon: Icon, children }: { num: string; title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <span className="text-[11px] font-bold text-[#12672a] bg-[#12672a]/10 px-2 py-0.5 rounded-full tracking-wide">{num}</span>
        <div className="w-6 h-6 rounded-lg bg-[#12672a]/10 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-[#12672a]" />
        </div>
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5">
      <label className="block text-xs font-medium text-gray-600">{children}</label>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#12672a]/30 focus:border-[#12672a] transition-all placeholder:text-gray-300 bg-white disabled:bg-gray-50 disabled:text-gray-400"
    />
  );
}

/* ─── Inner component (uses useSearchParams) ─────────────── */
function CreateCampaignForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const initialType  = (searchParams.get("type") ?? "telesales") as CampaignType;

  /* form state */
  const [name,         setName]        = useState("");
  const [description,  setDescription] = useState("");
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("scheduled");
  const [startDate,    setStartDate]   = useState("");
  const [endDate,      setEndDate]     = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [dayTimes,     setDayTimes]    = useState<Record<number, string[]>>({ 1: ["09:00"], 2: ["09:00"], 3: ["09:00"], 4: ["09:00"], 5: ["09:00"] });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maxRetries,   setMaxRetries]  = useState(3);
  const [retryMinutes, setRetryMinutes] = useState(30);
  const [searchQ,      setSearchQ]     = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [sortFilter,   setSortFilter]  = useState<"newest" | "oldest" | "last_call">("newest");
  const [selectedIds,  setSelectedIds] = useState<Set<string>>(new Set());

  const allLeads = initialType === "telesales" ? ALL_TELESALES_LEADS : ALL_COLLECTION_LEADS;

  /* filtered leads */
  const filteredLeads = useMemo(() => {
    let result = allLeads;
    if (statusFilter !== "all") result = result.filter(l => l.status === statusFilter);
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      result = result.filter(l => l.name.toLowerCase().includes(q) || l.mobile.includes(q));
    }
    if (sortFilter === "newest")    result = [...result].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sortFilter === "oldest")    result = [...result].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    if (sortFilter === "last_call") result = [...result].sort((a, b) => (b.lastCallTime ?? "").localeCompare(a.lastCallTime ?? ""));
    return result;
  }, [allLeads, statusFilter, searchQ, sortFilter]);

  const allFilteredSelected = filteredLeads.length > 0 && filteredLeads.every(l => selectedIds.has(l.id));

  function toggleDay(id: number) {
    setSelectedDays(prev => {
      if (prev.includes(id)) {
        setDayTimes(dt => { const n = { ...dt }; delete n[id]; return n; });
        return prev.filter(d => d !== id);
      } else {
        setDayTimes(dt => ({ ...dt, [id]: ["09:00"] }));
        return [...prev, id];
      }
    });
  }

  function updateDayTime(dayId: number, index: number, time: string) {
    setDayTimes(prev => {
      const times = [...(prev[dayId] ?? ["09:00"])];
      times[index] = time;
      return { ...prev, [dayId]: times };
    });
  }

  function addDayTime(dayId: number) {
    setDayTimes(prev => {
      const times = prev[dayId] ?? ["09:00"];
      // default new slot = last time + 1 hour, capped at 23:00
      const last = times[times.length - 1] ?? "09:00";
      const [h, m] = last.split(":").map(Number);
      const newH = Math.min(h + 1, 23);
      const newTime = `${String(newH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      return { ...prev, [dayId]: [...times, newTime] };
    });
  }

  function removeDayTime(dayId: number, index: number) {
    setDayTimes(prev => {
      const times = (prev[dayId] ?? []).filter((_, i) => i !== index);
      return { ...prev, [dayId]: times.length > 0 ? times : ["09:00"] };
    });
  }

  function toggleLead(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAllFiltered() {
    if (allFilteredSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredLeads.forEach(l => next.delete(l.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredLeads.forEach(l => next.add(l.id));
        return next;
      });
    }
  }

  function clearAll() {
    setSelectedIds(new Set());
  }

  const selectedCount = selectedIds.size;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </button>
          <div>
            <h1 className="text-base font-bold text-gray-900">Buat Campaign Baru</h1>
            <p className="text-xs text-gray-400">Isi detail di bawah lalu klik "Buat Campaign"</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            className="px-4 py-2 bg-[#12672a] hover:bg-[#0e5222] text-white text-sm font-medium rounded-xl transition-colors shadow-md shadow-green-800/20 disabled:opacity-50"
            disabled={scheduleMode === "immediate"
              ? (!name || selectedCount === 0)
              : (!name || !startDate || selectedDays.length === 0 || !endDate || selectedCount === 0)}
          >
            Buat Campaign ({selectedCount} leads)
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8 space-y-6">

        {/* ── 01 Detail Campaign ── */}
        <Section num="01" title="Detail Campaign" icon={Filter}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <Label hint="Nama yang mudah dikenali untuk campaign ini">Nama Campaign *</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="cth. Promo April 2026 – Paket SME"
              />
            </div>

            <div>
              <Label hint="Tipe leads dan agent yang digunakan">Tipe Campaign</Label>
              <div className="flex items-center h-10 px-4 rounded-xl border border-[#12672a] bg-[#12672a]/5 w-fit gap-2">
                <span className="w-2 h-2 rounded-full bg-[#12672a]" />
                <span className="text-sm font-semibold text-[#12672a]">
                  {initialType === "telesales" ? "Telesales" : "Collection"}
                </span>
              </div>
            </div>

            <div>
              <Label hint="Opsional — catatan internal tentang campaign">Deskripsi</Label>
              <Input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="cth. Target leads Facebook Ads bulan April"
              />
            </div>
          </div>
        </Section>

        {/* ── 02 Jadwal & Durasi ── */}
        <Section num="02" title="Jadwal & Durasi" icon={Calendar}>
          {/* Mode toggle */}
          <div className="flex gap-3 mb-6">
            {([
              { val: "immediate", icon: Zap,      label: "Mulai Sekarang",  desc: "Campaign dimulai segera setelah dibuat" },
              { val: "scheduled", icon: Calendar, label: "Jadwalkan",        desc: "Tentukan hari, jam, dan tanggal mulai"  },
            ] as const).map(opt => (
              <button
                key={opt.val}
                onClick={() => setScheduleMode(opt.val)}
                className={`flex-1 flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                  scheduleMode === opt.val
                    ? "bg-[#12672a]/5 border-[#12672a]"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  scheduleMode === opt.val ? "bg-[#12672a]/10" : "bg-gray-100"
                }`}>
                  <opt.icon className={`w-4 h-4 ${scheduleMode === opt.val ? "text-[#12672a]" : "text-gray-400"}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${scheduleMode === opt.val ? "text-[#12672a]" : "text-gray-700"}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {scheduleMode === "scheduled" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label hint="Tanggal pertama campaign mulai berjalan">Tanggal Mulai *</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label hint="Campaign akan berhenti otomatis setelah tanggal ini">Tanggal Berakhir *</Label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
          )}

          {/* Day & time — only for scheduled */}
          {scheduleMode === "scheduled" && (
            <div className="mt-5 space-y-5">
              {/* Day picker */}
              <div>
                <Label hint="Hari di mana panggilan boleh dilakukan">Hari Aktif *</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {DAYS.map(day => {
                    const active = selectedDays.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        onClick={() => toggleDay(day.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                          active
                            ? "bg-[#12672a] border-[#12672a] text-white shadow-sm shadow-green-800/20"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {day.full}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setSelectedDays(DAYS.map(d => d.id))}
                    className="px-3 py-2 rounded-xl text-xs font-medium text-[#12672a] hover:bg-[#12672a]/5 transition-colors"
                  >
                    Pilih Semua
                  </button>
                  <button
                    onClick={() => setSelectedDays([])}
                    className="px-3 py-2 rounded-xl text-xs font-medium text-gray-400 hover:bg-gray-100 transition-colors"
                  >
                    Kosongkan
                  </button>
                </div>
              </div>

              {/* Per-day time chips */}
              {selectedDays.length > 0 && (
                <div>
                  <Label hint="Tambahkan satu atau lebih waktu mulai panggilan per hari">Waktu Panggilan per Hari *</Label>
                  <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                    {DAYS.filter(d => selectedDays.includes(d.id)).map(day => {
                      const times = dayTimes[day.id] ?? ["09:00"];
                      return (
                        <div key={day.id} className="flex items-start gap-3 px-4 py-3 bg-white hover:bg-gray-50/50 transition-colors">
                          {/* Day label */}
                          <div className="w-14 shrink-0 pt-1.5">
                            <span className="text-xs font-semibold text-gray-600">{day.full}</span>
                          </div>

                          {/* Chips + add button */}
                          <div className="flex flex-wrap items-center gap-2 flex-1">
                            {times.map((t, idx) => (
                              <div
                                key={idx}
                                className="inline-flex items-center gap-1.5 bg-[#12672a]/10 border border-[#12672a]/20 rounded-lg px-2.5 py-1.5 group"
                              >
                                <Clock className="w-3 h-3 text-[#12672a]/70 shrink-0" />
                                <input
                                  type="time"
                                  value={t}
                                  onChange={e => updateDayTime(day.id, idx, e.target.value)}
                                  className="text-xs font-medium text-[#12672a] bg-transparent outline-none w-[72px] tabular-nums"
                                />
                                {times.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeDayTime(day.id, idx)}
                                    className="w-3.5 h-3.5 rounded-full hover:bg-red-100 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors shrink-0"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            ))}

                            {/* Add time button */}
                            <button
                              type="button"
                              onClick={() => addDayTime(day.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-[#12672a] hover:text-[#12672a] hover:bg-[#12672a]/5 transition-all text-xs font-medium"
                            >
                              <Plus className="w-3 h-3" />
                              Tambah
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3 shrink-0" />
                    Setiap waktu yang ditambahkan akan menjadi trigger panggilan baru pada hari tersebut.
                  </p>
                </div>
              )}
            </div>
          )}
        </Section>

        {/* ── 03 Pengaturan Panggilan ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-[#12672a] bg-[#12672a]/10 px-2 py-0.5 rounded-full tracking-wide">03</span>
              <div className="w-6 h-6 rounded-lg bg-[#12672a]/10 flex items-center justify-center">
                <Filter className="w-3.5 h-3.5 text-[#12672a]" />
              </div>
              <h2 className="text-sm font-semibold text-gray-800">Pengaturan Panggilan</h2>
              <span className="text-xs text-gray-400">(Opsional)</span>
            </div>
            {showAdvanced ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {showAdvanced && (
            <div className="px-6 pb-6 border-t border-gray-50 pt-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <Label hint="Berapa kali mencoba kembali jika panggilan tidak diangkat">Maks. Percobaan Ulang</Label>
                  <div className="relative">
                    <Input
                      type="number" min={1} max={10}
                      value={maxRetries}
                      onChange={e => setMaxRetries(+e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">kali</span>
                  </div>
                </div>
                <div>
                  <Label hint="Jeda waktu antar percobaan ulang ke lead yang sama">Interval Percobaan Ulang</Label>
                  <div className="relative">
                    <Input
                      type="number" min={1}
                      value={retryMinutes}
                      onChange={e => setRetryMinutes(+e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">menit</span>
                  </div>
                </div>
                <div>
                  <Label hint="Jumlah panggilan simultan yang dapat dilakukan campaign ini">Maks. Panggilan Bersamaan</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={10}
                      disabled
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">saluran</span>
                  </div>
                </div>
              </div>

              {/* Feature suggestions */}
              <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-700 mb-2">Fitur Lanjutan (Segera Hadir)</p>
                    <ul className="space-y-1.5 text-xs text-amber-700/80">
                      <li>• <strong>Caller ID Rotation</strong> — rotasi nomor penelepon otomatis untuk menghindari deteksi spam</li>
                      <li>• <strong>Smart Retry</strong> — interval percobaan ulang adaptif berdasarkan alasan kegagalan (sibuk / tidak diangkat / ditolak)</li>
                      <li>• <strong>DNC List</strong> — filter otomatis leads yang ada di daftar Do Not Call</li>
                      <li>• <strong>Timezone Awareness</strong> — panggilan hanya dilakukan pada jam kerja sesuai zona waktu leads</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 04 Pilih Leads ── */}
        <Section num="04" title="Pilih Leads" icon={Users}>
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
              <input
                type="text"
                placeholder="Cari nama / nomor..."
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#12672a]/30 focus:border-[#12672a] transition-all placeholder:text-gray-300"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as LeadStatus | "all")}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#12672a]/30 focus:border-[#12672a] bg-white"
            >
              <option value="all">Semua Status</option>
              {(Object.keys(STATUS_LABELS) as LeadStatus[]).map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>

            <select
              value={sortFilter}
              onChange={e => setSortFilter(e.target.value as typeof sortFilter)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#12672a]/30 focus:border-[#12672a] bg-white"
            >
              <option value="newest">Terbaru Dibuat</option>
              <option value="oldest">Terlama Dibuat</option>
              <option value="last_call">Terakhir Dihubungi</option>
            </select>
          </div>

          {/* Selection action bar */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAllFiltered}
                className="flex items-center gap-1.5 text-xs font-medium text-[#12672a] hover:text-[#0e5222] transition-colors"
              >
                {allFilteredSelected
                  ? <CheckSquare className="w-4 h-4" />
                  : <Square className="w-4 h-4" />
                }
                {allFilteredSelected ? "Batalkan Semua Hasil Filter" : `Pilih Semua Hasil Filter (${filteredLeads.length})`}
              </button>
              {selectedCount > 0 && (
                <button onClick={clearAll} className="text-xs text-red-400 hover:text-red-600 transition-colors">
                  Hapus Pilihan
                </button>
              )}
            </div>
            {selectedCount > 0 && (
              <span className="text-xs font-semibold text-[#12672a] bg-[#12672a]/10 px-2.5 py-1 rounded-full">
                {selectedCount} leads dipilih
              </span>
            )}
          </div>

          {/* Lead table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="w-10 px-4 py-2.5" />
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Nama</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Nomor HP</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Dibuat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-sm text-gray-400">
                      Tidak ada leads yang sesuai filter
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map(lead => {
                    const checked = selectedIds.has(lead.id);
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => toggleLead(lead.id)}
                        className={`cursor-pointer transition-colors ${checked ? "bg-[#12672a]/5" : "hover:bg-gray-50/60"}`}
                      >
                        <td className="px-4 py-3 text-center">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all mx-auto ${
                            checked ? "bg-[#12672a] border-[#12672a]" : "border-gray-300"
                          }`}>
                            {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10"><path d="M1.5 5l2.5 2.5 4.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-800">{lead.name}</p>
                          <p className="text-xs text-gray-400 sm:hidden">{lead.mobile}</p>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-sm text-gray-500 tabular-nums">{lead.mobile}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status]}`}>
                            {STATUS_LABELS[lead.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs text-gray-400">{lead.createdAt}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Info note */}
          <div className="mt-3 flex items-start gap-1.5 text-xs text-gray-400">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Menampilkan leads {initialType === "telesales" ? "Telesales" : "Collection"}.
              Hanya leads yang <strong>belum masuk</strong> campaign aktif lain yang ditampilkan.
            </span>
          </div>
        </Section>

        {/* Spacer for sticky bar */}
        <div className="h-4" />
      </div>
    </div>
  );
}

/* ─── Page (wraps in Suspense for useSearchParams) ───────── */
export default function CreateCampaignPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-[#12672a] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CreateCampaignForm />
    </Suspense>
  );
}
