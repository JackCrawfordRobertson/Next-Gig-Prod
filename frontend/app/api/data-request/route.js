// app/api/data-request/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db, doc, getDoc } from "@/lib/firebase";
import nodemailer from 'nodemailer';

export async function POST(req) {
  try {
    // Verify session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request
    const body = await req.json();
    const { userId, requestType } = body;

    // Validate user ID
    if (userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get user data including email from the database
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const userData = userSnap.data();
    const userEmail = userData.email || session.user.email;
    
    if (!userEmail) {
      return NextResponse.json({ error: "User email not found" }, { status: 404 });
    }

    // Configure mail transport using your existing environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_SERVER,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Send email to the user
    const userMailOptions = {
      from: process.env.EMAIL_ADDRESS,
      to: userEmail,
      subject: requestType === 'export' 
        ? "Your Data Export Request - Next Gig" 
        : "Account Deletion Request - Next Gig",
      html: requestType === 'export' 
        ? `
          <h2>Data Export Request Received</h2>
          <p>Hello,</p>
          <p>We've received your request to export your Next Gig data. Our team will process this request and send you your data within the next 24-48 hours.</p>
          <p>If you did not make this request, please contact us immediately.</p>
          <p>Thank you,<br>The Next Gig Team</p>
        `
        : `
          <h2>Account Deletion Request Received</h2>
          <p>Hello,</p>
          <p>We've received your request to delete your Next Gig account. Our team will process this request within the next 24-48 hours.</p>
          <p>If you did not make this request, please contact us immediately.</p>
          <p>Thank you,<br>The Next Gig Team</p>
        `
    };

    // Send email to admin (you)
    const adminMailOptions = {
      from: process.env.EMAIL_ADDRESS,
      to: process.env.RECIPIENT_EMAIL,
      subject: `Next Gig - User ${requestType === 'export' ? 'Data Export' : 'Account Deletion'} Request`,
      html: `
        <h2>User ${requestType === 'export' ? 'Data Export' : 'Account Deletion'} Request</h2>
        <p><strong>Request Type:</strong> ${requestType}</p>
        <p><strong>User ID:</strong> ${userId}</p>
        <p><strong>User Email:</strong> ${userEmail}</p>
        <p><strong>Subscription ID:</strong> ${userData.subscriptionId || 'No subscription'}</p>
        <p><strong>PayPal ID:</strong> ${userData.paypalId || 'Not available'}</p>
        <p><strong>Request Time:</strong> ${new Date().toISOString()}</p>
      `
    };

    // Send both emails
    await Promise.all([
      transporter.sendMail(userMailOptions),
      transporter.sendMail(adminMailOptions)
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing data request:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}