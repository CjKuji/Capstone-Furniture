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
  const { authUser, role } = useUser();

  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setMenuOpen(false); setDropdownOpen(false); }, [pathname]);

  /* lock body scroll when mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const initials = authUser?.email
    ? authUser.email.slice(0, 2).toUpperCase()
    : "?";

  const cartCount = 0;

  return (
    <>
      {/* ── MAIN NAV ── */}
      <header
        className={`sticky top-0 z-50 w-full transition-shadow duration-300 ${
          scrolled ? "shadow-[0_2px_24px_rgba(0,0,0,0.35)]" : ""
        } bg-[#1C1209]/96 backdrop-blur-md`}
      >
        {/* nav row — fixed height 56px on mobile, 64px on sm+ */}
        <div className="flex justify-between items-center gap-2 sm:gap-4 mx-auto px-3 sm:px-6 max-w-7xl h-14 sm:h-16">

          {/* LOGO */}
          <button
            onClick={() => router.push("/")}
            aria-label="Go to home"
            className="flex items-center gap-2 text-white shrink-0"
          >
            <span className="font-bold text-[#D4A97A] text-base sm:text-xl tracking-widest">
              WOOD<span className="text-white">FORGE</span>
            </span>
          </button>

          {/* CENTER NAV (desktop) */}
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

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-0.5 sm:gap-1">

            {/* SEARCH TOGGLE */}
            <button
              onClick={() => setSearchOpen((p) => !p)}
              aria-label="Toggle search"
              className="hover:bg-white/10 p-2 rounded-full text-white/60 hover:text-white transition"
            >
              {searchOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Search className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {/* ORDERS / CART */}
            {authUser && (
              <button
                onClick={() => router.push("/orders")}
                aria-label="My orders"
                className="relative hover:bg-white/10 p-2 rounded-full text-white/60 hover:text-white transition"
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                {cartCount > 0 && (
                  <span className="top-1 right-1 absolute flex justify-center items-center bg-[#D4A97A] rounded-full w-3.5 h-3.5 sm:w-4 sm:h-4 font-bold text-[#1C1209] text-[9px] sm:text-[10px]">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* USER MENU */}
            {authUser ? (
              <div className="relative ml-0.5 sm:ml-1" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((p) => !p)}
                  aria-expanded={dropdownOpen}
                  aria-label="User menu"
                  className="flex justify-center items-center bg-[#D4A97A] hover:opacity-90 rounded-full w-8 h-8 sm:w-9 sm:h-9 font-bold text-[#1C1209] text-xs sm:text-sm transition"
                >
                  {initials}
                </button>

                {dropdownOpen && (
                  <div className="right-0 absolute bg-[#241810] shadow-2xl mt-3 border border-white/10 rounded-xl ring-1 ring-black/20 w-56 sm:w-60 overflow-hidden">
                    {/* User info */}
                    <div className="flex items-center gap-3 px-4 py-3 border-white/10 border-b">
                      <div className="flex justify-center items-center bg-[#D4A97A] rounded-full w-8 h-8 sm:w-9 sm:h-9 font-bold text-[#1C1209] text-xs sm:text-sm shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white text-xs sm:text-sm truncate">
                          {authUser.email}
                        </p>
                        {role && (
                          <p className="text-[#D4A97A] text-[10px] sm:text-xs capitalize">{role}</p>
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
                  className="px-3 sm:px-4 py-1.5 rounded-full font-medium text-white/70 hover:text-white text-xs sm:text-sm transition"
                >
                  Login
                </button>
                <button
                  onClick={() => router.push("/auth/register")}
                  className="bg-[#D4A97A] hover:bg-[#C4976A] px-3 sm:px-4 py-1.5 rounded-full font-semibold text-[#1C1209] text-xs sm:text-sm transition"
                >
                  Get Started
                </button>
              </div>
            )}

            {/* MOBILE HAMBURGER */}
            <button
              onClick={() => setMenuOpen((p) => !p)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              className="md:hidden hover:bg-white/10 ml-0.5 p-2 rounded-full text-white/60 hover:text-white transition"
            >
              {menuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>

        {/* SEARCH BAR */}
        {searchOpen && (
          <div className="bg-[#1C1209] px-3 sm:px-6 py-2.5 sm:py-3 border-white/10 border-t">
            <div className="flex items-center gap-2 sm:gap-3 bg-white/5 mx-auto px-3 sm:px-4 py-2 sm:py-2.5 border border-white/10 rounded-lg max-w-2xl">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/40 shrink-0" />
              <input
                ref={searchRef}
                aria-label="Search designs"
                placeholder="Search designs, materials, finishes…"
                className="bg-transparent outline-none w-full text-white placeholder:text-white/30 text-xs sm:text-sm"
                onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="text-white/30 hover:text-white/60 transition"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* MOBILE SLIDE-DOWN MENU — full-screen overlay */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-[#0F0A06]/95 backdrop-blur-md flex flex-col pt-14 sm:pt-16"
          style={{ top: 0 }}
        >
          {/* close hit area at top */}
          <div className="h-14 sm:h-16 shrink-0" onClick={() => setMenuOpen(false)} />

          <nav className="flex-1 overflow-y-auto px-4 py-2">
            <ul className="flex flex-col divide-y divide-white/5">
              {NAV_ITEMS.map(({ label, route }) => {
                const active = pathname === route;
                return (
                  <li key={label}>
                    <button
                      onClick={() => { router.push(route); setMenuOpen(false); }}
                      className={`flex justify-between items-center py-4 w-full font-medium text-base transition
                        ${active ? "text-[#D4A97A]" : "text-white/70 hover:text-white"}`}
                    >
                      {label}
                      <ChevronRight className={`w-4 h-4 ${active ? "text-[#D4A97A]/50" : "text-white/20"}`} />
                    </button>
                  </li>
                );
              })}
            </ul>

            {!authUser && (
              <div className="flex flex-col gap-3 mt-6">
                <button
                  onClick={() => { router.push("/auth/login"); setMenuOpen(false); }}
                  className="w-full py-3 border border-white/20 rounded-full font-medium text-white/70 hover:text-white text-sm transition"
                >
                  Login
                </button>
                <button
                  onClick={() => { router.push("/auth/register"); setMenuOpen(false); }}
                  className="w-full bg-[#D4A97A] hover:bg-[#C4976A] py-3 rounded-full font-semibold text-[#1C1209] text-sm transition"
                >
                  Get Started
                </button>
              </div>
            )}

            {authUser && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
                  <div className="flex justify-center items-center bg-[#D4A97A] rounded-full w-10 h-10 font-bold text-[#1C1209] shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white text-sm truncate">{authUser.email}</p>
                    {role && <p className="text-[#D4A97A] text-xs capitalize">{role}</p>}
                  </div>
                </div>
                {[
                  { label: "Profile", icon: <UserCircle2 className="w-4 h-4" />, route: "/profile" },
                  { label: "My Orders", icon: <ShoppingBag className="w-4 h-4" />, route: "/orders" },
                  ...(role === "admin" || role === "super_admin"
                    ? [{ label: "Admin Dashboard", icon: <LayoutDashboard className="w-4 h-4" />, route: "/admin" }]
                    : []),
                ].map(({ label, icon, route }) => (
                  <button
                    key={label}
                    onClick={() => { router.push(route); setMenuOpen(false); }}
                    className="flex items-center gap-3 px-4 py-3.5 w-full text-white/70 hover:text-white hover:bg-white/5 text-sm border-b border-white/5 last:border-b-0 transition"
                  >
                    <span className="text-[#D4A97A]">{icon}</span>
                    {label}
                    <ChevronRight className="ml-auto w-3.5 h-3.5 text-white/20" />
                  </button>
                ))}
                <button
                  onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="flex items-center gap-3 px-4 py-3.5 w-full text-red-400 hover:text-red-300 hover:bg-red-950/20 text-sm transition"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  );
}