"use client";

import { Phone, Globe } from "lucide-react";
import { type Language, t } from "@/lib/i18n";

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  lang: Language;
  onLangToggle: () => void;
}

export default function OnboardingLayout({
  children,
  currentStep,
  totalSteps,
  lang,
  onLangToggle,
}: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-sm">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">Panggil AI</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Step indicator */}
            <span className="text-xs text-gray-400">
              {t(lang, "stepOf")} {currentStep} {t(lang, "of")} {totalSteps}
            </span>

            {/* Language toggle */}
            <button
              onClick={onLangToggle}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-gray-50"
            >
              <Globe className="w-3.5 h-3.5" />
              {t(lang, "switchLang")}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary-light transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center px-6 py-12">
        <div className="w-full max-w-lg animate-slide-up">{children}</div>
      </main>
    </div>
  );
}
