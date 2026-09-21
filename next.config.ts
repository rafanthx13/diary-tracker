import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/categories", destination: "/today/categories", permanent: true },
      { source: "/reports/:path*", destination: "/today/reports/:path*", permanent: true },
      { source: "/tasks/completed", destination: "/tasks/reports", permanent: true },
    ];
  },
};

export default nextConfig;
