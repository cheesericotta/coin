import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  reactCompiler: true,
  // @ts-ignore - allowedDevOrigins is required to resolve cross-origin warnings in some dev environments
  allowedDevOrigins: ["172.24.0.1"],
};

export default nextConfig;
