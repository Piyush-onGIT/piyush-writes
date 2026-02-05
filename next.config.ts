import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/blog",
  images: {
    unoptimized: true,
  },
  /* config options here */
};

export default nextConfig;