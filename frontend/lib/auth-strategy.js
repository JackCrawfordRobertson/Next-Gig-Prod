import { isDevelopmentMode } from "./environment";

/**
 * Determines whether to use NextAuth based on environment
 * @returns {boolean} Whether to use NextAuth for authentication
 */
export function useNextAuthStrategy() {
  // Get development status from your central function
  const isDev = isDevelopmentMode();
  
  // Log the decision for debugging
  console.log(`Auth strategy: ${isDev ? 'Development mode' : 'Production mode'}`);
  
  // Use NextAuth in production, skip in development
  return !isDev;
}