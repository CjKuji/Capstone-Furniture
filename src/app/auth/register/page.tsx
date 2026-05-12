"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";

type FormData = {
  email: string;
  password: string;
  name: string;
};

export default function Register() {
  const { register, handleSubmit } = useForm<FormData>();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);

    try {
      const { user } = await authService.signUp(
        data.email,
        data.password,
        data.name
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
    <div className="min-h-screen flex bg-white">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center px-24 bg-[#F5E9DD]">

        <h1 className="text-4xl font-bold text-black mb-6">
          FurniCraft
        </h1>

        <p className="text-black text-lg leading-relaxed mb-8 max-w-lg">
          Create your account and start designing furniture tailored to your space.
          Customize, preview in 3D, and place orders with confidence.
        </p>

        <div className="space-y-6 text-black">

          <div>
            <h3 className="font-semibold text-lg">Custom Furniture Design</h3>
            <p className="text-base">
              Change materials, sizes, and finishes instantly.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg">3D Preview</h3>
            <p className="text-base">
              Visualize your furniture before ordering.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg">Order Tracking</h3>
            <p className="text-base">
              Follow production progress in real time.
            </p>
          </div>

        </div>
      </div>

      {/* FORM SIDE */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6">

        <div className="w-full max-w-md bg-white border border-black/10 rounded-2xl p-8 shadow-lg">

          <h2 className="text-2xl font-semibold text-black">
            Create your account
          </h2>

          <p className="text-black mt-1 mb-6">
            Join to start customizing furniture
          </p>

          {/* ERROR */}
          {error && (
            <div className="mb-4 rounded-xl border border-red-500 bg-red-50 px-3 py-2 text-sm text-black">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >

            {/* NAME */}
            <div>
              <label className="text-sm font-medium text-black">
                Full Name
              </label>

              <input
                type="text"
                {...register("name", { required: true })}
                placeholder="John Doe"
                className="mt-1 w-full rounded-xl border border-black/20 px-3 py-2 text-black focus:outline-none focus:border-black"
              />
            </div>

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
                placeholder="Create a strong password"
                className="mt-1 w-full rounded-xl border border-black/20 px-3 py-2 text-black focus:outline-none focus:border-black"
              />
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-black py-3 font-medium text-white disabled:opacity-40"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>

          </form>

          {/* LOGIN LINK */}
          <p className="mt-6 text-center text-black">
            Already have an account?{" "}
            <span
              onClick={() => router.push("/auth/login")}
              className="cursor-pointer font-semibold text-black underline"
            >
              Sign in
            </span>
          </p>

        </div>

      </div>
    </div>
  );
}