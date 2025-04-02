import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path as needed
import { db, doc, updateDoc } from "@/lib/firebase";

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
    const { userId, subscriptionId } = body;

    // Verify the userId matches the session
    if (userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Cancel the PayPal subscription
    const request = new paypal.payments.CancelSubscriptionRequest(subscriptionId);
    const response = await paypalClient.execute(request);

    if (response.statusCode === 204) {
      // Update the subscription data in Firestore
      const subscriptionDocRef = doc(db, "subscriptions", userId);
      await updateDoc(subscriptionDocRef, {
        status: "cancelled",
      });

      // Update the user data in Firestore
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, {
        subscribed: false,
        onTrial: false,
      });

      return NextResponse.json({ message: "Subscription cancelled" }, { status: 200 });
    } else {
      return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}