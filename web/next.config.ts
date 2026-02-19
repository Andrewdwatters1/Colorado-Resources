import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the API route to read the data CSV from the parent directory
  serverExternalPackages: [],
  experimental: {},
};

export default nextConfig;
