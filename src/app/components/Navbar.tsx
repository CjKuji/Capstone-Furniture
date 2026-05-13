"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, ShoppingBag, X, Menu, LogOut, LayoutDashboard, UserCircle2, ChevronRight } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";

const NAV_ITEMS = [
  { label: "Home", route: "/" },
  { label: "Designs", route: "/catalog" },
  { label: "About", route: "/about" },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { authUser, role, loading } = useUser();

  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  /* scroll shadow */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* focus search input when opened */
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  /* close dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* close mobile menu on route change */
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const initials = authUser?.email
    ? authUser.email.slice(0, 2).toUpperCase()
    : "?";

  const cartCount = 0;

  if (loading) {
    return (
      <header className="top-0 z-50 sticky bg-[#1C1209]/95 backdrop-blur-md w-full h-16">
        <div className="flex justify-between items-center mx-auto px-4 sm:px-6 max-w-7xl h-full">
          <div className="bg-white/10 rounded-full w-32 h-5 animate-pulse" />
          <div className="flex gap-3">
            <div className="bg-white/10 rounded-full w-8 h-8 animate-pulse" />
            <div className="bg-white/10 rounded-full w-8 h-8 animate-pulse" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* ── MAIN NAV ─────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 w-full transition-shadow duration-300 ${
          scrolled ? "shadow-[0_2px_24px_rgba(0,0,0,0.18)]" : ""
        } bg-[#1C1209]/96 backdrop-blur-md`}
      >
        <div className="flex justify-between items-center gap-4 mx-auto px-4 sm:px-6 max-w-7xl h-16">

          {/* ── LOGO ─────────────────────────── */}
          <button
            onClick={() => router.push("/")}
            aria-label="Go to home"
            className="flex items-center gap-2 text-white shrink-0"
          >
            <span className="font-bold text-[#D4A97A] text-xl tracking-widest">
              WOOD<span className="text-white">FORGE</span>
            </span>
          </button>

          {/* ── CENTER NAV (desktop) ──────────── */}
          <nav className="hidden md:flex">
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map(({ label, route }) => {
                const active = pathname === route;
                return (
                  <li key={label}>
                    <button
                      onClick={() => router.push(route)}
                      className={`relative px-4 py-2 text-sm font-medium tracking-wide transition-colors duration-150
                        ${active ? "text-white" : "text-white/60 hover:text-white"}`}
                    >
                      {label}
                      {active && (
                        <span className="-bottom-px absolute inset-x-4 bg-[#D4A97A] rounded-full h-[2px]" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* ── RIGHT ACTIONS ────────────────── */}
          <div className="flex items-center gap-1">

            {/* SEARCH TOGGLE */}
            <button
              onClick={() => setSearchOpen((p) => !p)}
              aria-label="Toggle search"
              className="hover:bg-white/10 p-2 rounded-full text-white/60 hover:text-white transition"
            >
              {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>

            {/* ORDERS / CART */}
            {authUser && (
              <button
                onClick={() => router.push("/orders")}
                aria-label="My orders"
                className="relative hover:bg-white/10 p-2 rounded-full text-white/60 hover:text-white transition"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="top-1 right-1 absolute flex justify-center items-center bg-[#D4A97A] rounded-full w-4 h-4 font-bold text-[#1C1209] text-[10px]">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* USER MENU */}
            {authUser ? (
              <div className="relative ml-1" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((p) => !p)}
                  aria-expanded={dropdownOpen}
                  aria-label="User menu"
                  className="flex justify-center items-center bg-[#D4A97A] hover:opacity-90 rounded-full w-9 h-9 font-bold text-[#1C1209] text-sm transition"
                >
                  {initials}
                </button>

                {dropdownOpen && (
                  <div className="right-0 absolute bg-[#241810] shadow-2xl mt-3 border border-white/10 rounded-xl ring-1 ring-black/20 w-60 overflow-hidden">
                    {/* User info */}
                    <div className="flex items-center gap-3 px-4 py-3 border-white/10 border-b">
                      <div className="flex justify-center items-center bg-[#D4A97A] rounded-full w-9 h-9 font-bold text-[#1C1209] text-sm shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white text-sm truncate">
                          {authUser.email}
                        </p>
                        {role && (
                          <p className="text-[#D4A97A] text-xs capitalize">{role}</p>
                        )}
                      </div>
                    </div>

                    {/* Menu items */}
                    {[
                      {
                        label: "Profile",
                        icon: <UserCircle2 className="w-4 h-4" />,
                        route: "/profile",
                      },
                      ...(role === "admin" || role === "super_admin"
                        ? [{
                            label: "Admin Dashboard",
                            icon: <LayoutDashboard className="w-4 h-4" />,
                            route: "/admin",
                          }]
                        : []),
                    ].map(({ label, icon, route }) => (
                      <button
                        key={label}
                        onClick={() => { setDropdownOpen(false); router.push(route); }}
                        className="flex items-center gap-3 hover:bg-white/5 px-4 py-3 w-full text-white/70 hover:text-white text-sm text-left transition"
                      >
                        <span className="text-[#D4A97A]">{icon}</span>
                        {label}
                        <ChevronRight className="ml-auto w-3.5 h-3.5 text-white/30" />
                      </button>
                    ))}

                    <div className="border-white/10 border-t">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 hover:bg-red-950/30 px-4 py-3 w-full text-red-400 hover:text-red-300 text-sm text-left transition"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 ml-2">
                <button
                  onClick={() => router.push("/auth/login")}
                  className="px-4 py-1.5 rounded-full font-medium text-white/70 hover:text-white text-sm transition"
                >
                  Login
                </button>
                <button
                  onClick={() => router.push("/auth/register")}
                  className="bg-[#D4A97A] hover:bg-[#C4976A] px-4 py-1.5 rounded-full font-semibold text-[#1C1209] text-sm transition"
                >
                  Get Started
                </button>
              </div>
            )}

            {/* MOBILE HAMBURGER */}
            <button
              onClick={() => setMenuOpen((p) => !p)}
              aria-label="Toggle menu"
              className="md:hidden hover:bg-white/10 ml-1 p-2 rounded-full text-white/60 hover:text-white transition"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ── SEARCH BAR (expands below nav) ───────────────────── */}
        {searchOpen && (
          <div className="bg-[#1C1209] px-4 sm:px-6 py-3 border-white/10 border-t">
            <div className="flex items-center gap-3 bg-white/5 mx-auto px-4 py-2.5 border border-white/10 rounded-lg max-w-2xl">
              <Search className="w-4 h-4 text-white/40 shrink-0" />
              <input
                ref={searchRef}
                aria-label="Search designs"
                placeholder="Search designs, materials, finishes…"
                className="bg-transparent outline-none w-full text-white placeholder:text-white/30 text-sm"
                onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="text-white/30 hover:text-white/60 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── MOBILE SLIDE-DOWN MENU ───────────────────────────── */}
      {menuOpen && (
        <div className="md:hidden top-16 z-40 fixed inset-x-0 bg-[#1C1209]/98 backdrop-blur-md border-white/10 border-b">
          <ul className="flex flex-col px-4 py-2 divide-y divide-white/5">
            {NAV_ITEMS.map(({ label, route }) => (
              <li key={label}>
                <button
                  onClick={() => router.push(route)}
                  className="flex justify-between items-center py-3.5 w-full font-medium text-white/70 hover:text-white text-sm"
                >
                  {label}
                  <ChevronRight className="w-4 h-4 text-white/30" />
                </button>
              </li>
            ))}
            {!authUser && (
              <li className="flex gap-3 py-4">
                <button
                  onClick={() => router.push("/auth/login")}
                  className="flex-1 py-2 border border-white/20 rounded-full font-medium text-white/70 hover:text-white text-sm"
                >
                  Login
                </button>
                <button
                  onClick={() => router.push("/auth/register")}
                  className="flex-1 bg-[#D4A97A] hover:bg-[#C4976A] py-2 rounded-full font-semibold text-[#1C1209] text-sm"
                >
                  Get Started
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </>
  );
}