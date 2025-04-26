import { NextResponse } from "next/server";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

export async function POST(request) {
  try {
    const { email } = await request.json();
    
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    
    // Configure action code settings for the reset link
    const actionCodeSettings = {
      // URL you want to redirect to after password reset
      url: process.env.NEXT_PUBLIC_BASE_URL 
           ? `${process.env.NEXT_PUBLIC_BASE_URL}/login` 
           : 'https://next-gig.co.uk/login',
      // This must be true for password reset emails
      handleCodeInApp: false,
    };
    
    // Log the attempt for debugging
    console.log(`Sending password reset email to: ${email}`);
    
    // Send the password reset email
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
    
    // For security reasons, always return success even if email doesn't exist
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password reset error:", error);
    
    // Don't expose whether the email exists or not
    return NextResponse.json({ success: true });
  }
}