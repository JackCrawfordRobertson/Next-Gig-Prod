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
      // Let's not be hasty, we check only when the time is right
      if (status !== 'authenticated' || hasCheckedSubscription) return;

      try {
        // The secret identity, hidden in plain sight
        const userId = session?.user?.id;
        
        console.log('Peering into the subscription void for user:', userId);
        const subscriptionStatus = await checkSubscriptionStatus(userId);
        console.log('Behold! The full subscription revelation:', subscriptionStatus);

        // Jotting down the curious details in our diary
        console.log('Subscription secrets unveiled:', {
          subscribed: subscriptionStatus.subscribed,
          hadPreviousSubscription: subscriptionStatus.hadPreviousSubscription,
          onTrial: subscriptionStatus.onTrial
        });

        // Should we whisper in their ear? The decision tree grows
        const shouldShowToast = 
          !subscriptionStatus.subscribed && 
          (subscriptionStatus.hadPreviousSubscription || subscriptionStatus.onTrial);

        console.log('To toast or not to toast:', shouldShowToast);

        // If the cosmic alignment is just so, we shall speak
        if (shouldShowToast) {
          console.log('Summoning the toast messenger');
          showToast({
            title: "Missing those job whispers?",
            description: "Your inbox grows lonely without your job alerts. Rekindle the flame and let us deliver possibilities to your door once more.",
            variant: "warning",
            action: {
              label: "Reunite with us",
              onClick: () => window.location.href = "/profile-settings?tab=subscription"
            }
          });
        }

        setHasCheckedSubscription(true);
      } catch (error) {
        console.error("Alas! The subscription spirits have abandoned us:", error);
      }
    }

    checkSubscription();
  }, [session, status, hasCheckedSubscription]);

  return null;
}