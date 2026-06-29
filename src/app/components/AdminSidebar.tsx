"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Box,
  ShoppingCart,
  MessageSquare,
  BarChart2,
  LogOut,
  Settings,
  Globe,
  LucideIcon,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";

type NavItem = {
  label: string;
  path: string;
  icon: LucideIcon;
  exact?: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const NAVIGATION: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", path: "/admin", icon: Home, exact: true },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Furniture", path: "/admin/furniture", icon: Box },
      { label: "Orders", path: "/admin/orders", icon: ShoppingCart },
      { label: "Inquiries", path: "/admin/inquiry", icon: MessageSquare },
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Reports", path: "/admin/reports", icon: BarChart2 },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", path: "/admin/settings", icon: Settings },
      { label: "Main Site", path: "/", icon: Globe },
    ],
  },
];

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { authUser, role } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigateTo = (path: string) => {
    setMobileOpen(false);
    router.push(path);
  };

  const isActive = (item: NavItem) => {
    if (item.exact) return pathname === item.path;
    return pathname.startsWith(item.path);
  };

  const handleLogout = async () => {
    setMobileOpen(false);
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const initials = authUser?.email
    ? authUser.email.slice(0, 2).toUpperCase()
    : "AD";

  const renderContent = () => (
    <>
      <div className="border-b border-white/3 px-4 py-4 relative md:px-3 md:py-4 lg:px-6 lg:py-6">
        <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-[#D4A97A]/10 to-transparent" />

        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="h-4 w-1 shrink-0 rounded-full bg-[#D4A97A] shadow-[0_0_8px_rgba(212,169,122,0.3)]" />
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold tracking-[0.2em] text-white md:hidden lg:block">
                WOODFORGE
              </h1>
              <p className="mt-1.5 pl-3.5 text-[10px] font-bold uppercase tracking-wider text-white/20 md:hidden lg:block">
                Admin Control Shell
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/6 bg-white/3 text-white/70 transition hover:text-white md:hidden"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 md:py-5 lg:py-6">
        {NAVIGATION.map((group) => (
          <div key={group.title} className="space-y-1">
            <p className="px-3 text-[9px] font-black uppercase tracking-[0.18em] text-white/20 md:hidden lg:block">
              {group.title}
            </p>

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);

                return (
                  <button
                    key={item.path}
                    onClick={() => navigateTo(item.path)}
                    className={`group relative flex w-full items-center rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 outline-none md:justify-center md:px-2 md:py-3 lg:justify-between lg:px-3 lg:py-2 ${
                      active
                        ? "bg-white/4 text-white shadow-sm"
                        : "text-white/40 hover:bg-white/1.5 hover:text-white"
                    }`}
                  >
                    <span
                      className={`absolute left-0 top-1/2 h-4 w-[2.5px] -translate-y-1/2 rounded-r-full transition-all duration-200 ${
                        active
                          ? "bg-[#D4A97A] shadow-[0_0_8px_rgba(212,169,122,0.5)]"
                          : "bg-transparent opacity-0"
                      }`}
                    />

                    <div className="flex min-w-0 items-center gap-3 md:gap-0 lg:gap-3">
                      <Icon
                        size={15}
                        className={`shrink-0 transition-all duration-150 ${
                          active
                            ? "text-[#D4A97A]"
                            : "text-white/20 group-hover:text-white/50"
                        }`}
                      />
                      <span className="truncate tracking-wide md:hidden lg:block">
                        {item.label}
                      </span>
                    </div>

                    {!active && (
                      <ChevronRight
                        size={11}
                        className="ml-2 shrink-0 text-white/0 opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-white/30 md:hidden lg:block"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/3 bg-[#040302]/40 p-4 backdrop-blur-md md:p-2.5 lg:p-4">
        <div className="flex items-center gap-3 rounded-xl border border-white/2 bg-white/1 px-3 py-2.5 md:flex-col md:items-center md:gap-2 md:px-2 md:py-2 lg:flex-row lg:justify-start lg:px-3 lg:py-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#D4A97A]/20 bg-linear-to-br from-[#D4A97A]/20 to-[#D4A97A]/5 text-xs font-black text-[#D4A97A]">
            {initials}
          </div>

          <div className="min-w-0 flex-1 md:hidden lg:block">
            <p className="truncate text-xs font-semibold tracking-wide text-white/80">
              {authUser?.email ?? "Administrator"}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
              <p className="truncate text-[9px] font-black uppercase tracking-wider text-[#D4A97A]/80">
                {role ?? "System Admin"}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-red-400/60 transition-all duration-150 outline-none hover:bg-red-500/3 hover:text-red-400 md:justify-center md:px-1 md:py-2 lg:justify-start lg:px-3"
        >
          <LogOut size={14} className="text-red-400/30 transition group-hover:text-red-400" />
          <span className="tracking-wide md:hidden lg:block">Exit Secure Session</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #060403;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 9999px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #D4A97A;
        }
        html {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.08) #060403;
        }
      `}</style>

      <button
        type="button"
        onClick={() => setMobileOpen((open) => !open)}
        className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-full border border-white/10 bg-[#060403]/90 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80 shadow-lg backdrop-blur md:hidden"
        aria-label={mobileOpen ? "Close admin menu" : "Open admin menu"}
      >
        {mobileOpen ? <X size={16} /> : <Menu size={16} />}
        <span>{mobileOpen ? "Close" : "Menu"}</span>
      </button>

      <button
        type="button"
        aria-label="Close admin menu"
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200 md:hidden ${
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col border-r border-white/3 bg-[#060403] shadow-2xl transition-transform duration-300 select-none antialiased md:hidden ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {renderContent()}
      </aside>

      <aside className="hidden h-screen w-20 shrink-0 flex-col border-r border-white/3 bg-[#060403] select-none antialiased md:flex lg:w-64">
        {renderContent()}
      </aside>
    </>
  );
}