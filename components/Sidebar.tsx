"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Phone, LayoutDashboard, Users, Bot, FileText,
  CreditCard, UserCircle, LogOut, ChevronLeft, Menu, Megaphone,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { t, type Language } from "@/lib/i18n";

interface SidebarProps {
  lang: Language;
}

const navItems = [
  { key: "navDashboard", href: "/dashboard",          icon: LayoutDashboard },
  { key: "navCampaign",  href: "/dashboard/campaign", icon: Megaphone       },
  { key: "navLeads",     href: "/dashboard/leads",    icon: Users           },
  { key: "navAgent",     href: "/dashboard/agent",    icon: Bot             },
  { key: "navLogs",      href: "/dashboard/logs",     icon: FileText        },
  { key: "navBilling",   href: "/dashboard/billing",  icon: CreditCard      },
  { key: "navProfile",   href: "/dashboard/profile",  icon: UserCircle      },
] as const;

export default function Sidebar({ lang }: SidebarProps) {
  const pathname   = usePathname();
  const router     = useRouter();
  const [collapsed,  setCollapsed]  = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <aside
      className={`relative flex flex-col h-screen bg-white border-r border-gray-100 transition-all duration-300 shrink-0 ${
        collapsed ? "w-[68px]" : "w-[220px]"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100 overflow-hidden">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#12672a] to-[#0d5222] flex items-center justify-center shadow-sm shrink-0">
          <Phone className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-gray-900 text-sm whitespace-nowrap overflow-hidden">
            Panggil AI
          </span>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-[22px] w-7 h-7 rounded-full border border-gray-200 bg-white flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors z-10"
      >
        {collapsed ? (
          <Menu className="w-3.5 h-3.5 text-gray-500" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
        )}
      </button>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map(({ key, href, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? "bg-[#12672a]/10 text-[#12672a]"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
              title={collapsed ? t(lang, key as Parameters<typeof t>[1]) : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-[#12672a]" : "text-gray-400 group-hover:text-gray-600"
                }`}
              />
              {!collapsed && (
                <span className="truncate">{t(lang, key as Parameters<typeof t>[1])}</span>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#12672a]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5 border-t border-gray-100 pt-3">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150 group disabled:opacity-60"
          title={collapsed ? "Keluar" : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0 text-gray-400 group-hover:text-red-500" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  );
}
