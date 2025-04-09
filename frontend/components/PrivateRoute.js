"use client";

import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { showToast } from "@/lib/toast";
import { SubscriptionChecker } from "./SubscriptionToast";

export default function PrivateRoute({ children }) {
  const { firebaseUser, nextAuthSession, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !nextAuthSession) {
      showToast({
        title: "Authentication Required",
        description: "Please log in to access this page",
        variant: "destructive"
      });
      
      // Use window.location for a hard redirect
      window.location.href = "/login";
    }
  }, [isLoading, nextAuthSession, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner">Loading...</div>
      </div>
    );
  }

  if (nextAuthSession) {
    return (
      <>
        <SubscriptionChecker />
        {children}
      </>
    );
  }

  return null;
}