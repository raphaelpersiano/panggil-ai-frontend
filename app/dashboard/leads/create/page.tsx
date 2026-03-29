"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, UserPlus, TrendingUp, Wallet, ChevronDown, AlertCircle } from "lucide-react";
import { createLead } from "@/lib/api";
import type { CreateLeadPayload, LeadStatus } from "@/lib/types";

type Tab = "telesales" | "collection";

export default function CreateLeadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as Tab) ?? "telesales";
  const isCollection = tab === "collection";

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    source: "",
    status: "uncontacted" as LeadStatus,
    outstanding: "",
    emi: "",
    emiDueDate: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tabLabel = isCollection ? "Collection" : "Telesales";
  const TabIcon = isCollection ? Wallet : TrendingUp;

  const sourceOptions = useMemo(
    () => isCollection
      ? ["Internal DB", "Core Banking", "CSV Import", "Lainnya"]
      : ["Facebook Ads", "Instagram", "Website", "Referral", "WhatsApp", "Tokopedia", "Shopee", "Cold Call", "Lainnya"],
    [isCollection],
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function normalizeMobile(value: string) {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("62")) return digits;
    if (digits.startsWith("0")) return `62${digits.slice(1)}`;
    return `62${digits}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload: CreateLeadPayload = {
        type: tab,
        name: form.name.trim(),
        mobile: normalizeMobile(form.mobile),
        source: form.source,
        status: form.status,
        ...(isCollection
          ? {
              outstanding: Number(form.outstanding),
              emi: Number(form.emi),
              emiDueDate: form.emiDueDate,
            }
          : {}),
      };

      await createLead(payload);
      router.push(`/dashboard/leads?tab=${tab}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan lead.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 min-h-full">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push(`/dashboard/leads?tab=${tab}`)}
          className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-0.5">
            <span>Leads</span><span>/</span>
            <span className="flex items-center gap-1.5"><TabIcon className="w-3.5 h-3.5" />{tabLabel}</span>
            <span>/</span><span className="text-gray-700 font-medium">Buat Lead Baru</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Buat Lead {tabLabel}</h1>
        </div>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${isCollection ? "bg-orange-50 text-orange-700" : "bg-green-50 text-primary"}`}>
            <TabIcon className="w-4 h-4" />Lead {tabLabel}
          </div>

          {error && (
            <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
            <input name="name" type="text" required placeholder="cth. Budi Santoso" value={form.name} onChange={handleChange} className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor HP <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">+62</span>
              <input name="mobile" type="tel" required placeholder="81234567890" value={form.mobile} onChange={handleChange} className="w-full pl-12 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
            </div>
            <p className="mt-1 text-xs text-gray-400">Frontend akan kirim ke backend dalam format 62xxxxxxxxxx.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Sumber Lead <span className="text-red-500">*</span></label>
            <div className="relative">
              <select name="source" required value={form.source} onChange={handleChange} className="w-full appearance-none px-4 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-gray-700 cursor-pointer">
                <option value="">Pilih sumber...</option>
                {sourceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <div className="relative">
              <select name="status" value={form.status} onChange={handleChange} className="w-full appearance-none px-4 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-gray-700 cursor-pointer">
                <option value="uncontacted">Belum Dihubungi</option>
                <option value="connected">Terhubung</option>
                <option value="follow_up">Follow Up</option>
                {isCollection && <option value="promise_to_pay">Janji Bayar</option>}
                <option value="closed">Selesai</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {isCollection && (
            <>
              <hr className="border-gray-100" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Informasi Tagihan</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Tunggakan (Rp) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">Rp</span>
                  <input name="outstanding" type="number" required min={1} placeholder="0" value={form.outstanding} onChange={handleChange} className="w-full pl-12 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cicilan / Bulan (Rp) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">Rp</span>
                    <input name="emi" type="number" required min={1} placeholder="0" value={form.emi} onChange={handleChange} className="w-full pl-12 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Jatuh Tempo <span className="text-red-500">*</span></label>
                  <input name="emiDueDate" type="date" required value={form.emiDueDate} onChange={handleChange} className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>
              </div>
            </>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={() => router.push(`/dashboard/leads?tab=${tab}`)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">Batal</button>
            <button type="submit" disabled={submitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary-dark transition-all shadow-sm shadow-primary/20 disabled:opacity-70">
              {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Menyimpan...</> : <><UserPlus className="w-4 h-4" />Simpan Lead</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
