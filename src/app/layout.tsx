import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import GlobalAIChatbot from "@/app/components/GlobalAIChatbot";
import { AIChatProvider } from "@/app/context/AIChatContext";
import { CartProvider } from "@/hooks/useCart";

const geistSans = Geist({ 
  variable: "--font-geist-sans", 
  subsets: ["latin"] 
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <AIChatProvider>
            <CartProvider>
              
              {children}
              
              {/* Single global chatbot instance controlled via useAIChat across context domains */}
              <GlobalAIChatbot />

            </CartProvider>
          </AIChatProvider>
        </Providers>
      </body>
    </html>
  );
}