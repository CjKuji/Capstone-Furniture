"use client";

import { useForm } from "react-hook-form";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type FormData = {
  email: string;
  password: string;
};

export default function Login() {
  const { register, handleSubmit } = useForm<FormData>();
  const router = useRouter();

  const onSubmit = async (data: FormData) => {
    const { error: signInError, data: signInData } =
      await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

    if (signInError) return alert(signInError.message);

    const userId = signInData.user?.id;
    if (!userId) return alert("User ID not found.");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError) return alert(profileError.message);

    if (profile.role === "admin") router.push("/admin");
    else router.push("/");
  };

  return (
    <div className="min-h-screen flex bg-[#FFF8F0]">

      {/* LEFT SIDE INTRODUCTION */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center px-20 bg-[#F3E6DA]">

        <h1 className="text-4xl font-bold text-black mb-6">
          FurniCraft
        </h1>

        <p className="text-black text-lg leading-relaxed mb-6 max-w-lg">
          Welcome to FurniCraft — a platform where you can explore
          beautifully designed furniture and customize it to match
          your personal style and living space.
        </p>

        <div className="space-y-4 text-black">

          <div>
            <h3 className="font-semibold text-lg">Customize Your Furniture</h3>
            <p className="text-sm">
              Choose materials, colors, and sizes to match your home perfectly.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg">3D Visualization</h3>
            <p className="text-sm">
              Preview furniture models in 3D before placing your order.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg">Track Your Orders</h3>
            <p className="text-sm">
              Monitor the progress of your furniture from production to pickup.
            </p>
          </div>

        </div>
      </div>

      {/* LOGIN FORM */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6">

        <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">

          <h2 className="text-2xl font-bold text-black mb-2">
            Login to your account
          </h2>

          <p className="text-black text-sm mb-6">
            Enter your credentials to continue.
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >

            {/* EMAIL */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-black">
                Email
              </label>
              <input
                type="email"
                {...register("email")}
                placeholder="Enter your email"
                className="border border-gray-300 rounded-lg px-3 py-2 text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-[#A16B4C]"
              />
            </div>

            {/* PASSWORD */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-black">
                Password
              </label>
              <input
                type="password"
                {...register("password")}
                placeholder="Enter your password"
                className="border border-gray-300 rounded-lg px-3 py-2 text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-[#A16B4C]"
              />
            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              className="mt-2 bg-[#A16B4C] text-white py-2 rounded-lg hover:bg-[#8C593F] transition font-semibold"
            >
              Login
            </button>

          </form>

          {/* REGISTER LINK */}
          <p className="text-sm text-black mt-6 text-center">
            No account?{" "}
            <span
              onClick={() => router.push("/auth/register")}
              className="text-[#A16B4C] font-semibold cursor-pointer hover:underline"
            >
              Register here
            </span>
          </p>

        </div>

      </div>
    </div>
  );
}