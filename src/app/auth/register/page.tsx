"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";

type FormData = {
  email: string;
  password: string;
  firstName: string;
  middleInitial: string;
  lastName: string;
};

export default function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    mode: "onTouched"
  });
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);

    // Format names to ensure correct capitalization before saving
    const formattedFirstName = data.firstName.trim()
      ? data.firstName.trim().charAt(0).toUpperCase() + data.firstName.trim().slice(1)
      : "";
      
    const formattedLastName = data.lastName.trim()
      ? data.lastName.trim().charAt(0).toUpperCase() + data.lastName.trim().slice(1)
      : "";

    const formattedMiddleInitial = data.middleInitial.trim()
      ? data.middleInitial.trim().charAt(0).toUpperCase()
      : "";

    try {
      const { user } = await authService.signUp(
        data.email,
        data.password,
        formattedFirstName,
        formattedMiddleInitial,
        formattedLastName
      );

      if (!user) {
        setError("Account creation failed. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/auth/login");
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#060403] select-none">
      
      {/* ── LEFT BRANDING PANEL ── */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center px-24 bg-[#0B0704] border-r border-[#2A1F14] relative overflow-hidden h-full">
        <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-[#D4A97A]/20 to-transparent" />
        
        <div className="max-w-lg">
          <p className="text-[10px] font-black tracking-[0.3em] text-[#7A5C3A] uppercase mb-3">
            Architectural Studio
          </p>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-6">
            FurniCraft
          </h1>

          <p className="text-white/60 text-sm leading-relaxed mb-12">
            Create your account and start designing furniture tailored to your space. 
            Customize structural properties, preview layouts in 3D, and place premium orders with complete confidence.
          </p>

          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <span className="text-sm mt-0.5 text-[#D4A97A]">✧</span>
              <div>
                <h3 className="font-semibold text-white tracking-wide uppercase text-[11px] tracking-[0.12em] mb-1">
                  Custom Furniture Design
                </h3>
                <p className="text-xs text-white/40 leading-relaxed">
                  Modify premium materials, exact size specs, and architectural finishes instantly.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <span className="text-sm mt-0.5 text-[#D4A97A]">✧</span>
              <div>
                <h3 className="font-semibold text-white tracking-wide uppercase text-[11px] tracking-[0.12em] mb-1">
                  Real-Scale 3D Preview
                </h3>
                <p className="text-xs text-white/40 leading-relaxed">
                  Accurately visualize volume, shadow placement, and dynamic finishes before crafting.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <span className="text-sm mt-0.5 text-[#D4A97A]">✧</span>
              <div>
                <h3 className="font-semibold text-white tracking-wide uppercase text-[11px] tracking-[0.12em] mb-1">
                  Production Tracking
                </h3>
                <p className="text-xs text-white/40 leading-relaxed">
                  Monitor raw material processing and fabrication updates in true continuous time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT ENTRY FORM SIDE ── */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-4 sm:px-6 h-full">
        <div className="w-full max-w-md bg-[#0E0A06] border border-[#2A1F14] rounded-2xl p-6 sm:p-8 shadow-[0_24px_64px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col justify-between max-h-[95vh]">
          <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[#D4A97A]/40 to-transparent" />

          <div>
            <div className="mb-3 sm:mb-4">
              <p className="text-[9px] font-black tracking-[0.22em] text-[#7A5C3A] uppercase mb-1">
                Onboarding Portal
              </p>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Create your account
              </h2>
              <p className="text-xs text-white/40 mt-0.5">
                Join the ecosystem to begin spatial customizations.
              </p>
            </div>

            {/* RESERVED CONTAINER FOR MAIN SYSTEM ERRORS */}
            <div className="min-h-[44px] mb-1 flex items-center">
              {error ? (
                <div className="w-full rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-2 text-xs text-red-400 flex gap-2 items-center">
                  <span className="shrink-0 text-sm">⚠️</span>
                  <p className="truncate">{error}</p>
                </div>
              ) : (
                <div className="w-full h-[40px] border border-transparent" />
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-y-2">
              
              {/* THREE-COLUMN NAME FIELDS ROW */}
              <div className="flex gap-x-3">
                {/* FIRST NAME */}
                <div className="flex-1 space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                    First Name
                  </label>
                  <input
                    type="text"
                    {...register("firstName", { 
                      required: "Required.",
                      validate: {
                        startsWithLetter: (v) => /^[A-Za-z]/.test(v) || "Must start with a letter.",
                        noNumbers: (v) => /^([^0-9]*)$/.test(v) || "No numbers allowed."
                      }
                    })}
                    placeholder="John"
                    className={`
                      w-full rounded-xl border px-3 py-2.5 text-xs sm:text-sm text-white capitalize
                      outline-none transition placeholder:text-white/20 bg-[#060403]
                      ${errors.firstName ? 'border-red-900/50 focus:border-red-500/40 focus:ring-1 focus:ring-red-500/10' : 'border-[#2A1F14] focus:border-[#D4A97A]/40 focus:ring-2 focus:ring-[#D4A97A]/10'}
                    `}
                  />
                  <div className="min-h-[16px] flex items-center">
                    {errors.firstName && (
                      <p className="text-[10px] text-red-400 tracking-wide pl-1">✕ {errors.firstName.message}</p>
                    )}
                  </div>
                </div>

                {/* MIDDLE INITIAL */}
                <div className="w-16 space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-white/40 text-center">
                    M.I.
                  </label>
                  <input
                    type="text"
                    maxLength={1}
                    {...register("middleInitial", {
                      validate: {
                        singleLetter: (v) => !v || /^[A-Za-z]$/.test(v) || "A-Z only."
                      }
                    })}
                    placeholder="E"
                    className={`
                      w-full rounded-xl border text-center py-2.5 text-xs sm:text-sm text-white uppercase
                      outline-none transition placeholder:text-white/20 bg-[#060403]
                      ${errors.middleInitial ? 'border-red-900/50 focus:border-red-500/40 focus:ring-1 focus:ring-red-500/10' : 'border-[#2A1F14] focus:border-[#D4A97A]/40 focus:ring-2 focus:ring-[#D4A97A]/10'}
                    `}
                  />
                  <div className="min-h-[16px] flex items-center justify-center">
                    {errors.middleInitial && (
                      <p className="text-[9px] text-red-400 tracking-wide">✕ Error</p>
                    )}
                  </div>
                </div>

                {/* LAST NAME */}
                <div className="flex-1 space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                    Last Name
                  </label>
                  <input
                    type="text"
                    {...register("lastName", { 
                      required: "Required.",
                      validate: {
                        startsWithLetter: (v) => /^[A-Za-z]/.test(v) || "Must start with a letter.",
                        noNumbers: (v) => /^([^0-9]*)$/.test(v) || "No numbers allowed."
                      }
                    })}
                    placeholder="Doe"
                    className={`
                      w-full rounded-xl border px-3 py-2.5 text-xs sm:text-sm text-white capitalize
                      outline-none transition placeholder:text-white/20 bg-[#060403]
                      ${errors.lastName ? 'border-red-900/50 focus:border-red-500/40 focus:ring-1 focus:ring-red-500/10' : 'border-[#2A1F14] focus:border-[#D4A97A]/40 focus:ring-2 focus:ring-[#D4A97A]/10'}
                    `}
                  />
                  <div className="min-h-[16px] flex items-center">
                    {errors.lastName && (
                      <p className="text-[10px] text-red-400 tracking-wide pl-1">✕ {errors.lastName.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* EMAIL FIELD */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                  Email Address
                </label>
                <input
                  type="email"
                  {...register("email", { 
                    required: "Email is required.",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email format."
                    }
                  })}
                  placeholder="you@example.com"
                  className={`
                    w-full rounded-xl border px-4 py-2.5 text-xs sm:text-sm text-white
                    outline-none transition placeholder:text-white/20 bg-[#060403]
                    ${errors.email ? 'border-red-900/50 focus:border-red-500/40 focus:ring-1 focus:ring-red-500/10' : 'border-[#2A1F14] focus:border-[#D4A97A]/40 focus:ring-2 focus:ring-[#D4A97A]/10'}
                  `}
                />
                <div className="min-h-[16px] flex items-center">
                  {errors.email && (
                    <p className="text-[10px] text-red-400 tracking-wide pl-1">✕ {errors.email.message}</p>
                  )}
                </div>
              </div>

              {/* PASSWORD FIELD */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                  Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password", { 
                      required: "Password is required.",
                      minLength: {
                        value: 8,
                        message: "Must be at least 8 characters."
                      },
                      pattern: {
                        value: /(?=.*[!@#$%^&*(),.?":{}|<>])/,
                        message: "Requires 1 special character."
                      }
                    })}
                    placeholder="Initialize high-security protection"
                    className={`
                      w-full rounded-xl border pl-4 pr-11 py-2.5 text-xs sm:text-sm text-white
                      outline-none transition placeholder:text-white/20 bg-[#060403]
                      ${errors.password ? 'border-red-900/50 focus:border-red-500/40 focus:ring-1 focus:ring-red-500/10' : 'border-[#2A1F14] focus:border-[#D4A97A]/40 focus:ring-2 focus:ring-[#D4A97A]/10'}
                    `}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 p-1 rounded text-white/40 hover:text-white/70 transition text-[11px] font-black tracking-wider uppercase select-none focus:outline-none"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="min-h-[16px] flex items-center">
                  {errors.password && (
                    <p className="text-[10px] text-red-400 tracking-wide pl-1">✕ {errors.password.message}</p>
                  )}
                </div>
              </div>

              {/* SUBMIT CTA */}
              <button
                type="submit"
                disabled={loading}
                className="
                  w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition mt-1
                  bg-[#D4A97A] text-[#060403] hover:bg-[#E5BC8E] active:scale-[0.99] disabled:opacity-40
                "
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          </div>

          <p className="mt-4 text-center text-xs text-white/40">
            Already registered?{" "}
            <span
              onClick={() => router.push("/auth/login")}
              className="cursor-pointer font-bold text-[#D4A97A] hover:text-[#E5BC8E] underline underline-offset-4 transition"
            >
              Sign in
            </span>
          </p>
        </div>
      </div>

    </div>
  );
}