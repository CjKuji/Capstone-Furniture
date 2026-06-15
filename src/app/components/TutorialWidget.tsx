"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Layers,
  HelpCircle,
  ArrowRight,
  X,
  Undo2,
  ChevronRight,
  Info,
  ShoppingBag
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

  // Custom Blueprint Inquiry Steps (Updated with full Conversion -> Order workflow)
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

  // Dynamically resolve the steps based on the active selection
  const currentSteps = activePipeline === "order" ? orderSteps : inquirySteps;

  const handleNext = () => {
    if (activeStep < currentSteps.length - 1) {
      setActiveStep((prev) => prev + 1);
    } else {
      setActivePipeline(null);
      setActiveStep(0);
      setIsOpen(false);
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
        className="bottom-6 left-6 fixed z-40 flex items-center gap-2 bg-[#D4A97A] hover:bg-[#C4976A] shadow-lg px-4 py-2.5 rounded-full font-bold text-[#1C1209] text-xs uppercase tracking-wider transition group"
      >
        <HelpCircle className="w-4 h-4" />
        <span>Interactive Guide</span>
      </button>

      {/* FLYOUT MODAL WINDOW */}
      {isOpen && (
        <div className="fixed inset-x-4 bottom-24 sm:left-auto sm:right-6 z-50 bg-[#160E07] border border-[#D4A97A]/40 shadow-2xl p-5 sm:p-6 rounded-2xl w-auto sm:w-[460px] max-h-[80vh] overflow-y-auto text-white animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Header Controls */}
          <div className="flex justify-between items-center pb-3 border-white/5 border-b">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#D4A97A]" />
              <span className="font-semibold text-xs uppercase tracking-wider">
                Onboarding Simulator
              </span>
            </div>
            <button 
              onClick={closeWidget} 
              className="text-white/40 hover:text-white transition"
              aria-label="Close guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {activePipeline === null ? (
            /* MATRIX PATHWAY SELECTOR */
            <div className="space-y-4 mt-4">
              <p className="text-white/50 text-xs leading-relaxed">
                Choose a guide below to see exactly how our orders and custom builds work step-by-step.
              </p>
              
              {/* Pathway A */}
              <div className="bg-white/[0.02] hover:bg-white/[0.04] p-4 border border-white/5 rounded-xl transition group">
                <div className="flex items-center gap-3 mb-2">
                  <Layers className="w-4 h-4 text-[#D4A97A]" />
                  <h4 className="font-bold text-sm text-white group-hover:text-[#D4A97A] transition">
                    Standard Order Process
                  </h4>
                </div>
                <p className="text-white/40 text-xs leading-relaxed">
                  Learn how to choose designs, set up delivery options, add reference files, review admin charges, and message builders directly.
                </p>
                <button
                  onClick={() => startPipeline("order")}
                  className="flex items-center justify-center gap-1.5 bg-[#D4A97A] hover:bg-[#C4976A] mt-3 px-3 py-1.5 rounded-lg font-bold text-[#1C1209] text-xs transition w-full"
                >
                  See How to Order
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Pathway B */}
              <div className="bg-gradient-to-br from-[#1C1209] to-transparent p-4 border border-[#D4A97A]/20 rounded-xl group">
                <div className="flex items-center gap-3 mb-2">
                  <HelpCircle className="w-4 h-4 text-[#D4A97A]" />
                  <h4 className="font-bold text-sm text-white group-hover:text-[#D4A97A] transition">
                    Custom Blueprint Inquiries
                  </h4>
                </div>
                <p className="text-white/40 text-xs leading-relaxed">
                  Have a specific structural plan or wood requests? Learn how to submit blueprints, receive custom craftsman adjustments, and convert it into a tracking order.
                </p>
                <button
                  onClick={() => startPipeline("inquiry")}
                  className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 mt-3 px-3 py-1.5 rounded-lg font-bold text-[#D4A97A] text-xs transition w-full"
                >
                  See How Custom Builds Work
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* VIEW / MANAGE ORDERS QUICK INFO BOX */}
              <div className="flex items-start gap-3 bg-white/[0.02] border border-white/5 p-3.5 rounded-xl">
                <div className="relative p-2 bg-[#D4A97A]/10 rounded-full text-[#D4A97A] shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-semibold text-xs text-white">Track Your Active Projects</h5>
                  <p className="mt-0.5 text-white/40 text-[11px] leading-relaxed">
                    You can view your uploads, pay balances, and chat with creators anytime by clicking the <strong className="text-[#D4A97A]">My Orders</strong> bag icon on your top navigation panel.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* LIVE PIPELINE ACTIVE VIEWPORT */
            <div className="mt-4">
              <div className="flex justify-between items-center mb-3">
                <span className="bg-[#D4A97A]/10 px-2 py-0.5 rounded text-[#D4A97A] text-[10px] font-bold uppercase tracking-wider">
                  Step {activeStep + 1} of {currentSteps.length}
                </span>
                <button
                  onClick={() => { setActivePipeline(null); setActiveStep(0); }}
                  className="flex items-center gap-1 text-white/40 hover:text-white text-[10px] transition"
                >
                  <Undo2 className="w-3 h-3" /> Back
                </button>
              </div>

              {/* Progress Indicators */}
              <div className="flex items-center gap-1.5 mb-4">
                {currentSteps.map((_, idx) => (
                  <div 
                    key={idx}
                    className={`h-1 rounded-full transition-all duration-300 flex-1 ${
                      idx === activeStep ? "bg-[#D4A97A]" : idx < activeStep ? "bg-[#D4A97A]/30" : "bg-white/5"
                    }`}
                  />
                ))}
              </div>

              {/* Active Step Content */}
              <div className="min-h-[120px]">
                <h4 className="font-bold text-white text-sm sm:text-base">
                  {currentSteps[activeStep]?.title}
                </h4>
                <p className="mt-2 text-white/70 text-xs sm:text-sm leading-relaxed">
                  {currentSteps[activeStep]?.desc}
                </p>
              </div>

              {/* Footer Control Panel */}
              <div className="flex justify-end items-center gap-3 mt-5 pt-3 border-white/5 border-t">
                <button
                  onClick={handleNext}
                  className="flex items-center justify-center gap-1 bg-[#D4A97A] hover:bg-[#C4976A] px-4 py-2 rounded-full font-bold text-[#1C1209] text-xs transition ml-auto"
                >
                  {activeStep === currentSteps.length - 1 ? "Finish Guide" : "Next Step"}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}