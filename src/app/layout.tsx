import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import GlobalAIChatbot from "@/app/components/GlobalAIChatbot";
import { AIChatProvider } from "@/app/context/AIChatContext";
import { CartProvider } from "@/hooks/useCart"; // ← ADDED

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Furniture3D - Customize Your Furniture in Real Time",
  description:
    "Browse, customize, and visualize furniture in real-time 3D before you buy.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <AIChatProvider>
            <CartProvider> {/* ← ADDED */}
              {children}
              {/* Single chatbot instance — context is set from any page */}
              <GlobalAIChatbot />
            </CartProvider> {/* ← ADDED */}
          </AIChatProvider>
        </Providers>
      </body>
    </html>
  );
}