import { NextResponse } from "next/server";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, actionCodeSettings } from "@/lib/firebase";

export async function POST(request) {
  try {
    const { email } = await request.json();
    
    // Use Firebase's built-in password reset functionality with custom settings
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password reset error:", error);
    // Still return success to prevent email enumeration
    return NextResponse.json({ success: true });
  }
}