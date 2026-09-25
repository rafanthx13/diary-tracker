import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Importações de backup aceitam até 8 MB, mais a sobrecarga do multipart.
      bodySizeLimit: "9mb",
    },
  },
  async redirects() {
    return [
      { source: "/categories", destination: "/today/categories", permanent: true },
      { source: "/reports/:path*", destination: "/today/reports/:path*", permanent: true },
      { source: "/tasks/completed", destination: "/tasks/reports", permanent: true },
    ];
  },
};

export default nextConfig;
