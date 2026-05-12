"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  User as UserIcon,
  ChevronDown,
  ShoppingBag,
  Heart,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";

export default function Navbar() {
  const router = useRouter();

  const { user, authUser, role, loading } = useUser();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * =========================================================
   * OUTSIDE CLICK CLOSE
   * =========================================================
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * =========================================================
   * LOGOUT
   * =========================================================
   */
  const handleLogout = async () => {
    setDropdownOpen(false);
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  /**
   * =========================================================
   * NAV ITEMS (ABOUT KEPT)
   * =========================================================
   */
  const navItems = [
    { label: "Home", route: "/" },
    { label: "Designs", route: "/catalog" },
    { label: "About Us", route: "/about" }, // KEEP THIS
  ];

  /**
   * =========================================================
   * LOADING STATE
   * =========================================================
   */
  if (loading) {
    return (
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-[#E6D9C8] bg-[#FAF6F1]/80 px-6 py-4 backdrop-blur-md">
        <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
        <div className="flex gap-3">
          <div className="h-9 w-20 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-9 w-20 animate-pulse rounded-lg bg-gray-200" />
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-[#E6D9C8] bg-[#FAF6F1]/90 px-6 py-4 backdrop-blur-md">

      {/* =========================================================
          BRAND
      ========================================================= */}
      <button
        onClick={() => router.push("/")}
        className="text-2xl font-bold tracking-tight text-[#3A2B22] transition hover:text-[#7A4E2D]"
      >
        WoodForge
      </button>

      {/* =========================================================
          CENTER NAV
      ========================================================= */}
      <ul className="hidden items-center gap-10 md:flex">
        {navItems.map((item) => (
          <li key={item.label}>
            <button
              onClick={() => router.push(item.route)}
              className="text-sm font-medium text-[#4A3B2A] transition hover:text-[#7A4E2D]"
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>

      {/* =========================================================
          RIGHT ACTIONS
      ========================================================= */}
      <div className="flex items-center gap-3">

        {/* ORDERS */}
        {authUser && (
          <button
            title="Your orders"
            onClick={() => router.push("/orders")}
            className="rounded-full p-2 transition hover:bg-[#F3E2D2]"
          >
            <ShoppingBag className="h-5 w-5 text-[#4A3B2A]" />
          </button>
        )}

        {/* =========================================================
            USER MENU
        ========================================================= */}
        {authUser ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((p) => !p)}
              className="flex items-center gap-2 rounded-full bg-[#7A4E2D] px-3 py-2 text-white shadow-sm transition hover:bg-[#663D22]"
            >
              <UserIcon className="h-5 w-5" />
              <ChevronDown className="h-4 w-4" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-[#E6D9C8] bg-white shadow-xl">

                {/* USER INFO */}
                <div className="border-b px-4 py-3">
                  <p className="truncate text-sm font-medium text-[#3A2B22]">
                    {authUser?.email || "Guest"}
                  </p>

                  {role && (
                    <p className="text-xs text-gray-500 capitalize">
                      {role}
                    </p>
                  )}
                </div>

                {/* PROFILE */}
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    router.push("/profile");
                  }}
                  className="block w-full px-4 py-3 text-left text-sm hover:bg-[#F3E2D2]"
                >
                  Profile
                </button>

                {/* ADMIN */}
                {(role === "admin" || role === "super_admin") && (
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      router.push("/admin");
                    }}
                    className="block w-full px-4 py-3 text-left text-sm hover:bg-[#F3E2D2]"
                  >
                    Admin Dashboard
                  </button>
                )}

                {/* LOGOUT */}
                <button
                  onClick={handleLogout}
                  className="block w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <button
              onClick={() => router.push("/auth/login")}
              className="rounded-xl bg-[#7A4E2D] px-4 py-2 text-sm text-white hover:bg-[#663D22]"
            >
              Login
            </button>

            <button
              onClick={() => router.push("/auth/register")}
              className="rounded-xl border border-[#7A4E2D] px-4 py-2 text-sm text-[#7A4E2D] hover:bg-[#7A4E2D] hover:text-white"
            >
              Register
            </button>
          </>
        )}
      </div>
    </nav>
  );
}