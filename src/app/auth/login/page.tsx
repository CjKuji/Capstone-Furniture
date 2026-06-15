"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { authService } from "@/services/authService";
import { primeUserCache } from "@/hooks/useUser";
import { useRouter } from "next/navigation";

type FormData = {
  email: string;
  password: string;
};

export default function Login() {
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

    try {
      const { user } = await authService.signIn(data.email, data.password);

      if (!user) {
        setError("Invalid login credentials.");
        setLoading(false);
        return;
      }

      const profile = await authService.getProfile(user.id);

      if (!profile) {
        setError("User profile not found.");
        setLoading(false);
        return;
      }

      /* ─────────────────────────────────────────────────────────
         CRITICAL: prime the module-level cache BEFORE pushing
         to the new route.

         Pass the full `user` object (not just the ID) so that
         primeUserCache can write cachedAuthUser directly.
         The Navbar checks `authUser` (not `profile`) to decide
         whether to render the logged-in state, so both must be
         set before router.push().
      ───────────────────────────────────────────────────────── */
      await primeUserCache(user);

      if (profile.role === "admin" || profile.role === "super_admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err?.message || "Login failed. Please try again.");
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
            A premium immersive furniture experience — meticulously design, modify structural compositions,
            and observe 3D dimensional scale variants in real-time before staging execution.
          </p>

          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <span className="text-sm mt-0.5 text-[#D4A97A]">✧</span>
              <div>
                <h3 className="font-semibold text-white tracking-wide uppercase text-[11px] tracking-[0.12em] mb-1">
                  Customize Everything
                </h3>
                <p className="text-xs text-white/40 leading-relaxed">
                  Iterate across rare textures, physical dimensions, custom hardware components, and lacquer finishes.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <span className="text-sm mt-0.5 text-[#D4A97A]">✧</span>
              <div>
                <h3 className="font-semibold text-white tracking-wide uppercase text-[11px] tracking-[0.12em] mb-1">
                  Volumetric 3D Verification
                </h3>
                <p className="text-xs text-white/40 leading-relaxed">
                  Verify authentic depth metrics, spatial dynamic scaling, and environmental styling profiles.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <span className="text-sm mt-0.5 text-[#D4A97A]">✧</span>
              <div>
                <h3 className="font-semibold text-white tracking-wide uppercase text-[11px] tracking-[0.12em] mb-1">
                  Logistical Streams
                </h3>
                <p className="text-xs text-white/40 leading-relaxed">
                  Real-time pipeline transparency from initial workshop crafting directly to premium courier assembly.
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
            <div className="mb-4 sm:mb-5">
              <p className="text-[9px] font-black tracking-[0.22em] text-[#7A5C3A] uppercase mb-1">
                Gateway Verification
              </p>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Welcome back
              </h2>
              <p className="text-xs text-white/40 mt-0.5">
                Sign in to resume access to your configurations.
              </p>
            </div>

            {/* RESERVED CONTAINER FOR MAIN SYSTEM ERRORS */}
            <div className="min-h-[44px] mb-2 flex items-center">
              {error ? (
                <div className="w-full rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-2 text-xs text-red-400 flex gap-2 items-center">
                  <span className="shrink-0 text-sm">⚠️</span>
                  <p className="truncate">{error}</p>
                </div>
              ) : (
                <div className="w-full h-[40px] border border-transparent" />
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-y-3">
              {/* EMAIL FIELD */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                  Email Address
                </label>
                <input
                  type="email"
                  {...register("email", {
                    required: "Email is required."
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
                      required: "Password is required."
                    })}
                    placeholder="Enter account access code"
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
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>

          <p className="mt-4 text-center text-xs text-white/40">
            Don't have an account?{" "}
            <span
              onClick={() => router.push("/auth/register")}
              className="cursor-pointer font-bold text-[#D4A97A] hover:text-[#E5BC8E] underline underline-offset-4 transition"
            >
              Create one
            </span>
          </p>
        </div>
      </div>

    </div>
  );
}