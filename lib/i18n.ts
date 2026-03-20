export type Language = "id" | "en";

export const translations = {
  id: {
    // Login
    loginTitle: "Selamat Datang",
    loginSubtitle: "Masuk ke akun Panggil AI Anda",
    emailLabel: "Email",
    emailPlaceholder: "email@perusahaan.com",
    passwordLabel: "Kata Sandi",
    passwordPlaceholder: "Masukkan kata sandi",
    loginButton: "Masuk",
    loginWithGoogle: "Masuk dengan Google",
    orDivider: "atau",
    noAccount: "Belum punya akun?",
    registerLink: "Daftar sekarang",
    forgotPassword: "Lupa kata sandi?",
    loginLoading: "Memproses...",

    // Nudging
    nudgeHeadline: "Otomatisasi Panggilan Bisnis Anda",
    nudgeSubheadline: "Platform AI Voice Agent terdepan di Indonesia",
    nudgeStat1Value: "70%",
    nudgeStat1Label: "Hemat biaya call center",
    nudgeStat2Value: "500+",
    nudgeStat2Label: "Klien B2B Indonesia",
    nudgeStat3Value: "10x",
    nudgeStat3Label: "Lebih cepat dari call center tradisional",
    nudgeFeature1: "Otomatisasi ribuan panggilan dalam hitungan menit",
    nudgeFeature2: "AI percakapan natural berbahasa Indonesia",
    nudgeFeature3: "Laporan real-time & analitik mendalam",
    nudgeTestimonial: "\"Panggil AI membantu kami meningkatkan collection rate sebesar 45% dalam 3 bulan pertama.\"",
    nudgeTestimonialAuthor: "— Budi Santoso, CFO PT Finansial Maju",

    // Onboarding common
    stepOf: "Langkah",
    of: "dari",
    back: "Kembali",
    next: "Lanjutkan",
    saving: "Menyimpan...",

    // Company Profile
    companyProfileTitle: "Profil Perusahaan",
    companyProfileSubtitle: "Lengkapi informasi perusahaan Anda",
    picNameLabel: "Nama PIC",
    picNamePlaceholder: "Nama penanggung jawab",
    picMobileLabel: "Nomor HP PIC",
    picMobilePlaceholder: "08xx-xxxx-xxxx",
    companyNameLabel: "Nama Perusahaan (Legal)",
    companyNamePlaceholder: "PT / CV nama perusahaan",
    occasionLabel: "Kebutuhan Layanan",
    occasionHint: "Pilih satu atau lebih",
    occasionTelesales: "Telesales",
    occasionCollection: "Collection",

    // OTP
    otpTitle: "Verifikasi Nomor HP",
    otpSubtitle: "Kode OTP telah dikirim ke nomor HP Anda",
    otpLabel: "Masukkan Kode OTP",
    otpPlaceholder: "------",
    otpResend: "Kirim Ulang OTP",
    otpResendIn: "Kirim ulang dalam",
    otpSeconds: "detik",
    otpVerify: "Verifikasi",
    otpVerifying: "Memverifikasi...",
    otpNote: "Masukkan kode 6 digit yang dikirim ke nomor HP Anda",

    // Dashboard
    dashboardTitle: "Dashboard",
    congratsTitle: "Selamat Datang di Panggil AI!",
    congratsMessage: "Akun Anda berhasil dibuat. Mulailah mengotomatisasi panggilan bisnis Anda sekarang.",
    congratsClose: "Tutup",
    navDashboard: "Dashboard",
    navLeads: "Leads",
    navAgent: "Agent",
    navLogs: "Logs",
    navBilling: "Billing",
    navProfile: "Profil",
    comingSoon: "Segera Hadir",
    comingSoonDesc: "Halaman ini sedang dalam pengembangan.",

    // Language toggle
    switchLang: "English",
  },

  en: {
    // Login
    loginTitle: "Welcome Back",
    loginSubtitle: "Sign in to your Panggil AI account",
    emailLabel: "Email",
    emailPlaceholder: "email@company.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
    loginButton: "Sign In",
    loginWithGoogle: "Sign in with Google",
    orDivider: "or",
    noAccount: "Don't have an account?",
    registerLink: "Register now",
    forgotPassword: "Forgot password?",
    loginLoading: "Processing...",

    // Nudging
    nudgeHeadline: "Automate Your Business Calls",
    nudgeSubheadline: "Indonesia's leading AI Voice Agent platform",
    nudgeStat1Value: "70%",
    nudgeStat1Label: "Call center cost savings",
    nudgeStat2Value: "500+",
    nudgeStat2Label: "Indonesian B2B clients",
    nudgeStat3Value: "10x",
    nudgeStat3Label: "Faster than traditional call centers",
    nudgeFeature1: "Automate thousands of calls in minutes",
    nudgeFeature2: "Natural AI conversation in Bahasa Indonesia",
    nudgeFeature3: "Real-time reports & deep analytics",
    nudgeTestimonial: "\"Panggil AI helped us increase our collection rate by 45% in the first 3 months.\"",
    nudgeTestimonialAuthor: "— Budi Santoso, CFO PT Finansial Maju",

    // Onboarding common
    stepOf: "Step",
    of: "of",
    back: "Back",
    next: "Continue",
    saving: "Saving...",

    // Company Profile
    companyProfileTitle: "Company Profile",
    companyProfileSubtitle: "Complete your company information",
    picNameLabel: "PIC Name",
    picNamePlaceholder: "Person in charge name",
    picMobileLabel: "PIC Mobile Number",
    picMobilePlaceholder: "08xx-xxxx-xxxx",
    companyNameLabel: "Company Legal Name",
    companyNamePlaceholder: "PT / CV company name",
    occasionLabel: "Service Needs",
    occasionHint: "Choose one or more",
    occasionTelesales: "Telesales",
    occasionCollection: "Collection",

    // OTP
    otpTitle: "Verify Phone Number",
    otpSubtitle: "An OTP code has been sent to your phone number",
    otpLabel: "Enter OTP Code",
    otpPlaceholder: "------",
    otpResend: "Resend OTP",
    otpResendIn: "Resend in",
    otpSeconds: "seconds",
    otpVerify: "Verify",
    otpVerifying: "Verifying...",
    otpNote: "Enter the 6-digit code sent to your phone number",

    // Dashboard
    dashboardTitle: "Dashboard",
    congratsTitle: "Welcome to Panggil AI!",
    congratsMessage: "Your account has been successfully created. Start automating your business calls now.",
    congratsClose: "Close",
    navDashboard: "Dashboard",
    navLeads: "Leads",
    navAgent: "Agent",
    navLogs: "Logs",
    navBilling: "Billing",
    navProfile: "Profile",
    comingSoon: "Coming Soon",
    comingSoonDesc: "This page is under development.",

    // Language toggle
    switchLang: "Indonesia",
  },
} as const;

export type TranslationKey = keyof typeof translations.id;

export function t(lang: Language, key: TranslationKey): string {
  return translations[lang][key] ?? translations.id[key];
}
