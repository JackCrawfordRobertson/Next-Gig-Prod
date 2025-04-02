// app/api/cancel-subscription/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db, doc, updateDoc, collection, query, where, getDocs } from "@/lib/firebase";

const paypal = require("@paypal/checkout-server-sdk");

const Environment =
  process.env.NODE_ENV === "production"
    ? paypal.core.LiveEnvironment
    : paypal.core.SandboxEnvironment;

const paypalClient = new paypal.core.PayPalHttpClient(
  new Environment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  )
);

export async function POST(req) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body
    const body = await req.json();
    const { userId, subscriptionId, subscriptionDocId } = body;

    // Verify the userId matches the session
    if (userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
      // Cancel the PayPal subscription
      const request = new paypal.subscriptions.SubscriptionsCreateRequest(subscriptionId);
      await paypalClient.execute(request);
      
      // Find the subscription document if not provided
      let docIdToUpdate = subscriptionDocId;
      
      if (!docIdToUpdate) {
        const subscriptionsRef = collection(db, "subscriptions");
        const q = query(
          subscriptionsRef,
          where("subscriptionId", "==", subscriptionId),
          where("userId", "==", userId)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
        }
        
        docIdToUpdate = querySnapshot.docs[0].id;
      }
      
      // Update subscription status
      const subscriptionDocRef = doc(db, "subscriptions", docIdToUpdate);
      await updateDoc(subscriptionDocRef, {
        status: "cancelled",
        cancelledAt: new Date().toISOString()
      });
      
      // Update user data
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, {
        subscribed: false,
        onTrial: false
      });
      
      return NextResponse.json({
        success: true,
        message: "Subscription cancelled successfully"
      });
    } catch (error) {
      console.error("Error cancelling PayPal subscription:", error);
      
      // If PayPal API fails, still update our records
      if (subscriptionDocId) {
        const subscriptionDocRef = doc(db, "subscriptions", subscriptionDocId);
        await updateDoc(subscriptionDocRef, {
          status: "cancelled",
          cancelledAt: new Date().toISOString(),
          cancellationNote: "Marked as cancelled but PayPal API failed"
        });
        
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, {
          subscribed: false,
          onTrial: false
        });
        
        return NextResponse.json({
          success: true,
          warning: "Subscription marked as cancelled, but PayPal API failed",
          message: "Your subscription has been cancelled in our records"
        });
      }
      
      throw error;
    }
  } catch (error) {
    console.error("Error in cancel subscription API:", error);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}