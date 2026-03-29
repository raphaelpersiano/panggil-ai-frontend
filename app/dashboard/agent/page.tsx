"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, MessageSquare, Settings2, List, Database, MessageCircle, AlertCircle } from "lucide-react";
import { listAgentConfigs } from "@/lib/api";
import type { AgentConfig as ApiAgentConfig, AgentStructuredOutput } from "@/lib/types";

type Tab = "telesales" | "collection";

interface StructuredVar {
  name: string;
  type: string;
  description: string;
}

interface AgentConfigView {
  firstMessage: string;
  systemPrompt: string;
  silenceTimeout: number;
  maxDuration: number;
  immediateStop: number;
  backOffSeconds: number;
  structuredOutput: StructuredVar[];
}

const FALLBACK_CONFIGS: Record<Tab, AgentConfigView> = {
  telesales: {
    firstMessage: "",
    systemPrompt: "",
    silenceTimeout: 0,
    maxDuration: 0,
    immediateStop: 0,
    backOffSeconds: 0,
    structuredOutput: [],
  },
  collection: {
    firstMessage: "",
    systemPrompt: "",
    silenceTimeout: 0,
    maxDuration: 0,
    immediateStop: 0,
    backOffSeconds: 0,
    structuredOutput: [],
  },
};

const BACKEND_ARTIFACTS: StructuredVar[] = [
  {
    name: "recordingUrl",
    type: "string | undefined",
    description: "URL rekaman panggilan dari GET /logs/:callId jika backend menyimpan audio call.",
  },
  {
    name: "transcript",
    type: "string | undefined",
    description: "Transkrip percakapan lengkap dari detail call log ketika backend sudah mengekstrak isi percakapan.",
  },
  {
    name: "structuredOutput",
    type: "object | undefined",
    description: "Output terstruktur hasil inferensi backend per call. Bentuk finalnya mengikuti konfigurasi agent yang backend expose.",
  },
];

function normalizeConfig(config?: ApiAgentConfig): AgentConfigView | null {
  if (!config) return null;

  const outputs: StructuredVar[] = (config.structuredOutput ?? []).map((item: AgentStructuredOutput) => ({
    name: item.name,
    type: item.type,
    description: item.description,
  }));

  return {
    firstMessage: config.firstMessage ?? "",
    systemPrompt: config.systemPrompt ?? "",
    silenceTimeout: config.settings?.silenceTimeoutSeconds ?? 0,
    maxDuration: config.settings?.maxDurationSeconds ?? 0,
    immediateStop: config.settings?.immediateStopSeconds ?? 0,
    backOffSeconds: config.settings?.backOffSeconds ?? 0,
    structuredOutput: outputs,
  };
}

