import type { NextConfig } from "next";

// v1.3.1 - Force clean rebuild
const nextConfig: NextConfig = {
  output: "standalone",
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  reactStrictMode: false,
  
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@tanstack/react-table',
    ],
  },
  
  images: {
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 's-maxage=10, stale-while-revalidate=59' }
        ]
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ]
      }
    ]
  },
};

export default nextConfig;
