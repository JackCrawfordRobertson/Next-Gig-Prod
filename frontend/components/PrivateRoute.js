// components/PrivateRoute.js
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { showToast } from "@/lib/toast";

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
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner">Loading...</div>
      </div>
    );
  }

  if (status === "authenticated") {
    return children;
  }

  return null;
}