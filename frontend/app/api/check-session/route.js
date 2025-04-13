// frontend/app/api/auth/check-session/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
  try {
    // Get server-side session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ valid: false, reason: "No session found" }, { status: 401 });
    }
    
    // Check if session has a user ID
    if (!session.user?.id) {
      return NextResponse.json({ valid: false, reason: "Invalid session structure" }, { status: 401 });
    }
    
    // Check session age if timestamp is available
    if (session.authTimestamp) {
      const sessionAge = Date.now() - session.authTimestamp;
      const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      if (sessionAge > maxSessionAge) {
        return NextResponse.json({ 
          valid: false, 
          reason: "Session expired",
          age: sessionAge,
          maxAge: maxSessionAge
        }, { status: 401 });
      }
    }
    
    return NextResponse.json({ 
      valid: true,
      userId: session.user.id,
      email: session.user.email,
      authTimestamp: session.authTimestamp
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json({ 
      valid: false, 
      reason: "Error checking session",
      error: error.message
    }, { status: 500 });
  }
}