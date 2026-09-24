import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.postimg.cc",
      },
    ],
  },
  // Playwright-core loads browsers.json through a dynamically constructed
  // runtime path, which Next.js/Vercel output tracing does not reliably
  // discover. Explicitly include the asset for the report PDF server function.
  // (playwright-core is externalized by default in Next.js, so it is resolved
  // from node_modules at runtime and needs browsers.json present in the trace.)
  outputFileTracingIncludes: {
    "/api/report-pdf": ["./node_modules/playwright-core/browsers.json"],
  },
};

export default nextConfig;
