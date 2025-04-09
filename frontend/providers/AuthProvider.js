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

  // Sync auth states (optional feature)
  useEffect(() => {
    const syncAuthState = async () => {
      // Example logic: If Firebase is logged in but NextAuth isn't
      if (firebaseUser && status === "unauthenticated" && !isLoading) {
        // Force logout from Firebase or handle this inconsistency
        await auth.signOut();
        console.warn("Auth state inconsistency detected: Signed out of Firebase");
      }
      
      // Example logic: If NextAuth is logged in but Firebase isn't
      if (!firebaseUser && status === "authenticated" && !isLoading) {
        // This is more complex to handle and may require a re-login
        console.warn("Auth state inconsistency detected: NextAuth session without Firebase");
      }
    };
    
    syncAuthState();
  }, [firebaseUser, status, isLoading]);

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