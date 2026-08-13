"use client";

import { useRouter } from "next/navigation";
import { X, ShoppingCart } from "lucide-react";

type AuthRequiredModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  actionLabel?: string;
};

export default function AuthRequiredModal({
  open,
  onClose,
  title = "Login Required",
  description =
    "Please sign in to save blueprints, build out customized orders, and manage items in your cart.",
  actionLabel = "Sign In Now",
}: AuthRequiredModalProps) {
  const router = useRouter();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm p-6 text-center border bg-[#1C1209] border-white/10 rounded-2xl shadow-2xl animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#D4A97A]/10 border border-[#D4A97A]/20 text-[#D4A97A] mb-4">
          <ShoppingCart className="w-5 h-5" />
        </div>

        <h3 className="text-base font-bold text-white tracking-wide">{title}</h3>
        <p className="mt-2 text-xs text-white/50 leading-relaxed">{description}</p>

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={() => {
              onClose();
              router.push("/auth/login");
            }}
            className="w-full bg-[#D4A97A] hover:bg-[#C4976A] py-2.5 rounded-xl font-semibold text-[#1C1209] text-sm transition shadow-lg"
          >
            {actionLabel}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-white/10 font-medium text-white/60 hover:text-white hover:bg-white/5 text-sm transition"
          >
            Keep Browsing
          </button>
        </div>
      </div>
    </div>
  );
}
