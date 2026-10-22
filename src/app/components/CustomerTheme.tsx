"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/app/components/Navbar";

interface CustomerThemeProps {
  children: ReactNode;
}

export default function CustomerTheme({ children }: CustomerThemeProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAuthRoute = pathname.startsWith("/auth/");
  const isFurnitureDetailRoute = pathname.startsWith("/furniture/");
  const showCustomerNavbar = !isAdminRoute && !isAuthRoute;

  useEffect(() => {
    document.body.classList.toggle("customer-theme-active", !isAdminRoute);
    document.documentElement.classList.toggle(
      "customer-furniture-detail-active",
      !isAdminRoute && isFurnitureDetailRoute
    );
    document.body.classList.toggle(
      "customer-furniture-detail-active",
      !isAdminRoute && isFurnitureDetailRoute
    );
    return () => {
      document.body.classList.remove(
        "customer-theme-active",
        "customer-furniture-detail-active"
      );
      document.documentElement.classList.remove("customer-furniture-detail-active");
    };
  }, [isAdminRoute, isFurnitureDetailRoute]);

  return (
    <div
      className={
        isAdminRoute
          ? undefined
          : `customer-theme${isFurnitureDetailRoute ? " customer-furniture-detail" : ""}`
      }
    >
      {showCustomerNavbar && <Navbar />}
      {children}
    </div>
  );
}
