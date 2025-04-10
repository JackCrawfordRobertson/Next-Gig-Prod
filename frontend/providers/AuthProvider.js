"use client";

import { useEffect, createContext, useContext, useState } from "react";
import { useSession } from "next-auth/react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

const AuthContext = createContext({
  firebaseUser: null,
  nextAuthSession: null,
  isLoading: true,
  signOutFromAll: async () => {},
});

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Track Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (status !== "loading") {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [status]);

  // Update loading state when NextAuth finishes
  useEffect(() => {
    if (status !== "loading") {
      setIsLoading(false);
    }
  }, [status]);

// Sync auth states
useEffect(() => {
  const syncAuthState = async () => {
    // If Firebase is logged in but NextAuth isn't
    if (firebaseUser && status === "unauthenticated" && !isLoading) {
      // Force logout from Firebase
      await auth.signOut();
      console.warn("Auth state inconsistency detected: Signed out of Firebase");
    }
    
    // If NextAuth is logged in but Firebase isn't
    if (!firebaseUser && status === "authenticated" && !isLoading) {
      console.warn("Auth state inconsistency detected: NextAuth session without Firebase");
      
      try {
        // Attempt to sign out from NextAuth to resolve the inconsistency
        await fetch('/api/auth/signout', { method: 'POST' });
        
        // Clear all cookies to ensure clean state
        document.cookie.split(";").forEach(c => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        
        // Redirect to login page with error message
        router.push('/login?error=session_expired');
      } catch (error) {
        console.error("Failed to resolve auth inconsistency:", error);
        
        // Fallback: force page reload to trigger new auth flow
        window.location.href = '/login?error=auth_error';
      }
    }
  };
  
  syncAuthState();
}, [firebaseUser, status, isLoading, router]);

  // Comprehensive sign out function
  const signOutFromAll = async () => {
    try {
      // Sign out from Firebase
      await auth.signOut();
      
      // Sign out from NextAuth 
      const response = await fetch('/api/auth/signout', {
        method: 'POST'
      });
      
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear cookies
      document.cookie.split(";").forEach(c => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Hard redirect to login page
      window.location.href = "/login?signedOut=true";
      
      return true;
    } catch (error) {
      console.error("Error signing out:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      firebaseUser, 
      nextAuthSession: session, 
      isLoading,
      signOutFromAll
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);