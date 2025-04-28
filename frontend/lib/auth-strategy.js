// lib/auth-strategy.js
import { isDevelopmentMode } from "./environment";

export function useNextAuthStrategy() {
  // Check if we're running on localhost
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  // Get development status from central function
  const isDev = isDevelopmentMode();
  
  // Log the decision for debugging
  console.log(`Auth strategy: ${isDev ? 'Development mode' : 'Production mode'}, Running on: ${isLocalhost ? 'localhost' : 'remote server'}`);
  
  // Skip NextAuth if in development mode OR if we're in production mode but on localhost
  return !isDev && !isLocalhost;
}