"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Layers,
  HelpCircle,
  ArrowRight,
  X,
  Undo2,
  ChevronLeft,
  ChevronRight,
  Info,
  ShoppingBag,
  Compass
} from "lucide-react";

export default function TutorialWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activePipeline, setActivePipeline] = useState<"order" | "inquiry" | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);

  // Standard Order Process Steps
  const orderSteps = [
    {
      title: "1. Choose & Customize Your Design",
      desc: "Look through our catalog to pick a base furniture design. You can change the wood types, view the item in 3D, or use AR to see how it fits in your physical space.",
    },
    {
      title: "2. Set Delivery, Description & Images",
      desc: "Choose to order the base design or add custom finishes. Write a description and upload reference images for your order. For pickup, add your phone number. For home delivery, include your phone number and address.",
    },
    {
      title: "3. Admin Review & Live Chat Setup",
      desc: "Our team reviews your order requests. The admin will either accept or reject it, then add any extra charges. If you have questions, you can message our team through our chat system, where you and the builders can see your original description and reference images.",
    },
    {
      title: "4. Accept Charges & Make First Payment",
      desc: "Check the final costs. If you agree, you can pay a 50% deposit or pay the full amount upfront. As soon as you pay, our team starts building your furniture.",
    },
    {
      title: "5. Production Status & Final Delivery",
      desc: "Watch your item get built step-by-step. If you paid a 50% deposit, you must pay the remaining 50% balance before we release your item. If you paid in full upfront, your item is sent or ready for pickup immediately.",
    },
  ];

  // Custom Blueprint Inquiry Steps
  const inquirySteps = [
    {
      title: "1. Send a Custom Blueprint",
      desc: "If you need unique dimensions or rare types of wood that aren't on our standard list, you can submit a custom inquiry form directly.",
    },
    {
      title: "2. Fill Out the Custom Form",
      desc: "Type in your exact measurements, upload your drawings, specify weight limits, and choose your hardware to open a custom build ticket.",
    },
    {
      title: "3. Chat & Adjust Charges on the Inquiry",
      desc: "Your ticket opens a live workspace conversation. Chat directly with our master craftsmen to finalize details. The admin calculates your custom pricing and adds line-item charges directly onto this inquiry.",
    },
    {
      title: "4. Accept Charges & Convert to Order",
      desc: "Review your custom pricing breakdown. Once you hit 'Accept Charges', your inquiry instantly transforms into an official furniture order! The system copies over your requirements, updates the chat room context, and initiates the payment cycle.",
    },
    {
      title: "5. Down-Payment & Workshop Queue",
      desc: "Settle either a 50% down-payment or 100% full payment upfront to push your custom blueprint onto the workshop production floor. You can track completion progress and settle milestones directly from your dashboard.",
    },
  ];

  const currentSteps = activePipeline === "order" ? orderSteps : inquirySteps;

  const handleNext = () => {
    if (activeStep < currentSteps.length - 1) {
      setActiveStep((prev) => prev + 1);
    } else {
      closeWidget();
    }
  };

  const handlePrev = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };

  const startPipeline = (type: "order" | "inquiry") => {
    setActivePipeline(type);
    setActiveStep(0);
  };

  const closeWidget = () => {
    setIsOpen(false);
    setActivePipeline(null);
    setActiveStep(0);
  };

  return (
    <>
      {/* FLOATING ACTION TRIGGER */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 bg-[#D4A97A] hover:bg-[#C49A6C] shadow-[0_8px_24px_rgba(212,169,122,0.2)] px-4 py-2.5 rounded-full font-bold text-[#0E0A06] text-xs uppercase tracking-wider transition-all duration-200 active:scale-95 group"
      >
        <HelpCircle className="w-4 h-4 text-[#0E0A06]" />
        <span>Interactive Guide</span>
      </button>

      {/* FLYOUT MODAL WINDOW */}
      {isOpen && (
        <div className="fixed inset-x-4 bottom-24 sm:left-auto sm:right-6 z-50 flex flex-col border border-[#362719] bg-gradient-to-b from-[#120D08] to-[#0A0704] shadow-[0_12px_40px_rgba(0,0,0,0.7)] p-4 sm:p-5 rounded-xl w-auto sm:w-[440px] max-h-[82vh] text-white overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          
          {/* HEADER CONTROLS */}
          <div className="flex justify-between items-center pb-3 border-[#21180F] border-b">
            <div className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-[#D4A97A]" />
              <span className="font-mono font-bold text-[10px] text-[#A68056] uppercase tracking-wider">
                Onboarding Simulator
              </span>
            </div>
            <button 
              onClick={closeWidget} 
              className="text-white/40 hover:text-white transition-colors"
              aria-label="Close guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-0.5">
            {activePipeline === null ? (
              /* MATRIX PATHWAY SELECTOR */
              <div className="space-y-3 mt-3.5">
                <p className="text-white/50 text-xs leading-relaxed font-medium">
                  Select a tailored pipeline pathway below to discover exactly how blueprint milestones and workshop production builds step forward.
                </p>
                
                {/* Pathway A */}
                <div className="bg-white/[0.01] hover:bg-white/[0.03] p-3.5 border border-[#21180F] hover:border-[#D4A97A]/30 rounded-lg transition-all duration-200 group">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Layers className="w-4 h-4 text-[#D4A97A] shrink-0" />
                    <h4 className="font-bold text-sm text-white group-hover:text-[#D4A97A] transition-colors">
                      Standard Order Process
                    </h4>
                  </div>
                  <p className="text-white/40 text-[11px] leading-relaxed">
                    Learn how to choose catalog designs, configure localized delivery specs, attach reference files, verify line-item adjustments, and converse with creators.
                  </p>
                  <button
                    onClick={() => startPipeline("order")}
                    className="flex items-center justify-center gap-1.5 bg-[#D4A97A] hover:bg-[#C49A6C] mt-3 py-1.5 rounded-md font-bold text-[#0E0A06] text-xs transition w-full"
                  >
                    <span>Launch Order Guide</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Pathway B */}
                <div className="bg-gradient-to-br from-[#1C140C] to-transparent p-3.5 border border-[#362719] hover:border-[#D4A97A]/30 rounded-lg transition-all duration-200 group">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Info className="w-4 h-4 text-[#D4A97A] shrink-0" />
                    <h4 className="font-bold text-sm text-white group-hover:text-[#D4A97A] transition-colors">
                      Custom Blueprint Inquiries
                    </h4>
                  </div>
                  <p className="text-white/40 text-[11px] leading-relaxed">
                    Have unique industrial ideas or architectural dimensions? Discover how to upload technical blueprints, adjust custom statements, and trigger direct active order conversion.
                  </p>
                  <button
                    onClick={() => startPipeline("inquiry")}
                    className="flex items-center justify-center gap-1.5 bg-white/[0.02] hover:bg-white/[0.06] border border-[#291E13] hover:border-[#362719] mt-3 py-1.5 rounded-md font-bold text-[#D4A97A] text-xs transition-all w-full"
                  >
                    <span>Explore Blueprint Inquiries</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* TRACK TRACKER QUICK INFO FOOTNOTE */}
                <div className="flex items-start gap-3 bg-[#050402] border border-[#21180F] p-3 rounded-lg">
                  <div className="p-2 bg-[#D4A97A]/5 border border-[#D4A97A]/10 rounded-md text-[#D4A97A] shrink-0">
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-[11px] text-white/90 uppercase font-mono tracking-wide">Track Active Projects</h5>
                    <p className="mt-0.5 text-white/40 text-[11px] leading-relaxed">
                      You can manage your file uploads, execute milestone balances, and open real-time workshop discussions by utilizing your dashboard matrix views.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* LIVE PIPELINE ACTIVE VIEWPORT */
              <div className="mt-3.5">
                <div className="flex justify-between items-center mb-3">
                  <span className="bg-[#D4A97A]/10 border border-[#D4A97A]/20 px-2 py-0.5 rounded text-[#D4A97A] font-mono text-[9px] font-bold uppercase tracking-wider">
                    Stage {activeStep + 1} of {currentSteps.length}
                  </span>
                  <button
                    onClick={() => { setActivePipeline(null); setActiveStep(0); }}
                    className="flex items-center gap-1 text-white/30 hover:text-white/60 font-mono text-[10px] font-bold uppercase tracking-wide transition-colors"
                  >
                    <Undo2 className="w-3 h-3" /> Reset
                  </button>
                </div>

                {/* STEPPER METRIC PROGRESS BAR BAR LINK */}
                <div className="flex items-center gap-1.5 mb-4 px-0.5">
                  {currentSteps.map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveStep(idx)}
                      className={`h-1 rounded-full transition-all duration-300 flex-1 relative ${
                        idx === activeStep 
                          ? "bg-[#D4A97A] shadow-[0_0_6px_#D4A97A]" 
                          : idx < activeStep 
                          ? "bg-[#D4A97A]/30" 
                          : "bg-white/5"
                      }`}
                      title={`Jump to Step ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* STATIC DISPLACEMENT BOX - LOCKS COMPACT VISUAL DIMENSIONS */}
                <div className="bg-[#050402] border border-[#21180F] rounded-lg p-3.5 min-h-[144px] flex flex-col justify-start">
                  <h4 className="font-bold text-white/90 text-sm tracking-tight">
                    {currentSteps[activeStep]?.title}
                  </h4>
                  <p className="mt-2 text-white/60 text-xs leading-relaxed font-medium">
                    {currentSteps[activeStep]?.desc}
                  </p>
                </div>

                {/* BOTTOM DUAL-DIRECTION NAVIGATION CONTROL PANEL */}
                <div className="flex items-center justify-between gap-2.5 mt-4 pt-3 border-[#21180F] border-t">
                  <button
                    onClick={handlePrev}
                    disabled={activeStep === 0}
                    className={`flex items-center justify-center gap-1 h-8 px-3 rounded-md font-bold text-xs transition-all ${
                      activeStep === 0 
                        ? "opacity-20 cursor-not-allowed text-white/40 border border-transparent" 
                        : "border border-[#291E13] bg-white/[0.01] text-white/70 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>

                  <button
                    onClick={handleNext}
                    className="flex items-center justify-center gap-1 bg-[#D4A97A] hover:bg-[#C49A6C] h-8 px-4 rounded-md font-bold text-[#0E0A06] text-xs transition-all shadow-md"
                  >
                    <span>
                      {activeStep === currentSteps.length - 1 ? "Complete Guide" : "Next Stage"}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}