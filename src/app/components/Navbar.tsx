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
                ${active ? "text-[var(--primary)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"}`}
            >
              {label}
              <ChevronRight className={`w-4 h-4 ${active ? "text-[var(--primary)]/60" : "text-[var(--text-muted)]/40"}`} />
            </button>
          </li>
        );
      }
      return (
        <li key={label}>
          <button
            onClick={() => router.push(route)}
            className={`relative px-4 py-2 text-sm font-medium tracking-wide transition-colors duration-150
              ${active ? "text-[var(--on-wood)]" : "text-[var(--on-wood)]/75 hover:text-[var(--on-wood)]"}`}
          >
            {label}
            {active && (
              <span className="-bottom-px absolute inset-x-4 bg-[var(--accent)] rounded-full h-[2px]" />
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
        className={`sticky top-0 w-full print:hidden transition-shadow duration-300 ${
          scrolled ? "shadow-[0_2px_24px_rgba(59,40,27,0.10)]" : ""
        } bg-[var(--wood-dark)]/95 backdrop-blur-md border-b border-[var(--accent)]/30`}
        style={{ zIndex: 50 }}
      >
        <div className="flex justify-between items-center gap-2 sm:gap-4 mx-auto px-3 sm:px-6 max-w-7xl h-14 sm:h-16">

          {/* LOGO LINK */}
          <button
            onClick={() => router.push("/")}
            aria-label="Woodforge Home"
            className="flex items-center shrink-0 group py-1"
          >
            <div className="relative w-40 h-10 sm:w-48 sm:h-12 transition-transform group-hover:scale-[1.01] duration-200">
              <Image 
                src="https://havfynxlaoaieomuomzy.supabase.co/storage/v1/object/public/System-Assets/Logo.png"
                alt="Woodforge Logo"
                fill
                sizes="(max-width: 640px) 160px, 192px"
                className="object-contain object-left"
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
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[var(--surface-alt)] animate-pulse ml-0.5 sm:ml-1" />
              ) : authUser ? (
                <>
                  {/* ── CART ICON ── */}
                  <button
                    onClick={() => router.push("/cart")}
                    aria-label="My cart"
                    title="Saved designs"
                    className={`relative p-2 rounded-full transition
                      ${onCart
                        ? "text-[var(--wood-dark)] bg-[var(--accent)]"
                        : "text-[var(--on-wood)] hover:text-[var(--accent)] hover:bg-[var(--on-wood)]/10"}`}
                  >
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                    {cartCount > 0 && (
                      <span className="top-1 right-1 absolute flex justify-center items-center bg-[var(--accent)] rounded-full w-3.5 h-3.5 sm:w-4 sm:h-4 font-bold text-[var(--wood-dark)] text-[9px] sm:text-[10px]">
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
                        ? "text-[var(--wood-dark)] bg-[var(--accent)]"
                        : "text-[var(--on-wood)] hover:text-[var(--accent)] hover:bg-[var(--on-wood)]/10"}`}
                  >
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                    {inquiryCount > 0 && (
                      <span className="top-1 right-1 absolute flex justify-center items-center bg-[var(--accent)] rounded-full w-3.5 h-3.5 sm:w-4 sm:h-4 font-bold text-[var(--wood-dark)] text-[9px] sm:text-[10px]">
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
                        ? "text-[var(--wood-dark)] bg-[var(--accent)]"
                        : "text-[var(--on-wood)] hover:text-[var(--accent)] hover:bg-[var(--on-wood)]/10"}`}
                  >
                    <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                    {orderCount > 0 && (
                      <span className="top-1 right-1 absolute flex justify-center items-center bg-[var(--accent)] rounded-full w-3.5 h-3.5 sm:w-4 sm:h-4 font-bold text-[var(--wood-dark)] text-[9px] sm:text-[10px]">
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
                      className="flex justify-center items-center bg-[var(--surface)] hover:bg-[var(--surface-alt)] rounded-full w-8 h-8 sm:w-9 sm:h-9 font-bold text-[var(--text)] text-xs sm:text-sm transition"
                    >
                      {initials}
                    </button>

                    {dropdownOpen && (
                      <div className="right-0 absolute bg-[var(--surface)] shadow-[0_12px_32px_rgba(59,40,27,0.12)] mt-3 border border-[var(--border)] rounded-xl w-56 sm:w-60 overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-3 border-[var(--border)] border-b">
                          <div className="flex justify-center items-center bg-[var(--primary)] rounded-full w-8 h-8 sm:w-9 sm:h-9 font-bold text-[var(--primary-foreground)] text-xs sm:text-sm shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-[var(--text)] text-xs sm:text-sm truncate">
                              {authUser.email}
                            </p>
                            {role && (
                              <p className="text-[var(--primary)] text-[10px] sm:text-xs capitalize">{role}</p>
                            )}
                          </div>
                        </div>

                        {dropdownItems.map(({ label, icon, route, badge }) => (
                          <button
                            key={label}
                            onClick={() => { setDropdownOpen(false); router.push(route); }}
                            className="flex items-center gap-3 hover:bg-[var(--surface-alt)] px-4 py-3 w-full text-[var(--text-muted)] hover:text-[var(--text)] text-sm text-left transition"
                          >
                            <span className="text-[var(--primary)]">{icon}</span>
                            {label}
                            {badge !== undefined && (
                              <span className="ml-1 flex items-center justify-center bg-[var(--surface-alt)] text-[var(--primary)] text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px]">
                                {badge}
                              </span>
                            )}
                            <ChevronRight className="ml-auto w-3.5 h-3.5 text-[var(--text-muted)]" />
                          </button>
                        ))}

                        <div className="border-[var(--border)] border-t">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 hover:bg-red-50 px-4 py-3 w-full text-[var(--danger)] hover:text-[var(--danger)] text-sm text-left transition"
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
                    className="px-3 sm:px-4 py-1.5 rounded-full font-medium text-[var(--on-wood)]/85 hover:text-[var(--on-wood)] text-xs sm:text-sm transition"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => router.push("/auth/register")}
                    className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-3 sm:px-4 py-1.5 rounded-full font-semibold text-[var(--primary-foreground)] text-xs sm:text-sm transition"
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
              className="md:hidden hover:bg-[var(--on-wood)]/10 ml-0.5 p-2 rounded-full text-[var(--on-wood)] hover:text-[var(--accent)] transition"
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
          className="md:hidden fixed inset-0 z-40 bg-[var(--bg)]/95 backdrop-blur-md flex flex-col pt-14 sm:pt-16"
          style={{ top: 0 }}
        >
          <div className="h-14 sm:h-16 shrink-0" onClick={() => setMenuOpen(false)} />

          <nav className="flex-1 overflow-y-auto px-4 py-2">

            <ul className="flex flex-col divide-y divide-[var(--border)]">
              {renderNavItems(true)}
            </ul>

            {!initialized ? (
              <div className="mt-6 space-y-3">
                <div className="h-12 rounded-full bg-[var(--surface-alt)] animate-pulse" />
              </div>
            ) : !authUser ? (
              <div className="flex flex-col gap-3 mt-6">
                <button
                  onClick={() => { router.push("/auth/login"); setMenuOpen(false); }}
                  className="w-full py-3 border border-[var(--border)] rounded-full font-medium text-[var(--text-muted)] hover:text-[var(--text)] text-sm transition"
                >
                  Login
                </button>
                <button
                  onClick={() => { router.push("/auth/register"); setMenuOpen(false); }}
                  className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] py-3 rounded-full font-semibold text-[var(--primary-foreground)] text-sm transition"
                >
                  Get Started
                </button>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--border)]">
                  <div className="flex justify-center items-center bg-[var(--primary)] rounded-full w-10 h-10 font-bold text-[var(--primary-foreground)] shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--text)] text-sm truncate">{authUser.email}</p>
                    {role && <p className="text-[var(--primary)] text-xs capitalize">{role}</p>}
                  </div>
                </div>
                
                {dropdownItems.map(({ label, icon, route, badge }) => (
                  <button
                    key={label}
                    onClick={() => { router.push(route); setMenuOpen(false); }}
                    className="flex items-center gap-3 px-4 py-3.5 w-full text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-alt)] text-sm border-b border-[var(--border)] last:border-b-0 transition"
                  >
                    <span className="text-[var(--primary)]">{icon}</span>
                    {label}
                    {badge !== undefined && (
                      <span className="ml-1 flex items-center justify-center bg-[var(--surface-alt)] text-[var(--primary)] text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px]">
                        {badge}
                      </span>
                    )}
                    <ChevronRight className="ml-auto w-3.5 h-3.5 text-[var(--text-muted)]" />
                  </button>
                ))}
                
                <button
                  onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="flex items-center gap-3 px-4 py-3.5 w-full text-[var(--danger)] hover:text-[var(--danger)] hover:bg-red-50 text-sm transition"
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