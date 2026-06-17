"use client";

import React from "react";
import { Loader2, AlertTriangle, RefreshCw, ShieldCheck, Eye } from "lucide-react";
import PageTransition from "@/app/components/PageTransition";
import Reveal from "@/app/components/Reveal";
import AdminInquiryCard from "@/app/components/AdminInquiryCard"; 
import { useAdminInquiries } from "@/hooks/useAdminInquiry";
import { useUser } from "@/hooks/useUser"; 

export default function AdminInquiriesPage() {
  const { user } = useUser();
  const currentAdminId = user?.id ?? "";

  // 1. Fetch live administrative inquiries across ALL active statuses (filter removed)
  const { data: inquiries, isLoading, error, refetch } = useAdminInquiries({
    limit: 50,
  });

  return (
    <PageTransition>
      <div className="relative bg-[#0F0A06] min-h-screen font-sans text-white antialiased selection:bg-[#D4A97A]/30">
        
        <main className="pt-16 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
          
          {/* 1. EXECUTIVE HEADER BLOCK */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
            <Reveal>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[#A68056] uppercase text-[10px] font-black tracking-[0.2em]">
                  <ShieldCheck className="w-3.5 h-3.5" /> Operations Control Core
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase font-mono">
                  Production <span className="text-[#D4A97A] font-light italic text-2xl lowercase font-sans">Pipeline</span>
                </h1>
                <p className="text-white/40 text-sm max-w-2xl leading-relaxed">
                  Review raw structural blueprint designs, compute item values, modify order tracking statuses, and respond to customers.
                </p>
              </div>
            </Reveal>

            {/* LIVE STREAM RECONNECT BUTTON */}
            {!isLoading && !error && inquiries && inquiries.length > 0 && (
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 self-start md:self-auto text-[10px] font-black uppercase tracking-widest text-[#D4A97A] hover:text-white bg-[#D4A97A]/5 hover:bg-[#D4A97A]/10 border border-[#D4A97A]/20 px-4 h-9 rounded-xl transition-all"
              >
                <RefreshCw className="w-3 h-3" /> Refresh Queue
              </button>
            )}
          </div>

          {/* 3. FETCH STATE ROUTING CANVASES */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[400px] gap-3 bg-white/[0.01] border border-white/5 rounded-3xl border-dashed">
              <Loader2 className="w-6 h-6 animate-spin text-[#D4A97A]" />
              <p className="text-xs font-mono tracking-widest text-white/40 uppercase">Mapping Administrative Channels...</p>
            </div>
          ) : error ? (
            <div className="p-8 bg-red-950/10 border border-red-900/20 rounded-3xl text-center max-w-xl mx-auto space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 text-red-400 mb-2">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-red-200">Pipeline Synchronization Broken</h3>
              <p className="text-xs text-red-400/80 font-mono max-w-md mx-auto leading-relaxed bg-black/40 p-3 rounded-xl border border-red-900/30">
                {error instanceof Error ? error.message : "Error pulling database records for client custom requests."}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#D4A97A] hover:text-white bg-[#D4A97A]/5 hover:bg-[#D4A97A]/10 border border-[#D4A97A]/20 px-4 py-2 rounded-lg transition-all"
              >
                <RefreshCw className="w-3 h-3" /> Reconnect Live Stream
              </button>
            </div>
          ) : !inquiries || inquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-gradient-to-b from-white/[0.02] to-transparent border border-white/5 rounded-3xl border-dashed h-[350px] text-center">
              <div className="bg-white/5 p-4 rounded-full text-white/30 mb-4 border border-white/10">
                <Eye className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white/80">No Inquiries Found</h3>
              <p className="text-xs text-white/40 mt-1.5 max-w-xs leading-relaxed">
                There are currently no active client-submitted layout configurations in the pipeline.
              </p>
            </div>
          ) : (
            
            /* 4. RESPONSIVE OPTIMIZED COMPONENT DISPLAY GRID */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
              {inquiries.map((inquiry) => {
                const activeChatRow = inquiry.conversations && inquiry.conversations.length > 0 
                  ? inquiry.conversations[0] 
                  : null;

                const conversationParam = activeChatRow ? {
                  id: activeChatRow.id,
                  admin_unread_count: activeChatRow.admin_unread_count ?? 0,
                  customer_unread_count: activeChatRow.customer_unread_count ?? 0,
                } : null;

                return (
                  <AdminInquiryCard 
                    key={inquiry.id} 
                    inquiry={inquiry} 
                    conversation={conversationParam} 
                    adminId={currentAdminId}
                  />
                );
              })}
            </div>
          )}
        </main>
      </div>
    </PageTransition>
  );
}