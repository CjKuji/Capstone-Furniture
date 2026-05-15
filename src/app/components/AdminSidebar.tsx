"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Box,
  ShoppingCart,
  LogOut,
  Settings,
  Globe,
  LucideIcon,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";

/* =========================================================
   TYPES
========================================================= */

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

/* =========================================================
   NAV CONFIG
========================================================= */

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

/* =========================================================
   COMPONENT
========================================================= */

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
    <aside className="h-screen w-64 bg-[#1C1209] border-r border-white/10 flex flex-col sticky top-0">

      {/* =========================================================
          BRAND HEADER
      ========================================================= */}
      <div className="px-6 py-5 border-b border-white/10">
        <h1 className="text-[#D4A97A] font-bold tracking-widest text-sm">
          WOODFORGE
        </h1>

        <p className="text-white/40 text-[11px] mt-1">
          Admin Control Panel
        </p>
      </div>

      {/* =========================================================
          NAVIGATION
      ========================================================= */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">

        {NAVIGATION.map((group) => (
          <div key={group.title}>
            <p className="px-3 mb-2 text-[10px] uppercase tracking-widest text-white/30">
              {group.title}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);

                return (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition
                      ${
                        active
                          ? "bg-white/5 text-white shadow-[0_0_0_1px_rgba(212,169,122,0.25)]"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                  >
                    {/* ACTIVE INDICATOR BAR */}
                    <span
                      className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full transition
                        ${active ? "bg-[#D4A97A]" : "bg-transparent"}`}
                    />

                    {/* ICON */}
                    <Icon
                      size={18}
                      className={`transition ${
                        active
                          ? "text-[#D4A97A]"
                          : "text-white/40 group-hover:text-white"
                      }`}
                    />

                    {/* LABEL */}
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <div className="border-t border-white/10 p-3 space-y-3">

        {/* USER CARD */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
          <div className="w-8 h-8 rounded-full bg-[#D4A97A] text-[#1C1209] flex items-center justify-center font-bold text-xs">
            {initials}
          </div>

          <div className="min-w-0">
            <p className="text-white text-sm truncate">
              {authUser?.email ?? "Admin"}
            </p>
            <p className="text-[#D4A97A] text-[11px] capitalize">
              {role ?? "admin"}
            </p>
          </div>
        </div>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-950/20 transition"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}