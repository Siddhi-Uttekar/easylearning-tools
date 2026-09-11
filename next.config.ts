import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lean, self-contained production build for the Docker image (see Dockerfile).
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "tools.easylearning.live",
        pathname: "/uploads/**",
      },
      {
        // Public-read SeaweedFS S3 bucket — PYQ diagrams + re-hosted question
        // bank images (see data/pyq/README.md), plus every flashcard image and
        // thumbnail under /pyq-images/uploads/ (see src/lib/s3.ts). No
        // credentials needed to fetch.
        protocol: "https",
        hostname: "s3-xzopnmtqzetpcjcdqpv0s3j8.shubhamjha.live",
        pathname: "/pyq-images/**",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
