"use client";

import { useState, useEffect, useRef } from "react";
import { supabase, getOnboardingData, setOnboardingData } from "@/lib/supabase";
import {
  UserCircle, Building2, User, Phone, Briefcase,
  Upload, CheckCircle2, AlertCircle, Eye, EyeOff,
  Lock, FileText, Save, ShieldCheck, Info,
} from "lucide-react";

type Occasion = "telesales" | "collection";
type Tab = "profile" | "password";

/* ─── Shared input style ─── */
const inputCls =
  "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#12672a]/30 focus:border-[#12672a] transition-all placeholder:text-gray-300 bg-white disabled:bg-gray-50 disabled:text-gray-400";

/* ─── File Upload Row ─────────────────────────────────── */
function DocUploadRow({
  label, hint, fileName, onFile,
}: {
  label: string;
  hint: string;
  fileName: string | null;
  onFile: (name: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
        {fileName && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#12672a] shrink-0" />
            <span className="text-xs text-[#12672a] font-medium truncate">{fileName}</span>
          </div>
        )}
        {!fileName && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-xs text-amber-600 font-medium">Belum diunggah — diperlukan untuk menggunakan layanan</span>
          </div>
        )}
      </div>
      <div className="shrink-0">
        <input
          ref={ref}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) onFile(f.name);
          }}
        />
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
            fileName
              ? "border-[#12672a]/30 text-[#12672a] hover:bg-[#12672a]/5"
              : "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          {fileName ? "Ganti File" : "Unggah"}
        </button>
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────── */
export default function ProfilePage() {
  const [tab, setTab] = useState<Tab>("profile");
  const [userId, setUserId] = useState<string | null>(null);

  /* ── Dokumen Legal state ── */
  const [nibFile,  setNibFile]  = useState<string | null>(null);
  const [npwpFile, setNpwpFile] = useState<string | null>(null);

  /* ── Profil Bisnis state ── */
  const [picName,     setPicName]     = useState("");
  const [picMobile,   setPicMobile]   = useState("");
  const [companyName, setCompanyName] = useState("");
  const [occasions,   setOccasions]   = useState<Occasion[]>([]);
  const [profileSaving,  setProfileSaving]  = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  /* ── Ganti Password state ── */
  const [currentPw,   setCurrentPw]   = useState("");
  const [newPw,       setNewPw]       = useState("");
  const [confirmPw,   setConfirmPw]   = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwSaving,    setPwSaving]    = useState(false);
  const [pwSuccess,   setPwSuccess]   = useState(false);
  const [pwError,     setPwError]     = useState("");

  /* ── Load session + onboarding data ── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      setUserId(session.user.id);
      const saved = getOnboardingData(session.user.id);
      if (saved.picName)     setPicName(saved.picName as string);
      if (saved.picMobile)   setPicMobile(saved.picMobile as string);
      if (saved.companyName) setCompanyName(saved.companyName as string);
      if (saved.occasions)   setOccasions(saved.occasions as Occasion[]);
    });
  }, []);

  function toggleOccasion(o: Occasion) {
    setOccasions(prev => prev.includes(o) ? prev.filter(x => x !== o) : [...prev, o]);
  }

  function formatMobile(value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 4)  return digits;
    if (digits.length <= 8)  return `${digits.slice(0,4)}-${digits.slice(4)}`;
    return `${digits.slice(0,4)}-${digits.slice(4,8)}-${digits.slice(8,12)}`;
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setProfileSaving(true);
    setProfileSuccess(false);
    setOnboardingData(userId, { picName, picMobile, companyName, occasions });
    await new Promise(r => setTimeout(r, 600));
    setProfileSaving(false);
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  }

  const pwValidError =
    newPw.length > 0 && newPw.length < 8
      ? "Password minimal 8 karakter"
      : newPw.length >= 8 && confirmPw.length > 0 && newPw !== confirmPw
      ? "Konfirmasi password tidak cocok"
      : "";

  const pwIsValid = currentPw.length > 0 && newPw.length >= 8 && newPw === confirmPw;

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!pwIsValid) return;
    setPwSaving(true);
    setPwError("");
    setPwSuccess(false);

    const { error } = await supabase.auth.updateUser({ password: newPw });

    if (error) {
      setPwError(error.message);
    } else {
      setPwSuccess(true);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setTimeout(() => setPwSuccess(false), 4000);
    }
    setPwSaving(false);
  }

  const profileIsValid =
    picName.trim().length > 0 &&
    picMobile.replace(/\D/g, "").length >= 10 &&
    companyName.trim().length > 0 &&
    occasions.length > 0;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#12672a] to-[#1d9a40] flex items-center justify-center shadow-md shadow-green-800/20">
          <UserCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Profil</h1>
          <p className="text-xs text-gray-400 mt-0.5">Kelola informasi bisnis dan keamanan akun Anda</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1 w-fit mb-7">
        {([
          { val: "profile",  label: "Profil Bisnis",  icon: Building2   },
          { val: "password", label: "Ganti Password", icon: Lock        },
        ] as const).map(({ val, label, icon: Icon }) => (
          <button
            key={val}
            onClick={() => setTab(val)}
            className={`flex items-center gap-2 px-5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === val ? "bg-white text-[#12672a] shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ═══ TAB: PROFIL BISNIS ═══ */}
      {tab === "profile" && (
        <div className="space-y-6">

          {/* Card 1 — Dokumen Legal */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                <FileText className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="text-sm font-semibold text-gray-800">Dokumen Legal</h2>
              <span className="ml-auto text-xs text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full font-medium border border-amber-200">
                Wajib
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-4 ml-10">
              Dokumen berikut diperlukan untuk verifikasi akun dan penggunaan layanan Panggil AI.
            </p>

            <div className="border border-gray-100 rounded-xl px-4 divide-y divide-gray-100">
              <DocUploadRow
                label="NIB (Nomor Induk Berusaha)"
                hint="File PDF, JPG, atau PNG · Maks. 5 MB"
                fileName={nibFile}
                onFile={setNibFile}
              />
              <DocUploadRow
                label="NPWP Perusahaan"
                hint="File PDF, JPG, atau PNG · Maks. 5 MB"
                fileName={npwpFile}
                onFile={setNpwpFile}
              />
            </div>

            {(!nibFile || !npwpFile) && (
              <div className="mt-4 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  Akun Anda <strong>belum dapat menggunakan layanan</strong> sebelum kedua dokumen ini diunggah dan diverifikasi oleh tim kami.
                </span>
              </div>
            )}

            {nibFile && npwpFile && (
              <div className="mt-4 flex items-start gap-2 text-xs text-[#12672a] bg-[#12672a]/5 border border-[#12672a]/20 rounded-xl p-3">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  Kedua dokumen telah diunggah. Tim kami akan melakukan verifikasi dalam <strong>1–2 hari kerja</strong>.
                </span>
              </div>
            )}
          </div>

          {/* Card 2 — Data Bisnis */}
          <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-7 h-7 rounded-lg bg-[#12672a]/10 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-[#12672a]" />
              </div>
              <h2 className="text-sm font-semibold text-gray-800">Data Bisnis</h2>
            </div>

            <div className="space-y-4">
              {/* PIC Name */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Nama PIC (Person in Charge)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={picName}
                    onChange={e => setPicName(e.target.value)}
                    placeholder="cth. Budi Santoso"
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </div>

              {/* PIC Mobile */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Nomor HP PIC
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <input
                    type="tel"
                    value={picMobile}
                    onChange={e => setPicMobile(formatMobile(e.target.value))}
                    placeholder="cth. 0812-3456-7890"
                    maxLength={14}
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Nama Perusahaan
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="cth. PT. Maju Bersama Indonesia"
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </div>

              {/* Occasions */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Kebutuhan Layanan
                </label>
                <p className="text-xs text-gray-400 mb-2">Pilih satu atau keduanya</p>
                <div className="grid grid-cols-2 gap-3">
                  {(["telesales", "collection"] as Occasion[]).map(o => {
                    const checked = occasions.includes(o);
                    return (
                      <button
                        key={o}
                        type="button"
                        onClick={() => toggleOccasion(o)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                          checked
                            ? "border-[#12672a] bg-[#12672a]/5 text-[#12672a]"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                          checked ? "border-[#12672a] bg-[#12672a]" : "border-gray-300"
                        }`}>
                          {checked && (
                            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                              <path d="M1.5 5l2.5 2.5 4.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5" />
                          {o === "telesales" ? "Telesales" : "Collection"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Save button */}
            <div className="mt-6 flex items-center gap-3">
              <button
                type="submit"
                disabled={!profileIsValid || profileSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#12672a] hover:bg-[#0e5222] disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 text-sm font-semibold rounded-xl transition-all shadow-md shadow-green-800/20 disabled:shadow-none"
              >
                {profileSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Simpan Perubahan
                  </>
                )}
              </button>
              {profileSuccess && (
                <div className="flex items-center gap-1.5 text-sm text-[#12672a]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Perubahan berhasil disimpan</span>
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ═══ TAB: GANTI PASSWORD ═══ */}
      {tab === "password" && (
        <form onSubmit={handleChangePassword} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-7 h-7 rounded-lg bg-[#12672a]/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-[#12672a]" />
            </div>
            <h2 className="text-sm font-semibold text-gray-800">Ganti Password</h2>
          </div>

          {/* Error */}
          {pwError && (
            <div className="mb-5 flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {pwError}
            </div>
          )}

          {/* Success */}
          {pwSuccess && (
            <div className="mb-5 flex items-start gap-2.5 px-4 py-3 bg-[#12672a]/5 border border-[#12672a]/20 rounded-xl text-sm text-[#12672a]">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              Password berhasil diubah.
            </div>
          )}

          <div className="space-y-4">
            {/* Current password */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Password Saat Ini</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                  placeholder="Masukkan password saat ini"
                  autoComplete="current-password"
                  className={`${inputCls} pl-9 pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              {/* New password */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Password Baru</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    autoComplete="new-password"
                    className={`${inputCls} pl-9 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength bar */}
                {newPw.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1,2,3,4].map(i => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            newPw.length >= i * 3
                              ? newPw.length < 8
                                ? "bg-red-400"
                                : newPw.length < 12
                                ? "bg-amber-400"
                                : "bg-[#12672a]"
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-xs font-medium ${
                      newPw.length < 8 ? "text-red-400" : newPw.length < 12 ? "text-amber-500" : "text-[#12672a]"
                    }`}>
                      {newPw.length < 8 ? "Lemah" : newPw.length < 12 ? "Sedang" : "Kuat"}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm new password */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Konfirmasi Password Baru</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    placeholder="Ulangi password baru"
                    autoComplete="new-password"
                    className={`${inputCls} pl-9 pr-10 ${
                      pwValidError ? "border-red-300 focus:ring-red-200 focus:border-red-400" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwValidError && (
                  <p className="mt-1.5 text-xs text-red-500">{pwValidError}</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="submit"
              disabled={!pwIsValid || pwSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#12672a] hover:bg-[#0e5222] disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 text-sm font-semibold rounded-xl transition-all shadow-md shadow-green-800/20 disabled:shadow-none"
            >
              {pwSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Ubah Password
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
