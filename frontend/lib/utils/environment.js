// lib/environment.js
export function isDevelopmentMode() {
  // Check for manual environment override via localStorage
  if (typeof window !== 'undefined') {
    // Get environment override from localStorage
    const envOverride = localStorage.getItem('env_override');
    
    // If there's a valid override, use it
    if (envOverride === 'production' || envOverride === 'development') {
      return envOverride === 'development';
    }
    
    // Otherwise use hostname detection for production domains
    const hostname = window.location.hostname;
    if (hostname.includes('next-gig.co.uk') || 
        hostname.includes('jack-robertson.co.uk')) {
      return false;
    }
  }
  
  // Default to Node environment
  return process.env.NODE_ENV === "development";
}