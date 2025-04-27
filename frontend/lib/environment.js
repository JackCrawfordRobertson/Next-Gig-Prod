// lib/environment.js - Simplified environment detection
export function isDevelopmentMode() {
  // Always check for production domains first
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If on a production domain, always use production mode
    if (hostname.includes('next-gig.co.uk') || 
        hostname.includes('jack-robertson.co.uk')) {
      return false;
    }
  }
  
  // Otherwise, respect the Node environment
  return process.env.NODE_ENV === "development";
}