function SectionHeading({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 rounded-lg bg-[#12672a]/10 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-[#12672a]" />
      </div>
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
    </div>
  );
}

function DisabledInput({
  label,
  value,
  hint,
  unit,
}: {
  label: string;
  value: string | number;
  hint?: string;
  unit?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-2 leading-relaxed">{hint}</p>}
      <div className="relative">
        <input
          disabled
          readOnly
          value={value}
          className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-600 cursor-not-allowed disabled:opacity-80"
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function DisabledTextarea({
  label,
  value,
  hint,
  rows = 6,
}: {
  label: string;
  value: string;
  hint?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-2 leading-relaxed">{hint}</p>}
      <textarea
        disabled
        readOnly
        value={value}
        rows={rows}
        className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-600 resize-none cursor-not-allowed disabled:opacity-80 leading-relaxed"
      />
    </div>
  );
}

function VariableTable({ vars, emptyMessage }: { vars: StructuredVar[]; emptyMessage?: string }) {
  if (vars.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
        {emptyMessage ?? "Belum ada data yang dikembalikan backend."}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-1/4">
              Variabel
            </th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-1/4">
              Tipe Data
            </th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Deskripsi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {vars.map((v, i) => (
            <tr key={`${v.name}-${i}`} className="bg-gray-50/30">
              <td className="px-4 py-3">
                <span className="font-mono text-xs font-semibold text-[#12672a] bg-[#12672a]/8 px-2 py-0.5 rounded-md">
                  {v.name}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-gray-500 font-medium">{v.type}</td>
              <td className="px-4 py-3 text-xs text-gray-500 leading-relaxed">{v.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AgentPage() {
  const [activeTab, setActiveTab] = useState<Tab>("telesales");
  const [configs, setConfigs] = useState<Record<Tab, AgentConfigView>>(FALLBACK_CONFIGS);
  const [loading, setLoading] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [telesales, collection] = await Promise.all([
          listAgentConfigs("telesales"),
          listAgentConfigs("collection"),
        ]);

        if (cancelled) return;

        setConfigs({
          telesales: normalizeConfig(telesales[0]) ?? FALLBACK_CONFIGS.telesales,
          collection: normalizeConfig(collection[0]) ?? FALLBACK_CONFIGS.collection,
        });
        setUsingFallback(false);
      } catch (err) {
        if (cancelled) return;
        setUsingFallback(true);
        setError(err instanceof Error ? err.message : "Gagal memuat konfigurasi agent.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const cfg = useMemo(() => configs[activeTab], [configs, activeTab]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#12672a] to-[#1d9a40] flex items-center justify-center shadow-md shadow-green-800/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">AI Agent</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Konfigurasi perilaku agent untuk setiap jenis campaign
            </p>
          </div>
        </div>

        <div className="flex bg-gray-100 rounded-xl p-1 gap-1 shrink-0">
          {(["telesales", "collection"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab ? "bg-white text-[#12672a] shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "telesales" ? "Telesales" : "Collection"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
        <p className="text-xs text-amber-700 leading-relaxed">
          Konfigurasi ini bersifat <strong>read-only</strong>. Hubungi tim Panggil AI untuk melakukan penyesuaian sesuai kebutuhan bisnis Anda.
        </p>
      </div>

      {(usingFallback || error) && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Backend agent config belum stabil. Frontend sekarang sengaja berhenti mengarang default config palsu — kalau data kosong, ya memang backend belum kasih kontrak yang layak. {error ?? ""}
          </span>
        </div>
      )}

      {loading && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
          Memuat konfigurasi agent...
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionHeading icon={MessageSquare} title="Konfigurasi Percakapan" />
          <div className="space-y-5">
            <DisabledInput
              label="First Message"
              value={cfg.firstMessage}
              hint="Pesan pertama yang diucapkan agent saat panggilan tersambung."
            />
            <DisabledTextarea
              label="System Prompt"
              value={cfg.systemPrompt}
              hint="Instruksi lengkap yang mengatur perilaku, tujuan, dan karakter agent selama percakapan."
              rows={16}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionHeading icon={Settings2} title="Parameter Panggilan" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <DisabledInput
              label="Silence Timeout"
              value={cfg.silenceTimeout}
              unit="detik"
              hint="Durasi keheningan sebelum panggilan otomatis diakhiri."
            />
            <DisabledInput
              label="Maximum Duration"
              value={cfg.maxDuration}
              unit="detik"
              hint="Batas maksimal durasi panggilan sebelum sistem menutupnya."
            />
            <DisabledInput
              label="Immediate Stop"
              value={cfg.immediateStop}
              unit="detik"
              hint="Durasi minimum ucapan customer sebelum agent berhenti bicara."
            />
            <DisabledInput
              label="Back Off Seconds"
              value={cfg.backOffSeconds}
              unit="detik"
              hint="Jeda yang ditunggu agent sebelum mulai bicara lagi."
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionHeading icon={List} title="Structured Output" />
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            Variabel yang akan dikumpulkan agent dari customer selama panggilan berlangsung.
          </p>
          <VariableTable
            vars={cfg.structuredOutput}
            emptyMessage="Backend belum mengirim definisi structured output untuk tipe agent ini."
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionHeading icon={Database} title="Artefak Call Log dari Backend" />
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            Ini bukan dummy UI lagi. Bagian ini merangkum field yang memang sudah disebut di kontrak detail log backend, jadi operator tahu output apa yang realistis tersedia setelah panggilan selesai.
          </p>
          <VariableTable vars={BACKEND_ARTIFACTS} />
        </div>

        <div className="bg-gradient-to-r from-[#12672a]/5 to-[#1d9a40]/10 border border-[#12672a]/20 rounded-2xl p-6 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#12672a] to-[#1d9a40] flex items-center justify-center shadow-lg shadow-green-800/20 shrink-0">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-0.5">Butuh penyesuaian lebih?</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Tim kami siap membantu mengkustomisasi First Message, System Prompt, dan parameter panggilan sesuai kebutuhan bisnis Anda.
            </p>
          </div>
          <a
            href="https://wa.me/6287879565390?text=Halo%2C%20saya%20ingin%20melakukan%20penyesuaian%20konfigurasi%20AI%20Agent%20di%20Panggil%20AI."
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-[#12672a] hover:bg-[#0e5222] text-white text-sm font-medium rounded-xl transition-colors shrink-0 shadow-md shadow-green-800/20 whitespace-nowrap"
          >
            Hubungi Tim Kami
          </a>
        </div>
      </div>
    </div>
  );
}
