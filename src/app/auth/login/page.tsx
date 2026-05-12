"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";

type FormData = {
  email: string;
  password: string;
};

export default function Login() {
  const { register, handleSubmit } = useForm<FormData>();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);

    try {
      const { user } = await authService.signIn(
        data.email,
        data.password
      );

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

      if (
        profile.role === "admin" ||
        profile.role === "super_admin"
      ) {
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
    <div className="min-h-screen flex bg-white">

      {/* LEFT SIDE */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center px-24 bg-[#F5E9DD]">

        <h1 className="text-4xl font-bold text-black mb-6">
          FurniCraft
        </h1>

        <p className="text-black text-lg leading-relaxed mb-8 max-w-lg">
          A modern furniture experience — design, customize, and preview your furniture in real-time before ordering.
        </p>

        <div className="space-y-6 text-black">

          <div>
            <h3 className="font-semibold text-lg">Customize Everything</h3>
            <p className="text-base">
              Change materials, sizes, finishes, and styles in seconds.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg">3D Preview</h3>
            <p className="text-base">
              See your furniture in real scale before you buy.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg">Order Tracking</h3>
            <p className="text-base">
              Follow your order from production to delivery or pickup.
            </p>
          </div>

        </div>
      </div>

      {/* FORM */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6">

        <div className="w-full max-w-md bg-white border border-black/10 rounded-2xl p-8 shadow-lg">

          <h2 className="text-2xl font-semibold text-black">
            Welcome back
          </h2>

          <p className="text-black mt-1 mb-6">
            Login to continue to your account
          </p>

          {/* ERROR */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-500 bg-red-50 px-3 py-2 text-sm text-black">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >

            {/* EMAIL */}
            <div>
              <label className="text-sm font-medium text-black">
                Email Address
              </label>

              <input
                type="email"
                {...register("email", { required: true })}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-xl border border-black/20 px-3 py-2 text-black focus:outline-none focus:border-black"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="text-sm font-medium text-black">
                Password
              </label>

              <input
                type="password"
                {...register("password", { required: true })}
                placeholder="Enter your password"
                className="mt-1 w-full rounded-xl border border-black/20 px-3 py-2 text-black focus:outline-none focus:border-black"
              />
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-black py-3 font-medium text-white disabled:opacity-40"
            >
              {loading ? "Signing in..." : "Login"}
            </button>

          </form>

          {/* REGISTER */}
          <p className="mt-6 text-center text-black">
            Don’t have an account?{" "}
            <span
              onClick={() => router.push("/auth/register")}
              className="cursor-pointer font-semibold text-black underline"
            >
              Create one
            </span>
          </p>

        </div>

      </div>
    </div>
  );
}