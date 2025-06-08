// lib/subscriptionService.js
import * as subscription from '@/lib/subscriptions/subscription';

export const {
  getUserSubscriptionStatus,
  storeSubscription,
  cancelSubscription,
  calculateConsumedTrialDays,
  hasCompletedTrial,
  logSubscriptionEvent
} = subscription;