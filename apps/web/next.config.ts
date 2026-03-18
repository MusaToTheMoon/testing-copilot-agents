import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@essay-app/types", "@essay-app/workflow", "@essay-app/word-tools"],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
