// lib/checkSubscriptionStatus.js
import * as subscription from '@/lib/subscription';

export const checkSubscriptionStatus = subscription.getUserSubscriptionStatus;
export const storeSubscription = subscription.storeSubscription;
export const calculateConsumedTrialDays = subscription.calculateConsumedTrialDays;
export const hasCompletedTrial = subscription.hasCompletedTrial;