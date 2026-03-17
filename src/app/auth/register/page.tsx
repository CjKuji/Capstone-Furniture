"use client";

import { useForm } from "react-hook-form";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type FormData = {
  email: string;
  password: string;
  name: string;
};

export default function Register() {
  const { register, handleSubmit } = useForm<FormData>();
  const router = useRouter();

  const onSubmit = async (data: FormData) => {
    const { data: signUpData, error: signUpError } =
      await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

    if (signUpError) return alert(signUpError.message);
    if (!signUpData.user) return alert("User creation failed.");

    const { error: profileError } = await supabase
      .from("profiles")
      .insert([
        {
          id: signUpData.user.id,
          full_name: data.name,
          role: "customer",
        },
      ]);

    if (profileError) return alert(profileError.message);

    alert("Registered successfully!");
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen flex bg-[#FFF8F0]">

      {/* LEFT SIDE INTRO */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center px-20 bg-[#F3E6DA]">

        <h1 className="text-4xl font-bold text-black mb-6">
          FurniCraft
        </h1>

        <p className="text-black text-lg leading-relaxed mb-6 max-w-lg">
          Create your account and start designing furniture tailored
          to your home. Customize materials, colors, and sizes while
          previewing them in 3D before placing your order.
        </p>

        <div className="space-y-4 text-black">

          <div>
            <h3 className="font-semibold text-lg">Personalized Designs</h3>
            <p className="text-sm">
              Customize furniture to match your style and living space.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg">3D Preview</h3>
            <p className="text-sm">
              View furniture models interactively before purchasing.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg">Order Tracking</h3>
            <p className="text-sm">
              Follow the progress of your orders from production to pickup.
            </p>
          </div>

        </div>
      </div>

      {/* REGISTER FORM */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6">

        <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">

          <h2 className="text-2xl font-bold text-black mb-2">
            Create an Account
          </h2>

          <p className="text-black text-sm mb-6">
            Register to start customizing your furniture.
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >

            {/* FULL NAME */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-black">
                Full Name
              </label>
              <input
                type="text"
                {...register("name")}
                placeholder="Enter your full name"
                className="border border-gray-300 rounded-lg px-3 py-2 text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-[#A16B4C]"
              />
            </div>

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
                placeholder="Create a password"
                className="border border-gray-300 rounded-lg px-3 py-2 text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-[#A16B4C]"
              />
            </div>

            {/* REGISTER BUTTON */}
            <button
              type="submit"
              className="mt-2 bg-[#A16B4C] text-white py-2 rounded-lg hover:bg-[#8C593F] transition font-semibold"
            >
              Register
            </button>

          </form>

          {/* LOGIN LINK */}
          <p className="text-sm text-black mt-6 text-center">
            Already have an account?{" "}
            <span
              onClick={() => router.push("/auth/login")}
              className="text-[#A16B4C] font-semibold cursor-pointer hover:underline"
            >
              Login here
            </span>
          </p>

        </div>

      </div>
    </div>
  );
}