import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * =========================================================
   * REACT
   * =========================================================
   */

  reactStrictMode: true,

  /**
   * =========================================================
   * NGROK DEV ACCESS
   * ---------------------------------------------------------
   * Allows external ngrok URL access during development
   * Prevents blocked webpack-hmr requests
   * =========================================================
   */

  allowedDevOrigins: [
    "drivable-equipment-dart.ngrok-free.dev",
  ],

  /**
   * =========================================================
   * IMAGES
   * =========================================================
   */

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "havfynxlaoaieomuomzy.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;