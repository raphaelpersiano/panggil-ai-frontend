"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import { type Language } from "@/lib/i18n";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [lang] = useState<Language>("id");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
        return;
      }
      setReady(true);
    });
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar lang={lang} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
