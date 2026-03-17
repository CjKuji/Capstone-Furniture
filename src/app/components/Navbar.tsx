"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User as UserIcon, ChevronDown, ShoppingBag, Heart } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ---------------- GET CURRENT USER ----------------
  useEffect(() => {
    const getSessionUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) setUser(session.user);
    };
    getSessionUser();

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // ---------------- FETCH ROLE ----------------
  useEffect(() => {
    const fetchRole = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (!error && data) setRole(data.role);
    };
    fetchRole();
  }, [user]);

  // ---------------- CLOSE DROPDOWN ON OUTSIDE CLICK ----------------
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    router.push("/auth/login");
  };

  // ---------------- NAV ITEMS ----------------
  const navItems = [
    { label: "Home", route: "/" },
    { label: "Catalog", route: "/catalog" },
    { label: "About Us", route: "/about" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-md px-6 py-4 flex justify-between items-center">
      {/* LOGO */}
      <span
        className="font-bold text-2xl text-[#4B3F3F] cursor-pointer hover:text-[#A16B4C] transition"
        onClick={() => router.push("/")}
      >
        Furniture3D
      </span>

      {/* NAV ITEMS */}
      <ul className="hidden md:flex gap-8 text-[#4B3F3F] font-medium">
        {navItems.map((item) => (
          <li key={item.label}>
            <button
              className="hover:text-[#A16B4C] transition"
              onClick={() => router.push(item.route)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <button
              title="Saved furniture"
              onClick={() => router.push("/saved")}
              className="p-2 rounded-full hover:bg-[#FFF0E0] transition"
            >
              <Heart className="w-5 h-5 text-[#4B3F3F]" />
            </button>

            <button
              title="Your orders"
              onClick={() => router.push("/orders")}
              className="p-2 rounded-full hover:bg-[#FFF0E0] transition"
            >
              <ShoppingBag className="w-5 h-5 text-[#4B3F3F]" />
            </button>

            {/* USER DROPDOWN */}
            <div className="relative" ref={dropdownRef}>
              <button
                aria-label="User menu"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-2 rounded-full bg-[#A16B4C] text-white hover:bg-[#8C593F] transition"
              >
                <UserIcon className="w-5 h-5" />
                <ChevronDown className="w-4 h-4" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-md border overflow-hidden">
                  <div className="px-4 py-3 text-sm text-gray-600 border-b">
                    {user.email}
                  </div>

                  <button
                    onClick={() => router.push("/profile")}
                    className="block w-full text-left px-4 py-2 hover:bg-[#FFF0E0] transition"
                  >
                    Profile
                  </button>

                  {role === "admin" && (
                    <button
                      onClick={() => router.push("/admin")}
                      className="block w-full text-left px-4 py-2 hover:bg-[#FFF0E0] transition"
                    >
                      Admin Dashboard
                    </button>
                  )}

                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 transition"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex gap-4">
            <button
              onClick={() => router.push("/auth/login")}
              className="px-4 py-2 bg-[#A16B4C] text-white rounded hover:bg-[#8C593F] transition"
            >
              Login
            </button>
            <button
              onClick={() => router.push("/auth/register")}
              className="px-4 py-2 bg-[#FFDAB9] text-[#4B3F3F] rounded hover:bg-[#FFC79A] transition"
            >
              Register
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}