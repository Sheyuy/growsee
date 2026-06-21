import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const repoName = "growsee";

// Expose basePath to client-side code (fetch calls etc.)
if (isProd) {
  process.env.NEXT_PUBLIC_BASE_PATH = `/${repoName}`;
}

const nextConfig: NextConfig = {
  output: "export",
  distDir: "dist",
  images: {
    unoptimized: true,
  },
  // GitHub Pages serves under /repo-name/, so we need basePath in production.
  // Local dev stays at root (basePath=undefined).
  ...(isProd
    ? {
        basePath: `/${repoName}`,
        assetPrefix: `/${repoName}/`,
      }
    : {}),
  // RFC1918 LAN ranges + localhost for `next dev` HMR over Wi-Fi.
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.*.*",
    "10.*.*.*",
    "172.16.*.*",
    "172.17.*.*",
    "172.18.*.*",
    "172.19.*.*",
    "172.20.*.*",
    "172.21.*.*",
    "172.22.*.*",
    "172.23.*.*",
    "172.24.*.*",
    "172.25.*.*",
    "172.26.*.*",
    "172.27.*.*",
    "172.28.*.*",
    "172.29.*.*",
    "172.30.*.*",
    "172.31.*.*",
  ],
};

export default nextConfig;
