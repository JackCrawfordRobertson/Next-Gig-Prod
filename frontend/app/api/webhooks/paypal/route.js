// app/api/webhooks/paypal/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/data/firebase";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";

export async function POST(request) {
  try {
    // Get the request body
    const body = await request.json();
    
    // Verify webhook authenticity (in production, you should validate PayPal signatures)
    // This is a simplified implementation
    
    console.log("PayPal webhook received:", body);
    
    // Process different event types
    const eventType = body.event_type;
    const resourceId = body.resource?.id;
    
    switch (eventType) {
      case "BILLING.SUBSCRIPTION.CREATED":
        // A subscription was created, but we've already handled this in the frontend
        console.log("Subscription created:", resourceId);
        break;
        
      case "BILLING.SUBSCRIPTION.ACTIVATED":
        // The trial has ended and the subscription is now active
        await handleSubscriptionActivated(resourceId, body.resource);
        break;
        
      case "BILLING.SUBSCRIPTION.CANCELLED":
        // The subscription was cancelled
        await handleSubscriptionCancelled(resourceId);
        break;
        
      case "BILLING.SUBSCRIPTION.SUSPENDED":
        // The subscription was suspended (e.g., due to payment failure)
        await handleSubscriptionSuspended(resourceId);
        break;
        
      case "PAYMENT.SALE.COMPLETED":
        // A payment was successfully processed
        console.log("Payment completed for subscription");
        break;
        
      default:
        console.log("Unhandled PayPal event type:", eventType);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing PayPal webhook:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleSubscriptionActivated(subscriptionId, resourceData) {
  try {
    // Find the subscription in our database
    const subscriptionsRef = collection(db, "subscriptions");
    const q = query(subscriptionsRef, where("subscriptionId", "==", subscriptionId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error("No subscription found with ID:", subscriptionId);
      return;
    }
    
    // Update the subscription status
    const subscription = querySnapshot.docs[0];
    await updateDoc(subscription.ref, {
      status: "active",
      onTrial: false,
      trialEndedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    // Also update the user's subscription status
    const userData = subscription.data();
    if (userData.userId) {
      await updateDoc(doc(db, "users", userData.userId), {
        onTrial: false,
        subscriptionActive: true,
        trialEndedAt: new Date().toISOString(),
      });
    }
    
    console.log("Subscription activated successfully:", subscriptionId);
  } catch (error) {
    console.error("Error handling subscription activation:", error);
  }
}

async function handleSubscriptionCancelled(subscriptionId) {
  try {
    // Find the subscription in our database
    const subscriptionsRef = collection(db, "subscriptions");
    const q = query(subscriptionsRef, where("subscriptionId", "==", subscriptionId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error("No subscription found with ID:", subscriptionId);
      return;
    }
    
    // Update the subscription status
    const subscription = querySnapshot.docs[0];
    await updateDoc(subscription.ref, {
      status: "cancelled",
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    // Also update the user's subscription status
    const userData = subscription.data();
    if (userData.userId) {
      await updateDoc(doc(db, "users", userData.userId), {
        subscribed: false,
        subscriptionActive: false,
        onTrial: false,
        subscriptionCancelledAt: new Date().toISOString(),
      });
    }
    
    console.log("Subscription cancelled successfully:", subscriptionId);
  } catch (error) {
    console.error("Error handling subscription cancellation:", error);
  }
}

async function handleSubscriptionSuspended(subscriptionId) {
  try {
    // Find the subscription in our database
    const subscriptionsRef = collection(db, "subscriptions");
    const q = query(subscriptionsRef, where("subscriptionId", "==", subscriptionId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error("No subscription found with ID:", subscriptionId);
      return;
    }
    
    // Update the subscription status
    const subscription = querySnapshot.docs[0];
    await updateDoc(subscription.ref, {
      status: "suspended",
      suspendedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    // Also update the user's subscription status
    const userData = subscription.data();
    if (userData.userId) {
      await updateDoc(doc(db, "users", userData.userId), {
        subscriptionActive: false,
        subscriptionSuspendedAt: new Date().toISOString(),
      });
    }
    
    console.log("Subscription suspended successfully:", subscriptionId);
  } catch (error) {
    console.error("Error handling subscription suspension:", error);
  }
}