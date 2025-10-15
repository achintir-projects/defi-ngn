import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Allow cross-origin requests from preview interface
  allowedDevOrigins: [
    'http://localhost:3000',
    'https://preview-chat-*.space.z.ai',
  ],
};

export default nextConfig;