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

  const isActive = (item: NavItem) => {
    if (item.exact) return pathname === item.path;
    return pathname.startsWith(item.path);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <aside className="h-screen w-64 border-r border-neutral-200 bg-white flex flex-col sticky top-0">

      {/* =========================================================
          BRAND HEADER
      ========================================================= */}
      <div className="px-6 py-5 border-b border-neutral-200">
        <h1 className="text-sm font-semibold tracking-wide text-neutral-900">
          Furniture Admin
        </h1>

        <p className="text-[11px] text-neutral-500 mt-1">
          Control Panel
        </p>
      </div>

      {/* =========================================================
          NAVIGATION
      ========================================================= */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">

        {NAVIGATION.map((group) => (
          <div key={group.title}>
            {/* GROUP TITLE */}
            <p className="px-3 mb-2 text-[10px] uppercase tracking-widest text-neutral-400">
              {group.title}
            </p>

            {/* ITEMS */}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);

                return (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    className={`
                      group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition
                      ${
                        active
                          ? "bg-neutral-100 text-neutral-900 font-medium shadow-sm"
                          : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                      }
                    `}
                  >

                    {/* ACTIVE BAR */}
                    <span
                      className={`
                        absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full transition
                        ${active ? "bg-neutral-900" : "bg-transparent"}
                      `}
                    />

                    {/* ICON */}
                    <Icon
                      size={18}
                      className={`
                        transition
                        ${active ? "text-neutral-900" : "text-neutral-500 group-hover:text-neutral-900"}
                      `}
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
          FOOTER / ACTIONS
      ========================================================= */}
      <div className="border-t border-neutral-200 p-3 space-y-2">

        {/* ADMIN INFO CARD */}
        <div className="px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-100">
          <p className="text-[11px] text-neutral-500">Logged in as</p>
          <p className="text-sm font-medium text-neutral-800">
            Administrator
          </p>
        </div>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition"
        >
          <LogOut size={18} />
          Logout
        </button>

      </div>
    </aside>
  );
}