// components/PrivateRoute.js - Update existing file
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { showToast } from "@/lib/toast";
import { SubscriptionChecker } from "./SubscriptionToast";

export default function PrivateRoute({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      showToast({
        title: "Authentication Required",
        description: "Please log in to access this page",
        variant: "destructive"
      });
      
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (session) {
    return (
      <>
        <SubscriptionChecker />
        {children}
      </>
    );
  }

  return null;
}