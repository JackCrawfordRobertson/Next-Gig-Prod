/** @type {import('next').NextConfig} */
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
    
    // Optional: These settings can help with SSR performance and compatibility
    swcMinify: true,
    
    // Optional: If you're using images
    images: {
      domains: [
        // Add domains you'll load images from here
      ],
      // Don't set 'unoptimized: true' for SSR builds
    }
  };
  
  // Use CommonJS export syntax for maximum compatibility with build systems
  module.exports = nextConfig;