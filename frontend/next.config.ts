import type { NextConfig } from "next";
import path from "path";

// In production (Vercel), set BACKEND_URL to your Render service URL
// e.g. https://salesmind-api.onrender.com
// In local dev, falls back to localhost:8000
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  // Silence workspace-root detection warning (multiple lockfiles in parent dirs)
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
