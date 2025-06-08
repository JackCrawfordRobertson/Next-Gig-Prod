import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { 
  db, 
  doc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  getDoc
} from "@/lib/data/firebase";
import { calculateConsumedTrialDays, hasCompletedTrial } from "@/lib/subscriptions/checkSubscriptionStatus";

// Direct PayPal SDK import instead of @/lib/paypal
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
    // 1. Verify session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request body
    const body = await req.json();
    const { 
      userId, 
      planType = 'standard', 
      oldSubscriptionId, 
      oldSubscriptionDocId 
    } = body;

    // 3. Validate input
    if (userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 4. Additional security checks
    const duplicateSubscriptionCheck = await checkExistingSubscriptions(userId);
    if (duplicateSubscriptionCheck.hasDuplicates) {
      return NextResponse.json({
        status: 'warning',
        duplicateRisk: true,
        message: 'An active or recent subscription already exists.',
        existingSubscriptions: duplicateSubscriptionCheck.existingSubscriptions.map(sub => ({
          status: sub.status,
          startDate: sub.startDate,
          plan: sub.plan
        }))
      }, { status: 409 }); // Conflict status
    }

    // 5. Retrieve device fingerprint and IP from user document
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();

    // 5b. Check previous subscription history for trial eligibility
    const subscriptionsRef = collection(db, 'subscriptions');
    const historyQuery = query(
      subscriptionsRef,
      where('userId', '==', userId),
      where('status', '==', 'cancelled')
    );
    
    const historySnapshot = await getDocs(historyQuery);
    const subscriptionHistory = historySnapshot.docs.map(doc => doc.data());
    const lastCancellation = subscriptionHistory.length > 0 ? 
      subscriptionHistory.sort((a, b) => new Date(b.cancelledAt) - new Date(a.cancelledAt))[0] : null;
    
    // Determine trial eligibility
    let eligibleForTrial = true;
    let trialDuration = 7; // Default trial duration in days
    let trialEligibilityReason = 'First-time subscriber';
    
    if (userData.hadPreviousSubscription) {
      // Check when the last subscription was cancelled
      if (userData.lastCancellationDate || (lastCancellation && lastCancellation.cancelledAt)) {
        const lastCancelDate = userData.lastCancellationDate || lastCancellation.cancelledAt;
        const lastCancellationDate = new Date(lastCancelDate);
        const now = new Date();
        const daysSinceCancellation = Math.ceil(
          (now - lastCancellationDate) / (1000 * 60 * 60 * 24)
        );
        
        // If cancelled within last 30 days, check if trial was already used
        if (daysSinceCancellation < 30) {
          if (userData.trialCompleted) {
            // No new trial if previous one was completed and cancelled recently
            eligibleForTrial = false;
            trialDuration = 0;
            trialEligibilityReason = 'Previous trial completed within last 30 days';
          } else if (userData.trialConsumedDays || (lastCancellation && lastCancellation.trialConsumedDays)) {
            // Partial trial - give remaining days
            const daysConsumed = userData.trialConsumedDays || lastCancellation.trialConsumedDays || 0;
            trialDuration = Math.max(0, 7 - daysConsumed);
            eligibleForTrial = trialDuration > 0;
            trialEligibilityReason = trialDuration > 0 ? 
          `Resuming previous trial (${trialDuration} days remaining from your last subscription)` : 
          'No trial days remaining from your previous subscription';
          }
        } else {
          trialEligibilityReason = 'Previous subscription cancelled >30 days ago';
        }
      } else {
        trialEligibilityReason = 'Previous subscription without cancellation data';
      }
    }
    
    // Calculate trial end date
    const onTrial = eligibleForTrial && trialDuration > 0;
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + (onTrial ? trialDuration : 0));
    const trialEndDateIso = trialEndDate.toISOString();

    // 6. Create new PayPal Subscription using the direct SDK
    const request = new paypal.subscriptions.SubscriptionsCreateRequest();
    request.requestBody({
      plan_id: process.env.PAYPAL_PLAN_ID,
      application_context: {
        brand_name: "Next Gig",
        user_action: "SUBSCRIBE_NOW",
        shipping_preference: "NO_SHIPPING",
        payment_method: {
          payer_selected: "PAYPAL",
          payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED"
        },
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/subscription-success?userId=${userId}&plan=${planType}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/profile-settings`
      },
      subscriber: {
        name: {
          given_name: session.user.firstName || "Subscriber",
          surname: session.user.lastName || "User"
        },
        email_address: session.user.email
      }
    });

    const subscriptionResponse = await paypalClient.execute(request);

    // 7. Prepare subscription data with additional security metadata
    const subscriptionData = {
      userId,
      subscriptionId: subscriptionResponse.result.id,
      status: onTrial ? 'trial' : 'active',
      plan: planType,
      price: 1.25, // Default price if not available from PayPal
      currency: 'GBP',
      paymentMethod: 'paypal',
      startDate: new Date().toISOString(),
      onTrial: onTrial,
      trialEndDate: onTrial ? trialEndDateIso : null,
      createdAt: new Date().toISOString(),
      
      // Enhanced security metadata
      userIP: userData?.userIP || '',
      deviceFingerprint: userData?.deviceFingerprint || '',
      securityCheck: {
        timestamp: new Date().toISOString(),
        method: 'resubscription',
        sourceIP: req.ip || req.headers.get('x-forwarded-for') || 'unknown'
      },
      
      // Trial eligibility data
      trialEligibility: {
        eligible: eligibleForTrial,
        duration: trialDuration,
        reason: trialEligibilityReason
      }
    };

    // 8. Add a reference to the old subscription if applicable
    if (oldSubscriptionId) {
      subscriptionData.previousSubscriptionId = oldSubscriptionId;
    }

    // 9. Store in Firestore - use addDoc to get a unique document ID
    let subscriptionDocId;
    
    if (oldSubscriptionDocId) {
      // If we have the old doc ID, we can update that document
      const oldDocRef = doc(db, 'subscriptions', oldSubscriptionDocId);
      await updateDoc(oldDocRef, subscriptionData);
      subscriptionDocId = oldSubscriptionDocId;
    } else {
      // Otherwise create a new document with auto-generated ID
      const docRef = await addDoc(collection(db, 'subscriptions'), subscriptionData);
      subscriptionDocId = docRef.id;
    }

    // 10. Update user document
    await updateDoc(userDocRef, {
      subscribed: true,
      onTrial: onTrial,
      trialEndDate: onTrial ? trialEndDateIso : null,
      lastSubscriptionDate: new Date().toISOString(),
      trialEligibilityReason: trialEligibilityReason,
      trialDuration: trialDuration
    });

    // 11. Log security event
    await logSecurityEvent(userId, 'subscription_reactivated');

    return NextResponse.json({
      status: 'success',
      subscriptionData,
      subscriptionDocId: subscriptionDocId 
    }, { status: 200 });

  } catch (error) {
    // 12. Comprehensive error logging
    console.error('Resubscription creation error:', {
      message: error.message,
      stack: error.stack,
      userId: session?.user?.id
    });

    return NextResponse.json(
      { 
        error: 'Failed to create subscription',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, 
      { status: 500 }
    );
  }
}

// Helper function to check for existing subscriptions
async function checkExistingSubscriptions(userId) {
  const subscriptionsRef = collection(db, 'subscriptions');
  
  // Query for active or recently cancelled subscriptions
  const subscriptionQuery = query(
    subscriptionsRef,
    where('userId', '==', userId),
    where('status', 'in', ['active', 'pending'])
  );

  const subscriptionSnapshot = await getDocs(subscriptionQuery);
  
  const existingSubscriptions = subscriptionSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return {
    hasDuplicates: existingSubscriptions.length > 0,
    existingSubscriptions
  };
}

// Security event logging
async function logSecurityEvent(userId, eventType) {
  try {
    await addDoc(collection(db, 'security_logs'), {
      userId,
      eventType,
      timestamp: new Date().toISOString(),
      ipAddress: 'unknown' // Replace with actual IP retrieval method
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}