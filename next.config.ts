import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel handles output automatically — no need for "standalone" here
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow Firebase Admin SDK to work in serverless functions
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
