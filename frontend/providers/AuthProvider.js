// providers/AuthProvider.js - Replace existing file
"use client";

import { SessionProvider } from "next-auth/react";

export function AuthProvider({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}

// Simple hook to access session data
export function useAuth() {
  const { data: session, status } = useSession();
  
  return {
    user: session?.user,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated"
  };
}