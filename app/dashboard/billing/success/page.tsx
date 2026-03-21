"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Wallet, ArrowRight } from "lucide-react";

function SuccessContent() {
  const params      = useSearchParams();
  const externalId  = params.get("external_id") ?? "";
  const invoiceId   = params.get("invoice_id") ?? "";

  // Parse amount from external_id format: panggil-topup-{userId}-{amount}-{ts}
  const [amount, setAmount] = useState<number | null>(null);

  useEffect(() => {
    const parts = externalId.split("-");
    // format: panggil-topup-<userId>-<amount>-<ts>
    const raw = parts[3];
    if (raw) {
      const n = parseInt(raw, 10);
      if (!isNaN(n)) setAmount(n);
    }
  }, [externalId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-md text-center">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-[#12672a]/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-[#12672a]" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Berhasil!</h1>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          {amount
            ? <>Saldo sebesar <strong className="text-gray-700">Rp {amount.toLocaleString("id-ID")}</strong> telah ditambahkan ke akun Anda.</>
            : "Saldo Anda telah berhasil ditambahkan."
          }
          {" "}Top up akan aktif dalam beberapa saat.
        </p>

        {invoiceId && (
          <div className="mb-6 px-4 py-3 bg-gray-50 rounded-xl text-left">
            <p className="text-xs text-gray-400 mb-0.5">Invoice ID</p>
            <p className="text-xs font-mono font-semibold text-gray-600 break-all">{invoiceId}</p>
          </div>
        )}

        <Link
          href="/dashboard/billing"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#12672a] hover:bg-[#0e5222] text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-green-800/20"
        >
          <Wallet className="w-4 h-4" />
          Lihat Saldo
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-[#12672a] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
