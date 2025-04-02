// app/api/cancel-subscription/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db, doc, updateDoc, collection, query, where, getDocs, getDoc } from "@/lib/firebase";
import { calculateConsumedTrialDays, hasCompletedTrial } from "@/lib/checkSubscriptionStatus";

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
      // Get user data to calculate trial consumption
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};

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
      
      // Calculate how many days of trial were used before cancellation
      const trialConsumedDays = calculateConsumedTrialDays(
        userData.subscriptionStartDate, 
        userData.trialEndDate
      );
      
      // Check if the trial was completed
      const trialCompleted = hasCompletedTrial(userData.trialEndDate);
      
      // Update subscription status
      const subscriptionDocRef = doc(db, "subscriptions", docIdToUpdate);
      await updateDoc(subscriptionDocRef, {
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
        // Store the trial usage information
        trialUsed: userData.onTrial || false,
        trialConsumedDays: trialConsumedDays
      });
      
      // Update user data
      await updateDoc(userRef, {
        subscribed: false,
        onTrial: false,
        // Track trial history
        trialCompleted: trialCompleted,
        lastCancellationDate: new Date().toISOString(),
        trialConsumedDays: trialConsumedDays
      });
      
      return NextResponse.json({
        success: true,
        message: "Subscription cancelled successfully",
        trialInfo: {
          consumed: trialConsumedDays,
          completed: trialCompleted
        }
      });
    } catch (error) {
      console.error("Error cancelling PayPal subscription:", error);
      
      // If PayPal API fails, still update our records
      if (subscriptionDocId) {
        // Get user data to calculate trial consumption
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};

        // Calculate how many days of trial were used
        const trialConsumedDays = calculateConsumedTrialDays(
          userData.subscriptionStartDate, 
          userData.trialEndDate
        );
        
        // Check if the trial was completed
        const trialCompleted = hasCompletedTrial(userData.trialEndDate);
        
        const subscriptionDocRef = doc(db, "subscriptions", subscriptionDocId);
        await updateDoc(subscriptionDocRef, {
          status: "cancelled",
          cancelledAt: new Date().toISOString(),
          cancellationNote: "Marked as cancelled but PayPal API failed",
          trialUsed: userData.onTrial || false,
          trialConsumedDays: trialConsumedDays
        });
        
        await updateDoc(userRef, {
          subscribed: false,
          onTrial: false,
          trialCompleted: trialCompleted,
          lastCancellationDate: new Date().toISOString(),
          trialConsumedDays: trialConsumedDays
        });
        
        return NextResponse.json({
          success: true,
          warning: "Subscription marked as cancelled, but PayPal API failed",
          message: "Your subscription has been cancelled in our records",
          trialInfo: {
            consumed: trialConsumedDays,
            completed: trialCompleted
          }
        });
      }
      
      throw error;
    }
  } catch (error) {
    console.error("Error in cancel subscription API:", error);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}