// lib/environment.js
export function isDevelopmentMode() {
    // Start with Node environment
    let isDev = process.env.NODE_ENV === "development";
    
    // On client-side, check for production domains
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname.includes('next-gig.co.uk') || 
          hostname.includes('jack-robertson.co.uk') ||
          !(hostname === 'localhost' || hostname === '127.0.0.1')) {
        // Force production mode on production domains
        isDev = false;
      }
    }
    
    return isDev;
  }