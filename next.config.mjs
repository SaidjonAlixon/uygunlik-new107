/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Disable Turbopack completely to fix CSS parsing issues
  experimental: {
    turbo: false,
  },
  // Use webpack instead of Turbopack
  webpack: (config, { isServer }) => {
    return config;
  },
}

export default nextConfig
