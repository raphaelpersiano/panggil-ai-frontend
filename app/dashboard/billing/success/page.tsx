"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2, Clock3, Wallet } from "lucide-react";
import { getBalance, listTransactions } from "@/lib/api";
import type { BillingTransaction } from "@/lib/types";

function fmtIDR(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function fmtDate(value?: string) {
  if (!value) return "-";
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

function parseAmountFromExternalId(externalId: string) {
  const parts = externalId.split("-");
  const raw = parts[3];
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function findMatchingTopup(transactions: BillingTransaction[], invoiceId: string, externalId: string) {
  if (!invoiceId && !externalId) return null;

  return transactions.find((tx) => {
    if (invoiceId && tx.invoiceId === invoiceId) return true;
    if (externalId && tx.externalId === externalId) return true;
    return false;
  }) ?? null;
}

function SuccessContent() {
  const params = useSearchParams();
  const externalId = params.get("external_id") ?? "";
  const invoiceId = params.get("invoice_id") ?? "";
  const expectedAmount = useMemo(() => parseAmountFromExternalId(externalId), [externalId]);

  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<BillingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [balanceData, transactionData] = await Promise.all([
          getBalance(),
          listTransactions(1, 20, "topup"),
        ]);

        if (cancelled) return;
        setBalance(balanceData.balance);
        setTransactions(transactionData.data);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Gagal memuat status top up terbaru.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const matchedTopup = useMemo(
    () => findMatchingTopup(transactions, invoiceId, externalId),
    [transactions, invoiceId, externalId],
  );

  const latestTopup = transactions[0] ?? null;
  const showMatchedSuccess = matchedTopup?.status === "success";
  const showMatchedPending = matchedTopup?.status === "pending";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-xl">
        <div className="text-center mb-6">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${showMatchedSuccess ? "bg-[#12672a]/10" : "bg-amber-50"}`}>
            {showMatchedSuccess ? (
              <CheckCircle2 className="w-10 h-10 text-[#12672a]" />
            ) : (
              <Clock3 className="w-10 h-10 text-amber-600" />
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {showMatchedSuccess ? "Top up terkonfirmasi" : "Pembayaran dikirim, menunggu konfirmasi backend"}
          </h1>

          <p className="text-gray-500 text-sm leading-relaxed">
            {showMatchedSuccess ? (
              <>
                Backend billing sudah mengembalikan transaksi top up ini sebagai <strong className="text-gray-700">sukses</strong>.
                {expectedAmount ? <> Nominal referensi dari invoice: <strong className="text-gray-700">{fmtIDR(expectedAmount)}</strong>.</> : null}
              </>
            ) : showMatchedPending ? (
              <>
                Provider pembayaran sudah mengarahkan user kembali, tapi transaksi ini masih berstatus <strong className="text-gray-700">menunggu</strong> di data backend.
                Frontend sengaja berhenti mengklaim saldo sudah masuk sebelum backend billing benar-benar mengakuinya.
              </>
            ) : (
              <>
                Halaman ini sekarang memeriksa saldo dan riwayat top up dari backend, bukan sekadar percaya query string dari provider pembayaran.
                Kalau transaksi ini belum muncul, berarti backend belum expose lookup invoice yang layak atau callback/riwayatnya belum sinkron.
              </>
            )}
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Gagal memverifikasi status billing dari backend. {error}</span>
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
            <p className="text-xs text-gray-400 mb-1">Saldo saat ini</p>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">
              {loading ? "Memuat…" : balance !== null ? fmtIDR(balance) : "Tidak tersedia"}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 px-4 py-4">
              <p className="text-xs text-gray-400 mb-1">Invoice ID</p>
              <p className="text-xs font-mono font-semibold text-gray-700 break-all">{invoiceId || "Tidak dikirim provider"}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 px-4 py-4">
              <p className="text-xs text-gray-400 mb-1">External ID</p>
              <p className="text-xs font-mono font-semibold text-gray-700 break-all">{externalId || "Tidak dikirim provider"}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 px-4 py-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-sm font-semibold text-gray-800">Status top up yang bisa diverifikasi</p>
              {matchedTopup && (
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${matchedTopup.status === "success" ? "bg-[#12672a]/10 text-[#12672a]" : matchedTopup.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"}`}>
                  {matchedTopup.status === "success" ? "Sukses" : matchedTopup.status === "pending" ? "Menunggu" : "Gagal"}
                </span>
              )}
            </div>

            {matchedTopup ? (
              <div className="space-y-1.5 text-sm text-gray-600">
                <p>
                  Transaksi cocok ditemukan di backend dengan nominal <strong className="text-gray-800">{fmtIDR(Math.abs(matchedTopup.amount))}</strong>.
                </p>
                <p>Dibuat: <strong className="text-gray-800">{fmtDate(matchedTopup.createdAt)}</strong></p>
                {matchedTopup.paidAt ? <p>Dibayar: <strong className="text-gray-800">{fmtDate(matchedTopup.paidAt)}</strong></p> : null}
                {matchedTopup.expiresAt ? <p>Kedaluwarsa: <strong className="text-gray-800">{fmtDate(matchedTopup.expiresAt)}</strong></p> : null}
              </div>
            ) : latestTopup ? (
              <div className="space-y-1.5 text-sm text-gray-600">
                <p className="text-amber-700">
                  Belum ada transaksi yang bisa dipasangkan langsung dengan invoice ini dari response backend saat ini.
                </p>
                <p>
                  Top up terbaru yang terlihat: <strong className="text-gray-800">{fmtIDR(Math.abs(latestTopup.amount))}</strong> · {latestTopup.status === "success" ? "sukses" : latestTopup.status === "pending" ? "menunggu" : "gagal"}
                </p>
                <p>Dibuat: <strong className="text-gray-800">{fmtDate(latestTopup.createdAt)}</strong></p>
              </div>
            ) : (
              <p className="text-sm text-amber-700 leading-relaxed">
                Belum ada riwayat top up yang dikembalikan backend. Ini bloker UX yang sangat membosankan: setelah checkout, operator tetap buta karena backend belum menyediakan lookup invoice/status yang tegas.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard/billing"
            className="inline-flex flex-1 items-center justify-center gap-2 px-6 py-3 bg-[#12672a] hover:bg-[#0e5222] text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-green-800/20"
          >
            <Wallet className="w-4 h-4" />
            Kembali ke Billing
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex flex-1 items-center justify-center gap-2 px-6 py-3 border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
          >
            Cek Ulang Status
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-8 h-8 border-4 border-[#12672a] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
