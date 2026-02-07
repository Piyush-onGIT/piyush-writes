import type { NextConfig } from "next";

const nextConfig: NextConfig = process.env.NODE_ENV === "production" ? {
  output: "export",
  assetPrefix: '/piyush-writes',
  basePath: '/piyush-writes',
  images: {
    unoptimized: true,
  },
} :
{ }

export default nextConfig;
