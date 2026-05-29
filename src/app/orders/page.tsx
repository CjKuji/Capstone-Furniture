import { Suspense } from "react";
import CustomerOrdersPage from "./CustomerOrderPage";
import { Loader2 } from "lucide-react";

export default function Page() {
  return (
    <Suspense 
      fallback={
        <div className="bg-[#0F0A06] min-h-screen text-white flex flex-col justify-center items-center gap-4 px-4">
          <Loader2 className="w-8 h-8 text-[#D4A97A] animate-spin" />
          <p className="text-white/30 text-xs font-medium tracking-widest uppercase animate-pulse">
            Loading orders...
          </p>
        </div>
      }
    >
      <CustomerOrdersPage />
    </Suspense>
  );
}