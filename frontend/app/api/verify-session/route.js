// frontend/app/api/auth/verify-session/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
  try {
    // Get server-side session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ 
        valid: false, 
        reason: "No session found" 
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      valid: true,
      user: {
        id: session.user.id,
        email: session.user.email
      }
    });
  } catch (error) {
    console.error("Session verification error:", error);
    return NextResponse.json({ 
      valid: false, 
      reason: "Error checking session",
      error: error.message
    }, { status: 500 });
  }
}