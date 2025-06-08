// app/api/store-subscription/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db, doc, updateDoc, collection, addDoc } from "@/lib/data/firebase";

export async function POST(req) {
  try {
    // Verify session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request
    const body = await req.json();
    const { userId, subscriptionId, orderId, startDate, trialEndDate } = body;

    // Validate user
    if (userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Calculate trial end date if not provided
    const calculatedTrialEndDate = trialEndDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Prepare subscription data
    const subscriptionData = {
      userId,
      subscriptionId,
      status: 'active',
      plan: 'standard',
      price: 2.99,
      currency: 'GBP',
      paymentMethod: 'paypal',
      startDate: startDate || new Date().toISOString(),
      trialEndDate: calculatedTrialEndDate,
      onTrial: true,
      createdAt: new Date().toISOString(),
      fingerprint: orderId || 'unknown'
    };

    // Store in Firestore
    const docRef = await addDoc(collection(db, "subscriptions"), subscriptionData);
    
    // Update user document
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      subscribed: true,
      onTrial: true,
      lastSubscriptionDate: new Date().toISOString(),
      trialEndDate: calculatedTrialEndDate
    });

    return NextResponse.json({
      status: 'success',
      subscriptionDocId: docRef.id,
      message: 'Subscription stored successfully'
    });
  } catch (error) {
    console.error('Error storing subscription:', error);
    return NextResponse.json({ error: 'Failed to store subscription' }, { status: 500 });
  }
}