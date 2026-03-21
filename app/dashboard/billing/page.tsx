"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet, TrendingUp, TrendingDown, Clock, CheckCircle2,
  AlertCircle, ChevronRight, Zap, Star,
} from "lucide-react";

/* ─── Top-up options ─────────────────────────────────────── */
interface TopUpOption {
  id: string;
  label: string;
  amount: number;          // in IDR
  badge?: string;
  badgeColor?: string;
}

const TOP_UP_OPTIONS: TopUpOption[] = [
  {
    id: "1k",
    label: "1 Ribu",
    amount: 1_000,
  },
  {
    id: "500k",
    label: "500 Ribu",
    amount: 500_000,
  },
  {
    id: "1m",
    label: "1 Juta",
    amount: 1_000_000,
    badge: "Paling Populer",
    badgeColor: "bg-[#12672a] text-white",
  },
  {
    id: "5m",
    label: "5 Juta",
    amount: 5_000_000,
    badge: "Hemat Lebih",
    badgeColor: "bg-amber-500 text-white",
  },
];

/* ─── Dummy transaction history ──────────────────────────── */
interface Transaction {
  id: string;
  type: "topup" | "usage";
  description: string;
  amount: number;
  status: "success" | "pending" | "failed";
  date: string;
}

const TRANSACTIONS: Transaction[] = [
  { id: "t1",  type: "topup",  description: "Top Up via QRIS",         amount: +1_000_000, status: "success", date: "2026-03-21 14:32" },
  { id: "t2",  type: "usage",  description: "Panggilan Campaign Q1",   amount:    -48_600, status: "success", date: "2026-03-22 09:12" },
  { id: "t3",  type: "usage",  description: "Panggilan Campaign Q1",   amount:    -36_450, status: "success", date: "2026-03-21 11:05" },
  { id: "t4",  type: "topup",  description: "Top Up via Transfer BCA", amount: +2_000_000, status: "success", date: "2026-03-15 10:00" },
  { id: "t5",  type: "usage",  description: "Panggilan DPD 1–30 Mar",  amount:    -97_200, status: "success", date: "2026-03-15 13:44" },
  { id: "t6",  type: "topup",  description: "Top Up via OVO",          amount:   +500_000, status: "success", date: "2026-03-10 09:15" },
  { id: "t7",  type: "usage",  description: "Panggilan Q4 Overdue",    amount:   -267_300, status: "success", date: "2026-03-08 16:00" },
  { id: "t8",  type: "topup",  description: "Top Up via GoPay",        amount:   +500_000, status: "pending", date: "2026-03-08 15:58" },
];

const MOCK_BALANCE = 2_050_450;

function fmtIDR(n: number, showSign = false) {
  const abs = Math.abs(n);
  const formatted = "Rp " + abs.toLocaleString("id-ID");
  if (!showSign) return formatted;
  return n >= 0 ? `+${formatted}` : `−${formatted}`;
}

