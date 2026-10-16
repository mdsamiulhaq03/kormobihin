import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components / partial prefetching are off on purpose: every page here is
  // per-user and session-driven, so classic dynamic rendering is simpler and clearer.
  cacheComponents: false,
  partialPrefetching: false,
  // Keep PDF parsing out of the bundle; it runs in the Node.js runtime only.
  serverExternalPackages: ["unpdf"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
