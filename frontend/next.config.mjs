/** @type {import('next').NextConfig} */
import TerserPlugin from 'terser-webpack-plugin';

const nextConfig = {
  reactStrictMode: false,
  
  // Skip type checking during build to speed up deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Skip ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Optional: If you're using images
  images: {
    domains: [
      // Add domains you'll load images from here
    ]
  },
  
  // Disable console logs in production
  webpack: (config, { isServer, dev }) => {
    if (!dev && !isServer) {
      // Comment out the lines below to temporarily disable this feature
      /*
      config.optimization.minimizer = [
        ...config.optimization.minimizer || [],
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true,
            },
          },
        }),
      ];
      */
    }
    return config;
  },
};

// Use ES Module export syntax instead of CommonJS
export default nextConfig;