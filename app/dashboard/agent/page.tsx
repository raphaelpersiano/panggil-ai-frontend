"use client";

import { useState } from "react";
import { Bot, MessageSquare, Settings2, List, Database, MessageCircle } from "lucide-react";

/* ─── Types ───────────────────────────────────────────────── */
type Tab = "telesales" | "collection";

interface StructuredVar {
  name: string;
  type: string;
  description: string;
}

interface AgentConfig {
  firstMessage: string;
  systemPrompt: string;
  silenceTimeout: number;
  maxDuration: number;
  immediateStop: number;
  backOffSeconds: number;
  structuredOutput: StructuredVar[];
}

/* ─── Dummy configs ───────────────────────────────────────── */
const AGENT_CONFIGS: Record<Tab, AgentConfig> = {
  telesales: {
    firstMessage:
      "Halo, selamat pagi! Saya menghubungi dari [Nama Perusahaan]. Apakah saya berbicara dengan Bapak/Ibu [Nama Prospek]? Saya ingin menawarkan produk terbaru kami yang mungkin bermanfaat untuk Anda.",
    systemPrompt: `GOAL
Melakukan presentasi produk kepada prospek dan mendorong mereka untuk melakukan pembelian atau menyetujui follow-up meeting dengan tim sales.

TONE
Ramah, profesional, dan persuasif. Gunakan bahasa yang sopan namun tidak terlalu formal. Selalu positif dan antusias dalam menjelaskan manfaat produk. Hindari bahasa yang terlalu teknis.

METHOD
1. Mulai dengan perkenalan yang hangat dan pastikan berbicara dengan orang yang tepat.
2. Sampaikan proposisi nilai produk dalam 30 detik pertama.
3. Ajukan pertanyaan kualifikasi untuk memahami kebutuhan prospek.
4. Sesuaikan presentasi berdasarkan respons dan kebutuhan yang disampaikan.
5. Tangani keberatan dengan empati dan fakta yang relevan.
6. Dorong ke langkah berikutnya: pembelian langsung atau jadwal meeting.

UNEXPECTED SCENARIO
- Jika prospek marah atau tidak sopan, tetap tenang dan tawarkan untuk dihubungi di waktu yang lebih tepat.
- Jika prospek meminta informasi teknis yang tidak diketahui, catat pertanyaan dan janjikan follow-up dari tim teknis.
- Jika ada gangguan koneksi, minta maaf dan coba sambungkan kembali inti percakapan.
- Jika prospek meminta dihapus dari daftar, konfirmasi dan akhiri panggilan dengan sopan.

CLOSING
Ringkas manfaat utama yang telah dibahas, konfirmasi ketertarikan prospek, dan tentukan langkah konkret berikutnya — jadwal demo, pengiriman proposal, atau konfirmasi pembelian. Akhiri dengan ucapan terima kasih yang tulus.`,
    silenceTimeout: 10,
    maxDuration: 300,
    immediateStop: 2,
    backOffSeconds: 1.0,
    structuredOutput: [
      { name: "Interested",  type: "Boolean (true / false)", description: "Apakah prospek menunjukkan ketertarikan terhadap produk." },
      { name: "PTP Date",    type: "Date (YYYY-MM-DD)",      description: "Tanggal yang disepakati prospek untuk tindak lanjut atau keputusan pembelian." },
    ],
  },

  collection: {
    firstMessage:
      "Halo, selamat pagi! Saya menghubungi dari [Nama Perusahaan] terkait tagihan Anda yang telah jatuh tempo. Apakah saya berbicara dengan Bapak/Ibu [Nama Nasabah]? Kami ingin membantu menyelesaikan kewajiban pembayaran Anda.",
    systemPrompt: `GOAL
Mengingatkan nasabah tentang kewajiban pembayaran yang telah jatuh tempo dan mendorong mereka untuk segera melakukan pembayaran atau menyetujui jadwal pembayaran (Promise to Pay / PTP).

TONE
Profesional, empatis, namun tegas. Jaga nada suara tetap tenang dan tidak mengancam. Fokus pada solusi, bukan masalah. Hindari bahasa yang mempermalukan atau menekan berlebihan.

METHOD
1. Konfirmasi identitas nasabah secara cermat sebelum membahas detail tagihan.
2. Sampaikan informasi tagihan secara jelas dan singkat (jumlah outstanding, tanggal jatuh tempo).
3. Tanyakan alasan keterlambatan dengan nada empati dan tanpa menghakimi.
4. Tawarkan solusi pembayaran yang fleksibel jika nasabah memiliki kendala finansial.
5. Dapatkan komitmen pembayaran (PTP) yang spesifik: tanggal, jumlah, dan metode pembayaran.
6. Konfirmasi kesepakatan secara verbal dan ingatkan konsekuensi jika tidak dipenuhi.

UNEXPECTED SCENARIO
- Jika nasabah menyangkal memiliki tagihan, verifikasi data yang ada dan eskalasi ke agen manusia.
- Jika nasabah mengalami kesulitan finansial serius, tawarkan opsi restrukturisasi dan eskalasi ke tim terkait.
- Jika nasabah mengancam atau menggunakan bahasa kasar, akhiri panggilan dengan sopan dan catat insiden secara detail.
- Jika nasabah mengklaim sudah membayar, minta bukti dan eskalasi ke tim verifikasi.

CLOSING
Konfirmasi janji pembayaran (Promise to Pay) secara spesifik — tanggal, jumlah, dan metode pembayaran. Ingatkan nasabah tentang pentingnya memenuhi janji ini dan ucapkan terima kasih atas kerjasama serta pengertiannya.`,
    silenceTimeout: 10,
    maxDuration: 300,
    immediateStop: 2,
    backOffSeconds: 1.0,
    structuredOutput: [
      { name: "Delinquency Reason", type: "Text",                   description: "Alasan nasabah menunggak pembayaran, sesuai yang disampaikan dalam percakapan." },
      { name: "PTP",                type: "Boolean (true / false)", description: "Apakah nasabah bersedia membuat janji pembayaran (Promise to Pay)." },
      { name: "PTP Date",           type: "Date (YYYY-MM-DD)",      description: "Tanggal yang disepakati nasabah untuk melakukan pembayaran." },
      { name: "PTP Amount",         type: "Number (IDR)",           description: "Jumlah nominal yang dijanjikan nasabah untuk dibayarkan." },
    ],
  },
};

