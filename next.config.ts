
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  outputFileTracingIncludes: {
    "/*": ["./prisma/dev.db"],
  },

  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
