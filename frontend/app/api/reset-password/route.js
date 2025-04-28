// app/api/reset-password/route.js - New file
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { hash } from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: process.env.EMAIL_SERVER_PORT,
  secure: process.env.EMAIL_SERVER_SECURE === "true",
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

// Request password reset
export async function POST(request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }
    
    // Find user
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email.toLowerCase()));
    const snapshot = await getDocs(q);
    
    // For security, don't reveal if user exists
    if (snapshot.empty) {
      return Response.json({ success: true });
    }
    
    // Generate reset token
    const token = uuidv4();
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 hour expiry
    
    // Store token
    const tokensRef = collection(db, "verification_tokens");
    await addDoc(tokensRef, {
      identifier: email.toLowerCase(),
      token,
      expires: expires.toISOString(),
    });
    
    // Send email
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Reset your Next Gig password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Your Password</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #1e90ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p>Thanks,<br>The Next Gig Team</p>
        </div>
      `
    });
    
    return Response.json({ success: true });
  } catch (error) {
    console.error("Reset password request error:", error);
    return Response.json({ error: "Failed to process request" }, { status: 500 });
  }
}