/* ─── Page ────────────────────────────────────────────────── */
export default function BillingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string>("1m");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const chosen = TOP_UP_OPTIONS.find(o => o.id === selected)!;

  async function handleTopUp() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/billing/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: chosen.amount }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Gagal membuat invoice. Coba lagi.");
        setLoading(false);
        return;
      }

      // Redirect to Xendit hosted invoice page
      window.location.href = json.invoiceUrl;
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi.");
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#12672a] to-[#1d9a40] flex items-center justify-center shadow-md shadow-green-800/20">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Billing</h1>
          <p className="text-xs text-gray-400 mt-0.5">Kelola saldo dan riwayat transaksi akun Anda</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left column: balance + top-up ── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Balance card */}
          <div className="relative bg-gradient-to-br from-[#12672a] via-[#17843a] to-[#0d5222] rounded-2xl p-6 overflow-hidden shadow-lg shadow-green-800/25">
            {/* Decoration circles */}
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -bottom-12 -left-8 w-52 h-52 rounded-full bg-white/5" />

            <div className="relative z-10">
              <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-3">Saldo Aktif</p>
              <p className="text-4xl font-bold text-white tracking-tight tabular-nums mb-1">
                {fmtIDR(MOCK_BALANCE)}
              </p>
              <p className="text-white/50 text-xs">Terakhir diisi: 21 Mar 2026 · 14:32</p>
            </div>
          </div>

          {/* Top-up section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-1">Top Up Saldo</h2>
            <p className="text-xs text-gray-400 mb-5">Pilih nominal top-up. Pembayaran diproses via Xendit.</p>

            {/* Amount grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {TOP_UP_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSelected(opt.id)}
                  className={`relative flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all ${
                    selected === opt.id
                      ? "border-[#12672a] bg-[#12672a]/5 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  {opt.badge && (
                    <span className={`absolute -top-2.5 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold ${opt.badgeColor}`}>
                      {opt.badge}
                    </span>
                  )}

                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mb-3 transition-all ${
                    selected === opt.id
                      ? "border-[#12672a] bg-[#12672a]"
                      : "border-gray-300"
                  }`}>
                    {selected === opt.id && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>

                  <p className={`text-xs font-medium mb-0.5 ${selected === opt.id ? "text-[#12672a]" : "text-gray-400"}`}>
                    {opt.label}
                  </p>
                  <p className={`text-lg font-bold tabular-nums ${selected === opt.id ? "text-[#12672a]" : "text-gray-700"}`}>
                    {fmtIDR(opt.amount)}
                  </p>
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* Pay button */}
            <button
              onClick={handleTopUp}
              disabled={loading}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-[#12672a] hover:bg-[#0e5222] disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 font-semibold rounded-xl transition-all shadow-md shadow-green-800/20 disabled:shadow-none text-sm"
            >
              <div className="flex items-center gap-2">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {loading ? "Membuat invoice…" : `Bayar ${fmtIDR(chosen.amount)}`}
              </div>
              {!loading && <ChevronRight className="w-4 h-4" />}
            </button>

            <p className="text-center text-xs text-gray-400 mt-3">
              Anda akan diarahkan ke halaman pembayaran Xendit. Mendukung transfer bank, QRIS, dan e-wallet.
            </p>
          </div>
        </div>

        {/* ── Right column: transaction history ── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Riwayat Transaksi</h2>
            </div>

            <div className="divide-y divide-gray-50">
              {TRANSACTIONS.map(tx => (
                <div key={tx.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    tx.type === "topup"
                      ? "bg-[#12672a]/10"
                      : "bg-gray-100"
                  }`}>
                    {tx.type === "topup"
                      ? <TrendingUp className="w-4 h-4 text-[#12672a]" />
                      : <TrendingDown className="w-4 h-4 text-gray-400" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{tx.description}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {tx.status === "pending" ? (
                        <Clock className="w-3 h-3 text-amber-500" />
                      ) : tx.status === "success" ? (
                        <CheckCircle2 className="w-3 h-3 text-[#12672a]" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-red-400" />
                      )}
                      <span className={`text-[10px] font-medium ${
                        tx.status === "pending" ? "text-amber-500"
                        : tx.status === "success" ? "text-gray-400"
                        : "text-red-400"
                      }`}>
                        {tx.status === "pending" ? "Menunggu" : tx.status === "success" ? tx.date.slice(0, 10) : "Gagal"}
                      </span>
                    </div>
                  </div>

                  {/* Amount */}
                  <p className={`text-sm font-bold tabular-nums shrink-0 ${
                    tx.amount > 0 ? "text-[#12672a]" : "text-gray-500"
                  }`}>
                    {fmtIDR(tx.amount, true)}
                  </p>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40">
              <p className="text-xs text-gray-400 text-center">Menampilkan 8 transaksi terakhir</p>
            </div>
          </div>

          {/* Info box */}
          <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Star className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-700 mb-1">Cara Kerja Saldo</p>
                <p className="text-xs text-amber-700/80 leading-relaxed">
                  Saldo dipotong per menit panggilan. Biaya standar <strong>Rp 30/detik</strong>. Saldo tidak memiliki masa berlaku.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
