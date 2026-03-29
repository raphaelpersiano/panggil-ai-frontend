"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Wallet, TrendingUp, TrendingDown, Clock, CheckCircle2,
  AlertCircle, ChevronRight, Zap, Star,
} from "lucide-react";
import { createInvoice, getBalance, listTransactions } from "@/lib/api";
import type { BillingTransaction } from "@/lib/types";

interface TopUpOption {
  id: string;
  label: string;
  amount: number;
  badge?: string;
  badgeColor?: string;
}

const TOP_UP_OPTIONS: TopUpOption[] = [
  { id: "1k", label: "1 Ribu", amount: 1_000 },
  { id: "500k", label: "500 Ribu", amount: 500_000 },
  { id: "1m", label: "1 Juta", amount: 1_000_000, badge: "Paling Populer", badgeColor: "bg-[#12672a] text-white" },
  { id: "5m", label: "5 Juta", amount: 5_000_000, badge: "Hemat Lebih", badgeColor: "bg-amber-500 text-white" },
];

const FALLBACK_TRANSACTIONS: BillingTransaction[] = [];

const FALLBACK_BALANCE = 0;

function fmtIDR(n: number, showSign = false) {
  const abs = Math.abs(n);
  const formatted = "Rp " + abs.toLocaleString("id-ID");
  if (!showSign) return formatted;
  return n >= 0 ? `+${formatted}` : `−${formatted}`;
}

function fmtDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function BillingPage() {
  const [selected, setSelected] = useState<string>("1m");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [actionError, setActionError] = useState("");
  const [balance, setBalance] = useState<number>(FALLBACK_BALANCE);
  const [transactions, setTransactions] = useState<BillingTransaction[]>(FALLBACK_TRANSACTIONS);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  const chosen = TOP_UP_OPTIONS.find((o) => o.id === selected)!;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setBalanceLoading(true);
      setHistoryLoading(true);
      setFetchError("");

      try {
        const [balanceData, transactionData] = await Promise.all([
          getBalance(),
          listTransactions(1, 8),
        ]);

        if (cancelled) return;
        setBalance(balanceData.balance);
        setTransactions(transactionData.data);
        setUsingFallback(false);
      } catch (err) {
        if (cancelled) return;
        setUsingFallback(true);
        setFetchError(err instanceof Error ? err.message : "Gagal memuat billing.");
      } finally {
        if (!cancelled) {
          setBalanceLoading(false);
          setHistoryLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const latestTopup = useMemo(
    () => transactions.find((tx) => tx.type === "topup" && tx.status === "success"),
    [transactions],
  );

  async function handleTopUp() {
    setLoading(true);
    setActionError("");

    try {
      const invoice = await createInvoice({ amount: chosen.amount });
      window.location.href = invoice.invoiceUrl;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal membuat invoice. Coba lagi.");
      setLoading(false);
      return;
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#12672a] to-[#1d9a40] flex items-center justify-center shadow-md shadow-green-800/20">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Billing</h1>
          <p className="text-xs text-gray-400 mt-0.5">Kelola saldo dan riwayat transaksi akun Anda</p>
        </div>
      </div>

      {usingFallback && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Billing backend belum sepenuhnya aktif. Menampilkan fallback UI. {fetchError}</span>
        </div>
      )}

      {!usingFallback && fetchError && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{fetchError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          <div className="relative bg-gradient-to-br from-[#12672a] via-[#17843a] to-[#0d5222] rounded-2xl p-6 overflow-hidden shadow-lg shadow-green-800/25">
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -bottom-12 -left-8 w-52 h-52 rounded-full bg-white/5" />

            <div className="relative z-10">
              <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-3">Saldo Aktif</p>
              <p className="text-4xl font-bold text-white tracking-tight tabular-nums mb-1">
                {balanceLoading ? "Memuat…" : fmtIDR(balance)}
              </p>
              <p className="text-white/50 text-xs">
                {latestTopup ? `Top up sukses terakhir: ${fmtDate(latestTopup.createdAt)}` : "Belum ada riwayat top up sukses"}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-1">Top Up Saldo</h2>
            <p className="text-xs text-gray-400 mb-5">Pilih nominal top-up. Pembayaran diproses via Xendit.</p>

            <div className="grid grid-cols-2 gap-3 mb-5">
              {TOP_UP_OPTIONS.map((opt) => (
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
                    selected === opt.id ? "border-[#12672a] bg-[#12672a]" : "border-gray-300"
                  }`}>
                    {selected === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>

                  <p className={`text-xs font-medium mb-0.5 ${selected === opt.id ? "text-[#12672a]" : "text-gray-400"}`}>{opt.label}</p>
                  <p className={`text-lg font-bold tabular-nums ${selected === opt.id ? "text-[#12672a]" : "text-gray-700"}`}>{fmtIDR(opt.amount)}</p>
                </button>
              ))}
            </div>

            {actionError && (
              <div className="mb-4 flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {actionError}
              </div>
            )}

            <button
              onClick={handleTopUp}
              disabled={loading}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-[#12672a] hover:bg-[#0e5222] disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 font-semibold rounded-xl transition-all shadow-md shadow-green-800/20 disabled:shadow-none text-sm"
            >
              <div className="flex items-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
                {loading ? "Membuat invoice…" : `Bayar ${fmtIDR(chosen.amount)}`}
              </div>
              {!loading && <ChevronRight className="w-4 h-4" />}
            </button>

            <p className="text-center text-xs text-gray-400 mt-3">
              Anda akan diarahkan ke halaman pembayaran Xendit. Mendukung transfer bank, QRIS, dan e-wallet.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Riwayat Transaksi</h2>
            </div>

            <div className="divide-y divide-gray-50">
              {historyLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="flex items-start gap-3 px-5 py-3.5 animate-pulse">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-100 rounded" />
                      <div className="h-3 bg-gray-50 rounded w-2/3" />
                    </div>
                    <div className="h-4 w-16 bg-gray-100 rounded" />
                  </div>
                ))
              ) : transactions.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-gray-400">Belum ada transaksi.</div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${tx.type === "topup" ? "bg-[#12672a]/10" : "bg-gray-100"}`}>
                      {tx.type === "topup" ? <TrendingUp className="w-4 h-4 text-[#12672a]" /> : <TrendingDown className="w-4 h-4 text-gray-400" />}
                    </div>

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
                          tx.status === "pending" ? "text-amber-500" : tx.status === "success" ? "text-gray-400" : "text-red-400"
                        }`}>
                          {tx.status === "pending" ? "Menunggu" : tx.status === "failed" ? "Gagal" : fmtDate(tx.createdAt)}
                        </span>
                      </div>
                    </div>

                    <p className={`text-sm font-bold tabular-nums shrink-0 ${tx.amount > 0 ? "text-[#12672a]" : "text-gray-500"}`}>
                      {fmtIDR(tx.amount, true)}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40">
              <p className="text-xs text-gray-400 text-center">Menampilkan {Math.min(transactions.length, 8)} transaksi terbaru</p>
            </div>
          </div>

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
