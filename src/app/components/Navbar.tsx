"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image"; // Imported for optimized logo rendering
import {
  ShoppingBag,
  ShoppingCart,
  MessageSquare,
  X,
  Menu,
  LogOut,
  LayoutDashboard,
  ChevronRight,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useCart } from "@/hooks/useCart";
import { authService } from "@/services/authService";

// Note: If these custom hooks use SWR or TanStack/React Query under the hood,
// make sure you export their "mutate" or "refetch" handlers to sync them manually.
import { useMyOrders, type OrderWithItems } from "@/hooks/useUserOrders"; 
import { useUserInquiries } from "@/hooks/useUserInquiry";

const NAV_ITEMS = [
  { label: "Home",     route: "/" },
  { label: "Designs",  route: "/catalog" },
  { label: "About",    route: "/about" },
];

interface DropdownItem {
  label: string;
  icon: React.ReactNode;
  route: string;
  badge?: number;
}

export default function Navbar() {
  const router   = useRouter();
  const pathname = usePathname();

  const { authUser, role, initialized } = useUser();
  const { count: cartCount } = useCart();
  
  const onCart    = pathname === "/cart";
  const onOrders  = pathname === "/orders";
  const onInquiry = pathname === "/inquiry";

  // Retain data mutations structures if your custom hooks support re-validation arguments
  const { data: orders, mutate: mutateOrders } = useMyOrders();
  const { data: inquiries, mutate: mutateInquiries } = useUserInquiries();

  // Read lengths safely based on authentication status
  const orderCount = authUser ? (orders?.length ?? 0) : 0;
  const inquiryCount = authUser ? (inquiries?.length ?? 0) : 0;

  const [menuOpen,     setMenuOpen]     = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled,     setScrolled]     = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
    setDropdownOpen(false);
  }

  /* ── FIX: REALTIME NETWORK CACHE REVALIDATION LOUPE ── */
  useEffect(() => {
    if (!authUser?.id) return;

    // Listen to changes on the orders table for this client user
    const ordersChannel = supabase
      .channel(`navbar-orders-${authUser.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `customer_id=eq.${authUser.id}` },
        () => {
          if (typeof mutateOrders === "function") {
            mutateOrders(); // Forces hook cache to instantly clear and re-fetch from database
          }
        }
      )
      .subscribe();

    // Listen to changes on your blueprint inquiries table
    const inquiriesChannel = supabase
      .channel(`navbar-inquiries-${authUser.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inquiries", filter: `user_id=eq.${authUser.id}` },
        () => {
          if (typeof mutateInquiries === "function") {
            mutateInquiries();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(inquiriesChannel);
    };
  }, [authUser?.id, mutateOrders, mutateInquiries]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useBodyScrollLock(menuOpen);

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      await authService.signOut();
      // Clear any cached data
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect even if logout fails
      window.location.href = "/auth/login";
    }
  };

  const initials = authUser?.email
    ? authUser.email.slice(0, 2).toUpperCase()
    : "?";

  const dropdownItems: DropdownItem[] = [
    { label: "My Cart",          icon: <ShoppingCart className="w-4 h-4" />,   route: "/cart",    badge: cartCount > 0 ? cartCount : undefined },
    { label: "Custom Inquiries", icon: <MessageSquare className="w-4 h-4" />,  route: "/inquiry", badge: inquiryCount > 0 ? inquiryCount : undefined },
    { label: "My Orders",        icon: <ShoppingBag className="w-4 h-4" />,    route: "/orders",  badge: orderCount > 0 ? orderCount : undefined },
  ];

  if (role === "admin" || role === "super_admin") {
    dropdownItems.push({
      label: "Admin Dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
      route: "/admin",
    });
  }

  const renderNavItems = (isMobile = false) => {
    return NAV_ITEMS.map(({ label, route }) => {
      const active = pathname === route;
      if (isMobile) {
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
      }
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
    });
  };

  return (
    <>
      {/* ── MAIN NAV ── */}
      <header
        className={`sticky top-0 w-full transition-all duration-300 ${
          scrolled ? "shadow-[0_2px_24px_rgba(0,0,0,0.35)]" : ""
        } bg-[#1C1209]/96 backdrop-blur-md`}
        style={{ zIndex: 50 }}
      >
        {/* Increased navbar height container to h-16 sm:h-20 */}
        <div className="flex justify-between items-center gap-2 sm:gap-4 mx-auto px-3 sm:px-6 max-w-7xl h-16 sm:h-20 transition-all duration-300">

          {/* LOGO LINK */}
          <button
            onClick={() => router.push("/")}
            aria-label="Woodforge Home"
            className="flex items-center shrink-0 group py-1"
          >
            {/* Slightly larger logo for more presence in the navbar */}
            <div className="relative w-56 h-14 sm:w-64 sm:h-16 transition-transform group-hover:scale-[1.01] duration-200 overflow-hidden">
              <Image 
                src="https://havfynxlaoaieomuomzy.supabase.co/storage/v1/object/public/System-Assets/Logo.png"
                alt="Woodforge Logo"
                fill
                sizes="(max-width: 640px) 224px, 256px"
                className="object-contain object-left brightness-110"
                priority
              />
            </div>
          </button>

          {/* CENTER NAV (desktop) */}
          <nav className="hidden md:flex">
            <ul className="flex items-center gap-1">
              {renderNavItems(false)}
            </ul>
          </nav>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <div className="hidden md:flex items-center gap-0.5 sm:gap-1">
              {!initialized ? (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 animate-pulse ml-0.5 sm:ml-1" />
              ) : authUser ? (
                <>
                  {/* ── CART ICON ── */}
                  <button
                    onClick={() => router.push("/cart")}
                    aria-label="My cart"
                    title="Saved designs"
                    className={`relative p-2 rounded-full transition
                      ${onCart
                        ? "text-[#D4A97A] bg-[#D4A97A]/10"
                        : "text-white/60 hover:text-white hover:bg-white/10"}`}
                  >
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                    {cartCount > 0 && (
                      <span className="top-1 right-1 absolute flex justify-center items-center bg-[#D4A97A] rounded-full w-3.5 h-3.5 sm:w-4 sm:h-4 font-bold text-[#1C1209] text-[9px] sm:text-[10px]">
                        {cartCount > 99 ? "99+" : cartCount}
                      </span>
                    )}
                  </button>

                  {/* ── INQUIRY ICON ── */}
                  <button
                    onClick={() => router.push("/inquiry")}
                    aria-label="My inquiries"
                    title="Custom blueprints"
                    className={`relative p-2 rounded-full transition
                      ${onInquiry
                        ? "text-[#D4A97A] bg-[#D4A97A]/10"
                        : "text-white/60 hover:text-white hover:bg-white/10"}`}
                  >
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                    {inquiryCount > 0 && (
                      <span className="top-1 right-1 absolute flex justify-center items-center bg-[#D4A97A] rounded-full w-3.5 h-3.5 sm:w-4 sm:h-4 font-bold text-[#1C1209] text-[9px] sm:text-[10px]">
                        {inquiryCount > 99 ? "99+" : inquiryCount}
                      </span>
                    )}
                  </button>

                  {/* ── ORDERS ICON ── */}
                  <button
                    onClick={() => router.push("/orders")}
                    aria-label="My orders"
                    title="My orders"
                    className={`relative p-2 rounded-full transition
                      ${onOrders
                        ? "text-[#D4A97A] bg-[#D4A97A]/10"
                        : "text-white/60 hover:text-white hover:bg-white/10"}`}
                  >
                    <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                    {orderCount > 0 && (
                      <span className="top-1 right-1 absolute flex justify-center items-center bg-[#D4A97A] rounded-full w-3.5 h-3.5 sm:w-4 sm:h-4 font-bold text-[#1C1209] text-[9px] sm:text-[10px]">
                        {orderCount > 99 ? "99+" : orderCount}
                      </span>
                    )}
                  </button>

                  {/* USER MENU */}
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

                        {dropdownItems.map(({ label, icon, route, badge }) => (
                          <button
                            key={label}
                            onClick={() => { setDropdownOpen(false); router.push(route); }}
                            className="flex items-center gap-3 hover:bg-white/5 px-4 py-3 w-full text-white/70 hover:text-white text-sm text-left transition"
                          >
                            <span className="text-[#D4A97A]">{icon}</span>
                            {label}
                            {badge !== undefined && (
                              <span className="ml-1 flex items-center justify-center bg-[#D4A97A]/20 text-[#D4A97A] text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px]">
                                {badge}
                              </span>
                            )}
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
                </>
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
            </div>

            {/* MOBILE HAMBURGER */}
            <button
              onClick={() => setMenuOpen((p) => !p)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              className="md:hidden hover:bg-white/10 ml-0.5 p-2 rounded-full text-white/60 hover:text-white transition"
            >
              {menuOpen
                ? <X className="w-4 h-4 sm:w-5 sm:h-5" />
                : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>


      </header>

      {/* MOBILE SLIDE-DOWN MENU */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-[#0F0A06]/95 backdrop-blur-md flex flex-col pt-16 sm:pt-20"
          style={{ top: 0 }}
        >
          <div className="h-16 sm:h-20 shrink-0" onClick={() => setMenuOpen(false)} />

          <nav className="flex-1 overflow-y-auto px-4 py-2">

            <ul className="flex flex-col divide-y divide-white/5">
              {renderNavItems(true)}
            </ul>

            {!initialized ? (
              <div className="mt-6 space-y-3">
                <div className="h-12 rounded-full bg-white/5 animate-pulse" />
              </div>
            ) : !authUser ? (
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
            ) : (
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
                
                {dropdownItems.map(({ label, icon, route, badge }) => (
                  <button
                    key={label}
                    onClick={() => { router.push(route); setMenuOpen(false); }}
                    className="flex items-center gap-3 px-4 py-3.5 w-full text-white/70 hover:text-white hover:bg-white/5 text-sm border-b border-white/5 last:border-b-0 transition"
                  >
                    <span className="text-[#D4A97A]">{icon}</span>
                    {label}
                    {badge !== undefined && (
                      <span className="ml-1 flex items-center justify-center bg-[#D4A97A]/20 text-[#D4A97A] text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px]">
                        {badge}
                      </span>
                    )}
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