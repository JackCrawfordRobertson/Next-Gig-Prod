'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { showToast } from "@/lib/toast";
import { checkSubscriptionStatus } from "@/lib/checkSubscriptionStatus";

export function SubscriptionChecker() {
  const { data: session, status } = useSession();
  const [hasCheckedSubscription, setHasCheckedSubscription] = useState(false);

  useEffect(() => {
    async function checkSubscription() {
      // Only check if authenticated and not already checked
      if (status !== 'authenticated' || hasCheckedSubscription) return;

      try {
        // Use the user ID from session in both prod and dev
        const userId = session?.user?.id;
        
        console.log('Checking subscription for user:', userId);
        const subscriptionStatus = await checkSubscriptionStatus(userId);
        console.log('Full Subscription status:', subscriptionStatus);

        // Detailed logging for toast conditions
        console.log('Subscription details:', {
          subscribed: subscriptionStatus.subscribed,
          hadPreviousSubscription: subscriptionStatus.hadPreviousSubscription,
          onTrial: subscriptionStatus.onTrial
        });

        // Conditions for showing toast
        const shouldShowToast = 
          !subscriptionStatus.subscribed && 
          (subscriptionStatus.hadPreviousSubscription || subscriptionStatus.onTrial);

        console.log('Should show toast:', shouldShowToast);

        // Show toast only if conditions are met
        if (shouldShowToast) {
          console.log('Showing subscription toast');
          showToast({
            title: "Missing your job alerts?",
            description: "Start getting your next gig delivered again by resubscribing to our service.",
            variant: "warning",
            action: {
              label: "Resubscribe",
              onClick: () => window.location.href = "/privacy/profile-settings?tab=subscription"
            }
          });
        }

        setHasCheckedSubscription(true);
      } catch (error) {
        console.error("Subscription check error:", error);
      }
    }

    checkSubscription();
  }, [session, status, hasCheckedSubscription]);

  return null;
}