const DEFAULT_OUTPUT: StructuredVar[] = [
  { name: "Call Summary",    type: "Text",             description: "Ringkasan otomatis isi percakapan yang dihasilkan oleh sistem AI." },
  { name: "Call Duration",   type: "Number (seconds)", description: "Durasi total panggilan dalam detik, dihitung dari koneksi hingga pemutusan." },
  { name: "Call Recording",  type: "URL",              description: "Tautan ke rekaman audio panggilan yang tersimpan di sistem." },
];

/* ─── Sub-components ──────────────────────────────────────── */
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

function VariableTable({ vars }: { vars: StructuredVar[] }) {
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
            <tr key={i} className="bg-gray-50/30">
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

/* ─── Page ────────────────────────────────────────────────── */
export default function AgentPage() {
  const [activeTab, setActiveTab] = useState<Tab>("telesales");
  const cfg = AGENT_CONFIGS[activeTab];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
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

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {(["telesales", "collection"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab
                  ? "bg-white text-[#12672a] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "telesales" ? "Telesales" : "Collection"}
            </button>
          ))}
        </div>
      </div>

      {/* Disabled notice banner */}
      <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
        <p className="text-xs text-amber-700 leading-relaxed">
          Konfigurasi ini bersifat <strong>read-only</strong>. Hubungi tim Panggil AI untuk melakukan penyesuaian sesuai kebutuhan bisnis Anda.
        </p>
      </div>

      <div className="space-y-6">
        {/* ── Konfigurasi Percakapan ── */}
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
              hint="Instruksi lengkap yang mengatur perilaku, tujuan, dan karakter agent selama percakapan. Mencakup aspek: Goal, Tone, Method, Unexpected Scenario, dan Closing."
              rows={16}
            />
          </div>
        </div>

        {/* ── Parameter Panggilan ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionHeading icon={Settings2} title="Parameter Panggilan" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <DisabledInput
              label="Silence Timeout"
              value={cfg.silenceTimeout}
              unit="detik"
              hint="Durasi keheningan (dalam detik) sebelum panggilan otomatis diakhiri karena tidak ada aktivitas."
            />
            <DisabledInput
              label="Maximum Duration"
              value={cfg.maxDuration}
              unit="detik"
              hint="Batas maksimal durasi panggilan dalam detik. Panggilan akan otomatis diakhiri setelah batas ini tercapai."
            />
            <DisabledInput
              label="Immediate Stop"
              value={cfg.immediateStop}
              unit="detik"
              hint="Durasi (minimum 1 detik) yang harus diisi customer sebelum agent berhenti berbicara dan memberikan giliran bicara."
            />
            <DisabledInput
              label="Back Off Seconds"
              value={cfg.backOffSeconds}
              unit="detik"
              hint="Durasi jeda (minimum 0,5 detik) yang ditunggu agent sebelum mulai berbicara kembali setelah customer selesai bicara."
            />
          </div>
        </div>

        {/* ── Structured Output ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionHeading icon={List} title="Structured Output" />
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            Variabel yang akan ditanyakan dan dikumpulkan oleh agent dari customer selama panggilan berlangsung.
          </p>
          <VariableTable vars={cfg.structuredOutput} />
        </div>

        {/* ── Default Output ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionHeading icon={Database} title="Default Output" />
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            Variabel yang secara otomatis di-generate oleh sistem setelah setiap panggilan selesai.
          </p>
          <VariableTable vars={DEFAULT_OUTPUT} />
        </div>

        {/* ── Contact Card ── */}
        <div className="bg-gradient-to-r from-[#12672a]/5 to-[#1d9a40]/10 border border-[#12672a]/20 rounded-2xl p-6 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#12672a] to-[#1d9a40] flex items-center justify-center shadow-lg shadow-green-800/20 shrink-0">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-0.5">
              Butuh penyesuaian lebih?
            </h3>
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
