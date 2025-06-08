// app/api/verify-subscription/route.js
import { NextResponse } from "next/server";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/data/firebase";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const subscriptionId = searchParams.get('id');
  
  if (!subscriptionId) {
    return NextResponse.json({ error: "Subscription ID is required" }, { status: 400 });
  }
  
  try {
    // Get access token from PayPal
    const authResponse = await fetch(`${process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com'}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.NEXT_PUBLIC_PAYPAL_SECRET}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    });

    const authData = await authResponse.json();
    
    if (!authResponse.ok) {
      console.error("PayPal auth error:", authData);
      return NextResponse.json({ error: "Failed to authenticate with PayPal" }, { status: 500 });
    }
    
    // Verify the subscription with PayPal
    const verifyResponse = await fetch(`${process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com'}/v1/billing/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.access_token}`
      }
    });
    
    const subscriptionData = await verifyResponse.json();
    
    if (!verifyResponse.ok) {
      console.error("PayPal verification error:", subscriptionData);
      return NextResponse.json({ error: subscriptionData.message || "Failed to verify subscription" }, { status: 500 });
    }
    
    // Find the subscription in our database
    const subscriptionsRef = collection(db, "subscriptions");
    const q = query(subscriptionsRef, where("subscriptionId", "==", subscriptionId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return NextResponse.json({ error: "No subscription found with this ID" }, { status: 404 });
    }
    
    const subscription = querySnapshot.docs[0];
    const userData = subscription.data();
    
    // Update subscription status
    await updateDoc(subscription.ref, {
      status: subscriptionData.status,
      paypalStatus: subscriptionData.status,
      lastVerified: new Date().toISOString(),
      subscriptionDetails: subscriptionData,
    });
    
    // Update user's subscription status
    if (userData.userId) {
      await updateDoc(doc(db, "users", userData.userId), {
        subscribed: true,
        onTrial: true,
        subscriptionActive: true,
        subscriptionVerified: true,
        subscriptionVerifiedAt: new Date().toISOString(),
      });
    }
    
    return NextResponse.json({
      success: true,
      status: subscriptionData.status,
      subscription: {
        id: subscriptionId,
        status: subscriptionData.status,
        start_time: subscriptionData.start_time,
        next_billing_time: subscriptionData.billing_info?.next_billing_time
      }
    });
  } catch (error) {
    console.error("Error verifying subscription:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}