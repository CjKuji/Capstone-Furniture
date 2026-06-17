"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Plus, 
  Loader2, 
  Package, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2,
  ShieldCheck
} from "lucide-react";

import Navbar from "@/app/components/Navbar";
import PageTransition from "@/app/components/PageTransition";
import Reveal from "@/app/components/Reveal";
import InquiryCard from "@/app/components/InquiryCard";
import CreateInquiryModal from "@/app/components/InquiryModal"; 
import { useUserInquiries } from "@/hooks/useUserInquiry"; 
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

/* ─────────────────────────────────────────────────────────────
   PAYMENT MODAL — Isolated Search Params Boundary
───────────────────────────────────────────────────────────── */
function PaymentSuccessModal() {
  const searchParams = useSearchParams();

  const paymentStatus = searchParams.get("payment");
  const paymentOrderId = searchParams.get("orderId");
  const hasPaymentModal = Boolean(paymentStatus === "success" && paymentOrderId);

  useBodyScrollLock(hasPaymentModal);

  const closeModal = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("payment");
    url.searchParams.delete("orderId");
    window.history.replaceState({}, "", url.toString());
  };

  if (!hasPaymentModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-center bg-black/90 backdrop-blur-xl p-4">
      <div className="bg-[#1C1209] border border-[#D4A97A]/30 p-8 rounded-3xl w-full max-w-sm text-center shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4A97A] to-transparent opacity-50" />

        <div className="mb-6 flex justify-center">
          <div className="bg-emerald-500/10 p-4 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
        </div>

        <h2 className="text-white font-bold text-xl tracking-tight mb-2">
          Payment Confirmed
        </h2>
        <p className="text-white/40 text-xs mb-8 leading-relaxed">
          Transaction successful for Order{" "}
          <span className="text-[#D4A97A] font-mono">
            {paymentOrderId?.slice(-6).toUpperCase()}
          </span>
          . Your workshop inquiry manifest has transitioned to an official build queue.
        </p>

        <button
          onClick={closeModal}
          className="w-full py-4 bg-[#D4A97A] hover:bg-white text-[#0F0A06] text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all active:scale-[0.98]"
        >
          Return to Workspace
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN INQUIRY CONTENT
───────────────────────────────────────────────────────────── */
function InquiryManagementContent() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const { data: inquiries, isLoading, error, refetch } = useUserInquiries();

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <div className="relative bg-[#0F0A06] min-h-screen font-sans text-white antialiased selection:bg-[#D4A97A]/30">
      {/* AMBIENT CANVAS BACKGROUND OVERLAY */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="top-0 -right-40 absolute bg-[#7A4E2D]/5 blur-[120px] rounded-full w-[500px] h-[500px]" />
      </div>

      <div className="fixed top-0 left-0 w-full z-50">
        <Navbar />
      </div>

      <main className="relative z-10 pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        
        {/* EXECUTIVE HEADER BLOCK */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
          <Reveal>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[#A68056] uppercase text-[10px] font-black tracking-[0.2em]">
                <ShieldCheck className="w-3.5 h-3.5" /> Workspace Control Panel
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase font-mono">
                Design <span className="text-[#D4A97A] font-light italic text-2xl lowercase font-sans">Inquiries</span>
              </h1>
              <p className="text-white/40 text-sm max-w-2xl leading-relaxed">
                Track your custom furniture requests, view pricing confirmations, and chat live with our master craftsmen.
              </p>
            </div>
          </Reveal>

          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
            {!isLoading && !error && inquiries && inquiries.length > 0 && (
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#D4A97A] hover:text-white bg-[#D4A97A]/5 hover:bg-[#D4A97A]/10 border border-[#D4A97A]/20 px-4 h-9 rounded-xl transition-all"
              >
                <RefreshCw className="w-3 h-3" /> Refresh Queue
              </button>
            )}
            <button 
              onClick={handleOpenModal}
              className="flex items-center justify-center gap-2 bg-[#D4A97A] hover:bg-[#C4976A] active:scale-95 px-5 h-9 rounded-xl font-bold text-[#1C1209] text-[10px] uppercase tracking-wider transition-all shadow-lg shadow-[#D4A97A]/10 w-full md:w-fit"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" /> New Inquiry
            </button>
          </div>
        </div>

        {/* COMPOSER APP LAYER DISPATCH FLOW STATES */}
        {isLoading ? (
          /* MATRIX SHIMMER LOADING COMPONENT OVERLAY (Synced directly with high-density admin cards) */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
            {Array.from({ length: 3 }).map((_, i) => (
              <div 
                key={i} 
                className="animate-pulse flex flex-col w-full h-[410px] rounded-xl overflow-hidden border border-[#362719] bg-[#120D08]/50 p-4 gap-3.5"
              >
                <div className="flex justify-between items-center border-b border-[#21180F] pb-2.5">
                  <div className="space-y-2">
                    <div className="h-4 w-28 bg-white/10 rounded" />
                    <div className="h-3 w-20 bg-white/5 rounded" />
                  </div>
                  <div className="h-5 w-16 bg-white/5 rounded-md" />
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded" />
                <div className="h-11 w-full bg-white/[0.02] border border-[#21180F] rounded-lg" />
                <div className="h-20 w-full bg-white/[0.01] border border-[#21180F] rounded-lg" />
                <div className="h-14 w-full bg-white/[0.01] border border-[#21180F] rounded-lg" />
                <div className="mt-auto pt-1 grid grid-cols-2 gap-2">
                  <div className="h-8 bg-white/5 rounded-lg" />
                  <div className="h-8 bg-white/10 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 bg-red-950/10 border border-red-900/20 rounded-3xl text-center max-w-xl mx-auto space-y-4 animate-in fade-in duration-200">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 text-red-400 mb-2">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-red-200">Database Connection Failed</h3>
            <p className="text-xs text-red-400/80 font-mono max-w-md mx-auto leading-relaxed bg-black/30 p-3 rounded-xl border border-red-900/30">
              {error instanceof Error ? error.message : "Error connecting to your remote inquiry database channels."}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#D4A97A] hover:text-white bg-[#D4A97A]/5 hover:bg-[#D4A97A]/10 border border-[#D4A97A]/20 px-4 py-2 rounded-lg transition-all"
            >
              <RefreshCw className="w-3 h-3" /> Retry Stream Connection
            </button>
          </div>
        ) : !inquiries || inquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-gradient-to-b from-white/[0.02] to-transparent border border-white/5 rounded-3xl border-dashed h-[350px] text-center">
            <div className="bg-[#D4A97A]/10 p-4 rounded-full border border-[#D4A97A]/20 text-[#D4A97A] mb-4">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white/80">No Inquiries Found</h3>
            <p className="text-xs text-white/40 mt-1.5 max-w-xs leading-relaxed">
              You haven&apos;t submitted any custom requests yet. Click &quot;New Inquiry&quot; to get started with our workshop craftsmen.
            </p>
          </div>
        ) : (
          /* DISPLAY RENDER GRID MAP SYSTEM (Updated to dynamic 3-column layout) */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
            {inquiries.map((inquiry) => {
              const conversation = inquiry.conversations?.[0] || null;

              return (
                <InquiryCard 
                  key={inquiry.id} 
                  inquiry={inquiry} 
                  conversation={conversation} 
                  userId={inquiry.user_id}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* RENDER INQUIRY SUBMISSION CREATION WIZARD */}
      <CreateInquiryModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
      />

      {/* ISOLATED PAYMENT SUCCESS MODAL CONFIGURATION PORTAL */}
      <Suspense fallback={null}>
        <PaymentSuccessModal />
      </Suspense>
    </div>
  );
}

export default function InquiryManagementPage() {
  return (
    <PageTransition>
      <InquiryManagementContent />
    </PageTransition>
  );
}