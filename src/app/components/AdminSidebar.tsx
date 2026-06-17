"use client";

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

  const isActive = (item: NavItem) => {
    if (item.exact) return pathname === item.path;
    return pathname.startsWith(item.path);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const initials = authUser?.email
    ? authUser.email.slice(0, 2).toUpperCase()
    : "AD";

  return (
    <>
      {/* BRAND INJECTED GLOBAL SCROLLBAR OVERRIDES */}
      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #060403; /* Matches Dark Nav Frame */
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 9999px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #D4A97A; /* Highlights into Muted Accent Gold */
        }
        html {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.08) #060403;
        }
      `}</style>

      {/* SIDEBAR CONTAINER: Set to darker #060403 context over page's #0F0A06 */}
      <aside className="h-screen w-64 bg-[#060403] border-r border-white/[0.03] flex flex-col sticky top-0 z-40 select-none antialiased">

        {/* BRAND HEADER */}
        <div className="px-6 py-6 border-b border-white/[0.03] relative">
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4A97A]/10 to-transparent" />
          
          <div className="flex items-center gap-2.5">
            <div className="h-4 w-1 bg-[#D4A97A] rounded-full shadow-[0_0_8px_rgba(212,169,122,0.3)]" />
            <h1 className="text-white font-extrabold tracking-[0.2em] text-sm font-sans">
              WOODFORGE
            </h1>
          </div>
          <p className="text-white/20 text-[10px] uppercase font-bold tracking-wider mt-1.5 pl-3.5">
            Admin Control Shell
          </p>
        </div>

        {/* NAVIGATION FEED */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-6">
          {NAVIGATION.map((group) => (
            <div key={group.title} className="space-y-1">
              <p className="px-3 text-[9px] font-black uppercase tracking-[0.18em] text-white/20">
                {group.title}
              </p>

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item);

                  return (
                    <button
                      key={item.path}
                      onClick={() => router.push(item.path)}
                      className={`group relative w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 outline-none
                        ${
                          active
                            ? "bg-white/[0.04] text-white shadow-sm"
                            : "text-white/40 hover:text-white hover:bg-white/[0.015]"
                        }`}
                    >
                      {/* ACTIVE ACCENT INDICATOR STRIP */}
                      <span
                        className={`absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-4 rounded-r-full transition-all duration-200
                          ${active ? "bg-[#D4A97A] shadow-[0_0_8px_rgba(212,169,122,0.5)]" : "bg-transparent opacity-0"}`}
                      />

                      {/* CONTENT FRAME */}
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          size={15}
                          className={`transition-all duration-150 shrink-0
                            ${active ? "text-[#D4A97A]" : "text-white/20 group-hover:text-white/50"}`}
                        />
                        <span className="truncate tracking-wide">{item.label}</span>
                      </div>

                      {/* TRAILING ACCENT */}
                      {!active && (
                        <ChevronRight 
                          size={11} 
                          className="text-white/0 -translate-x-1 opacity-0 group-hover:text-white/30 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-150 shrink-0" 
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* FOOTER */}
        <div className="border-t border-white/[0.03] p-4 space-y-3 bg-[#040302]/40 backdrop-blur-md">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.01] border border-white/[0.02]">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#D4A97A]/20 to-[#D4A97A]/5 border border-[#D4A97A]/20 text-[#D4A97A] flex items-center justify-center font-black text-xs shrink-0">
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-white/80 text-xs font-semibold truncate tracking-wide">
                {authUser?.email ?? "Administrator"}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-1 w-1 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                <p className="text-[#D4A97A]/80 text-[9px] font-black uppercase tracking-wider truncate">
                  {role ?? "System Admin"}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.03] transition-all duration-150 group outline-none"
          >
            <LogOut size={14} className="text-red-400/30 group-hover:text-red-400 transitions-transform" />
            <span className="tracking-wide">Exit Secure Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}