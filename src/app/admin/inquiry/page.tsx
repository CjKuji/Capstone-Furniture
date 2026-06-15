"use client";

import React, { useState, useMemo } from "react";
import { Loader2, AlertTriangle, RefreshCw, ShieldCheck, Eye } from "lucide-react";
import Navbar from "@/app/components/Navbar"; 
import PageTransition from "@/app/components/PageTransition";
import Reveal from "@/app/components/Reveal";
import AdminInquiryCard from "@/app/components/AdminInquiryCard"; 
import { useAdminInquiries } from "@/hooks/useAdminInquiry";
import { useUser } from "@/hooks/useUser"; // Imported your custom pub/sub user auth hook
import { CustomInquiryStatus } from "@/types/inquiry";

export default function AdminInquiriesPage() {
  const [statusFilter, setStatusFilter] = useState<CustomInquiryStatus | "all">("all");
  
  /**
   * REFINED: Dynamically extract the live database profile context.
   * This completely avoids hardcoded placeholders and secures your RLS / tracking audits
   * using a structurally valid UUID directly from your session store.
   */
  const { user } = useUser();
  const currentAdminId = user?.id ?? "";

  // 1. Fetch live administrative inquiries via your isolated backend hook
  const { data: inquiries, isLoading, error, refetch } = useAdminInquiries({
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 50,
  });

  // 2. Synthesize pipeline summary metrics across the current snapshot data array
  const totalNewRequests = useMemo(() => inquiries?.filter(i => i.status === "requested").length || 0, [inquiries]);
  const totalUnderReview = useMemo(() => inquiries?.filter(i => i.status === "under_review").length || 0, [inquiries]);
  const totalActionRequired = useMemo(() => inquiries?.filter(i => i.status === "awaiting_payment" || i.status === "verifying_payment").length || 0, [inquiries]);

  return (
    <PageTransition>
      <div className="relative bg-[#0F0A06] min-h-screen font-sans text-white antialiased selection:bg-[#D4A97A]/30">
        
        {/* TOP COMPONENT STICKY BAR */}
        <div className="fixed top-0 left-0 w-full z-50">
          <Navbar />
        </div>

        <main className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
          
          {/* 1. EXECUTIVE HEADER BLOCK */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
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

            {/* QUICK CORNER PIPELINE FILTER SELECT DROP */}
            <div className="flex items-center gap-2 bg-[#140F0A] border border-white/10 px-4 py-2.5 rounded-full shadow-lg max-w-xs w-full sm:w-fit">
              <span className="text-[10px] font-black tracking-wider text-white/40 uppercase pl-1 shrink-0">Filter:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as CustomInquiryStatus | "all")}
                className="bg-transparent text-xs font-bold text-[#E8C98A] uppercase tracking-wide focus:outline-none cursor-pointer w-full pr-4"
              >
                <option value="all" className="bg-[#140F0A] text-white">All Active Pipelines</option>
                <option value="requested" className="bg-[#140F0A] text-white">New Requests</option>
                <option value="under_review" className="bg-[#140F0A] text-white">Under Review</option>
                <option value="awaiting_payment" className="bg-[#140F0A] text-white">Awaiting Payment</option>
                
                <option value="in_production" className="bg-[#140F0A] text-white">In Production</option>
                <option value="completed" className="bg-[#140F0A] text-white">Completed</option>
                <option value="cancelled" className="bg-[#140F0A] text-white">Cancelled</option>
              </select>
            </div>
          </div>

          {/* 2. DYNAMIC WORKSPACE METRIC GRID CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl shadow-sm transition-all">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Total Active Queue</span>
              <p className="text-3xl font-bold font-mono mt-2 text-white">{isLoading ? "..." : inquiries?.length || 0}</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 border-l-2 border-l-sky-500 p-5 rounded-2xl shadow-sm transition-all">
              <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400">New Submissions</span>
              <p className="text-3xl font-bold font-mono mt-2 text-sky-400">{isLoading ? "..." : totalNewRequests}</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 border-l-2 border-l-amber-500 p-5 rounded-2xl shadow-sm transition-all">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Under Review</span>
              <p className="text-3xl font-bold font-mono mt-2 text-amber-400">{isLoading ? "..." : totalUnderReview}</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 border-l-2 border-l-indigo-500 p-5 rounded-2xl shadow-sm transition-all">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Action Required</span>
              <p className="text-3xl font-bold font-mono mt-2 text-indigo-400">{isLoading ? "..." : totalActionRequired}</p>
            </div>
          </div>

          {/* 3. FETCH STATE ROUTING CANVASES */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[350px] gap-3 bg-white/[0.01] border border-white/5 rounded-3xl border-dashed">
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
                There are no client-submitted layout configurations matching your current status filter.
              </p>
            </div>
          ) : (
            
            /* 4. RESPONSIVE COMPONENT DISPLAY LAYOUT GRID */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
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