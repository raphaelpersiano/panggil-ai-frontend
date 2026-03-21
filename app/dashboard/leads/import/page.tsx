"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Upload, FileSpreadsheet, TrendingUp,
  Wallet, CheckCircle2, AlertCircle, Download, X,
} from "lucide-react";

type Tab = "telesales" | "collection";

const TELESALES_HEADERS = ["name", "mobile", "source", "status"];
const COLLECTION_HEADERS = ["name", "mobile", "source", "status", "outstanding", "emi", "emi_due_date"];

export default function ImportLeadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as Tab) ?? "telesales";

  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isCollection = tab === "collection";
  const tabLabel = isCollection ? "Collection" : "Telesales";
  const TabIcon = isCollection ? Wallet : TrendingUp;
  const headers = isCollection ? COLLECTION_HEADERS : TELESALES_HEADERS;

  function handleFile(f: File) {
    setError(null);
    if (!f.name.endsWith(".csv") && !f.name.endsWith(".xlsx")) {
      setError("Hanya file .csv atau .xlsx yang didukung.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Ukuran file maksimal 5MB.");
      return;
    }
    setFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    // Dummy upload — simulate processing
    setTimeout(() => {
      setUploading(false);
      setDone(true);
      setTimeout(() => router.push(`/dashboard/leads?tab=${tab}`), 2000);
    }, 2000);
  }

  function downloadTemplate() {
    const csv = headers.join(",") + "\n" +
      (isCollection
        ? "Budi Santoso,081234567890,Internal DB,uncontacted,5000000,500000,2026-04-01"
        : "Siti Rahayu,082345678901,Facebook Ads,uncontacted");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `template_leads_${tab}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 lg:p-8 min-h-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push(`/dashboard/leads?tab=${tab}`)}
          className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-0.5">
            <span>Leads</span>
            <span>/</span>
            <span className="flex items-center gap-1.5">
              <TabIcon className="w-3.5 h-3.5" />
              {tabLabel}
            </span>
            <span>/</span>
            <span className="text-gray-700 font-medium">Import Leads</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Import Leads {tabLabel}</h1>
        </div>
      </div>

      <div className="max-w-2xl space-y-5">
        {/* Tab badge */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${isCollection ? "bg-orange-50 text-orange-700" : "bg-green-50 text-primary"}`}>
          <TabIcon className="w-4 h-4" />
          Import ke {tabLabel}
        </div>

        {/* Template download */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">Gunakan Template CSV</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Unduh template dan isi data sesuai format yang tersedia.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {headers.map((h) => (
                  <span key={h} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-mono">{h}</span>
                ))}
              </div>
            </div>
            <button
              onClick={downloadTemplate}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh Template
            </button>
          </div>
        </div>

        {/* Drop Zone */}
        {!done ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`relative bg-white rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
              dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />

            {file ? (
              <div className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            ) : (
              <div className="p-10 flex flex-col items-center text-center">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${dragOver ? "bg-primary/20" : "bg-gray-100"}`}>
                  <Upload className={`w-7 h-7 transition-colors ${dragOver ? "text-primary" : "text-gray-400"}`} />
                </div>
                <p className="font-semibold text-gray-900">
                  {dragOver ? "Lepaskan file di sini" : "Drag & drop file di sini"}
                </p>
                <p className="text-sm text-gray-500 mt-1">atau klik untuk memilih file</p>
                <p className="text-xs text-gray-400 mt-3">Mendukung .csv dan .xlsx · Maks. 5MB</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-green-200 p-8 flex flex-col items-center text-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-7 h-7 text-green-600" />
            </div>
            <p className="font-bold text-gray-900 text-lg">Import Berhasil!</p>
            <p className="text-sm text-gray-500 mt-1">Leads Anda sedang diproses. Mengalihkan ke halaman leads...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Actions */}
        {!done && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/leads?tab=${tab}`)}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
            >
              Batal
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary-dark transition-all shadow-sm shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Mengupload...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Sekarang
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
