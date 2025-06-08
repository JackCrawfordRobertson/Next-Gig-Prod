// components/SessionVerifier.js
"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function SessionVerifier() {
  const { data: session } = useSession();
  
  useEffect(() => {
    if (session) {
      console.log("Current session verified:", {
        email: session.user.email,
        name: session.user.name,
        profilePicture: session.user.profilePicture, 
        time: new Date().toISOString()
      });
    }
  }, [session]);
  
  return null; // Invisible component
}