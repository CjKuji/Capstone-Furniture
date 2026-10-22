import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import GlobalAIChatbot from "@/app/components/GlobalAIChatbot";
import CustomerTheme from "@/app/components/CustomerTheme";
import { AIChatProvider } from "@/app/context/AIChatContext";
import { CartProvider } from "@/hooks/useCart";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Furniture3D - Customize Your Furniture in Real Time",
  description: "Browse, customize, and visualize furniture in real-time 3D before you buy.",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${fraunces.variable} antialiased`}>
        <Providers>
          <AIChatProvider>
            <CartProvider>
              <CustomerTheme>{children}</CustomerTheme>

              {/* Single global chatbot instance controlled via useAIChat across context domains */}
              <GlobalAIChatbot />
            </CartProvider>
          </AIChatProvider>
        </Providers>
      </body>
    </html>
  );
}