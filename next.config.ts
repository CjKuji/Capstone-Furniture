import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["havfynxlaoaieomuomzy.supabase.co"], // only hostname, no https://
  },
};

export default nextConfig;