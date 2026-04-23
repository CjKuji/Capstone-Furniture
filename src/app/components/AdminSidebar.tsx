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
   MENU CONFIG (SCALES CLEANLY)
   ========================================================= */

const NAVIGATION: NavGroup[] = [
  {
    title: "Core",
    items: [
      { label: "Dashboard", path: "/admin", icon: Home, exact: true },
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
    <aside className="w-64 h-screen sticky top-0 bg-white border-r border-neutral-200 flex flex-col">

      {/* ================= BRAND ================= */}
      <div className="px-6 py-5 border-b border-neutral-200">
        <h1 className="text-sm font-semibold text-neutral-900">
          Furniture Admin
        </h1>
        <p className="text-[11px] text-neutral-500 mt-0.5">
          Inventory Control System
        </p>
      </div>

      {/* ================= NAV ================= */}
      <nav className="flex-1 px-3 py-4 space-y-6">

        {NAVIGATION.map((group) => (
          <div key={group.title}>
            <p className="text-[11px] text-neutral-400 px-3 mb-2 uppercase tracking-wider">
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
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition relative
                      ${
                        active
                          ? "bg-neutral-100 text-neutral-900 font-medium"
                          : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                      }
                    `}
                  >
                    {/* ACTIVE INDICATOR */}
                    <span
                      className={`
                        absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full transition
                        ${active ? "bg-neutral-900" : "bg-transparent"}
                      `}
                    />

                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ================= FOOTER ================= */}
      <div className="p-3 border-t border-neutral-200">

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition"
        >
          <LogOut size={18} />
          Logout
        </button>

      </div>
    </aside>
  );
}