"use client";

import React, { useState } from "react";
import { Plus, Loader2, Package, AlertTriangle, RefreshCw } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import PageTransition from "@/app/components/PageTransition";
import Reveal from "@/app/components/Reveal";
import InquiryCard from "@/app/components/InquiryCard";
import CreateInquiryModal from "@/app/components/InquiryModal"; 
import { useUserInquiries } from "@/hooks/useUserInquiry"; 

export default function InquiryManagementPage() {
  // Declare modal view tracking control variables
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Pull real-time strongly-typed query response arrays
  const { data: inquiries, isLoading, error, refetch } = useUserInquiries();

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <PageTransition>
      <div className="relative bg-[#0F0A06] min-h-screen font-sans text-white antialiased selection:bg-[#D4A97A]/30">
        <div className="fixed top-0 left-0 w-full z-50">
          <Navbar />
        </div>

        <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 border-b border-white/5 pb-8">
            <Reveal>
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  Design <span className="text-[#D4A97A] font-light italic">Inquiries</span>
                </h1>
                <p className="text-white/40 mt-2 text-sm max-w-md">
                  Track your custom furniture requests, view pricing confirmations, and chat live with our craftsmen.
                </p>
              </div>
            </Reveal>
            <button 
              onClick={handleOpenModal}
              className="flex items-center justify-center gap-2 bg-[#D4A97A] hover:bg-[#C4976A] active:scale-95 px-6 py-3 rounded-full font-bold text-[#1C1209] text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#D4A97A]/10 w-full sm:w-fit shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> New Inquiry
            </button>
          </div>

          {/* APP UI FLOW FETCH STATES */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[400px] gap-3 bg-white/[0.01] border border-white/5 rounded-3xl">
              <Loader2 className="w-6 h-6 animate-spin text-[#D4A97A]" />
              <p className="text-xs font-mono tracking-widest text-white/40 uppercase">Loading inquiry pipeline...</p>
            </div>
          ) : error ? (
            <div className="p-8 bg-red-950/10 border border-red-900/20 rounded-3xl text-center max-w-xl mx-auto space-y-4">
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
            <div className="flex flex-col items-center justify-center p-12 bg-gradient-to-b from-white/[0.02] to-transparent border border-white/5 rounded-3xl border-dashed h-[400px] text-center">
              <div className="bg-[#D4A97A]/10 p-4 rounded-full border border-[#D4A97A]/20 text-[#D4A97A] mb-4">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold">No Inquiries Found</h3>
              <p className="text-xs text-white/40 mt-2 max-w-xs leading-relaxed">
                You haven't submitted any custom requests yet. Click "New Inquiry" to get started.
              </p>
            </div>
          ) : (
            /* 4-COLUMN RESPONSIVE CARD DISPLAY GRID */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
              {inquiries.map((inquiry) => {
                // Safely extract chat details, falling back cleanly via normalization layer
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
      </div>

      {/* RENDER INQUIRY SUBMISSION CREATION WIZARD */}
      <CreateInquiryModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
      />
    </PageTransition>
  );
}