// lib/subscriptionService.js
import * as subscription from '@/lib/subscription';

export const {
  getUserSubscriptionStatus,
  storeSubscription,
  cancelSubscription,
  calculateConsumedTrialDays,
  hasCompletedTrial,
  logSubscriptionEvent
} = subscription;