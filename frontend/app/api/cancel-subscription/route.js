// pages/api/cancel-subscription/route.js

import { getSession } from "next-auth/react";
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

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const session = await getSession({ req });

      if (!session) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userId = session.user.id;

      // Get the subscription ID from the request query
      const { subscriptionId } = req.query;

      // Cancel the PayPal subscription
      const request = new paypal.payments.CancelSubscriptionRequest(
        subscriptionId
      );
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

        return res.status(200).json({ message: "Subscription cancelled" });
      } else {
        return res.status(500).json({ error: "Failed to cancel subscription" });
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}