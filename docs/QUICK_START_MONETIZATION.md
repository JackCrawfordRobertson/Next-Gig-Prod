# Quick Start: Implementing Premium Features

**Goal**: Get your first paid subscriber within 30 days

---

## Week 1: Foundation & Payment Setup

### Day 1-2: Stripe Integration
```bash
npm install stripe @stripe/stripe-js
```

**Create**:
- `/app/api/create-subscription/route.js` - Handle Stripe checkout
- `/app/api/webhook/stripe/route.js` - Handle payment events
- `/lib/stripe/stripe-config.js` - Stripe configuration

**Environment Variables** (add to `.env.local`):
```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Day 3-4: User Tier System
**Update** `/lib/subscriptions/subscription.js`:

```javascript
// Change FREE ACCESS MODE to FREEMIUM MODE
export async function getUserSubscriptionStatus(userId) {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return { tier: "free", hasAccess: true, limits: FREE_LIMITS };
  }

  const userData = userSnap.data();
  const tier = userData.subscriptionTier || "free";

  return {
    tier,
    hasAccess: ["premium", "professional"].includes(tier) || userData.subscribed,
    limits: TIER_LIMITS[tier],
    expiresAt: userData.subscriptionExpiresAt,
  };
}

const FREE_LIMITS = {
  dailyJobViews: 20,
  jobSources: 2, // Choose from 4 available
  jobHistoryDays: 1, // Only last 24 hours
  savedSearches: 0,
  jobBookmarks: 0,
  jobTitlePreferences: 1,
  locationPreferences: 1,
  advancedFilters: false,
  emailNotifications: false,
};

const PREMIUM_LIMITS = {
  dailyJobViews: Infinity,
  jobSources: 4, // All sources
  jobHistoryDays: Infinity,
  savedSearches: 5,
  jobBookmarks: Infinity,
  jobTitlePreferences: Infinity,
  locationPreferences: Infinity,
  advancedFilters: true,
  emailNotifications: true,
};
```

### Day 5-7: Implement Limits on Dashboard

**Update** `/app/(private)/dashboard/page.js`:

```javascript
// Add at top
const [userLimits, setUserLimits] = useState(null);
const [jobViewCount, setJobViewCount] = useState(0);

// Fetch user limits
useEffect(() => {
  async function fetchLimits() {
    const { getUserSubscriptionStatus } = await import("@/lib/subscriptions/subscription");
    const status = await getUserSubscriptionStatus(userData.id);
    setUserLimits(status.limits);

    // Get today's view count
    const viewCount = await getDailyJobViewCount(userData.id);
    setJobViewCount(viewCount);
  }

  if (userData?.id) fetchLimits();
}, [userData]);

// Filter jobs based on limits
const getFilteredJobsByLimits = () => {
  let filtered = jobs;

  // Apply daily view limit for free users
  if (userLimits?.dailyJobViews !== Infinity) {
    filtered = filtered.slice(0, Math.max(0, userLimits.dailyJobViews - jobViewCount));
  }

  // Apply job history limit
  if (userLimits?.jobHistoryDays === 1) {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    filtered = filtered.filter(job => new Date(job.date) >= oneDayAgo);
  }

  // Filter job sources for free users
  if (userLimits?.jobSources === 2) {
    // Show only LinkedIn and IfYouCould for free tier
    filtered = filtered.filter(job =>
      ['linkedin', 'ifyoucould'].includes(job.source?.toLowerCase())
    );
  }

  return filtered;
};
```

**Add upgrade prompts**:
```jsx
{userLimits?.tier === "free" && (
  <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-lg text-white mb-4">
    <div className="flex justify-between items-center">
      <div>
        <h3 className="font-bold">You've viewed {jobViewCount}/20 jobs today</h3>
        <p className="text-sm">Upgrade to Premium for unlimited access</p>
      </div>
      <Button onClick={() => router.push('/upgrade')} variant="secondary">
        Upgrade Now
      </Button>
    </div>
  </div>
)}
```

---

## Week 2: Build Pricing Page

### Create `/app/(public)/upgrade/page.js`

```jsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Zap } from "lucide-react";

export default function UpgradePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState("monthly"); // monthly or yearly

  const handleUpgrade = async (tier) => {
    setLoading(true);

    try {
      const response = await fetch("/api/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          billingCycle,
          email: session.user.email,
        }),
      });

      const { url } = await response.json();
      window.location.href = url; // Redirect to Stripe checkout
    } catch (error) {
      console.error("Upgrade error:", error);
    } finally {
      setLoading(false);
    }
  };

  const plans = {
    premium: {
      name: "Premium",
      monthlyPrice: 4.99,
      yearlyPrice: 49,
      features: [
        "All 4 job sources",
        "Unlimited job viewing",
        "Advanced search & filters",
        "Email notifications",
        "5 saved searches",
        "Unlimited bookmarks",
        "Application tracking",
        "Export job lists",
        "Job market insights",
      ],
    },
    professional: {
      name: "Professional",
      monthlyPrice: 9.99,
      yearlyPrice: 99,
      features: [
        "Everything in Premium",
        "AI job matching",
        "Resume builder",
        "Interview preparation",
        "Company insights",
        "Priority support",
        "SMS notifications",
        "Auto-apply feature",
        "Unlimited saved searches",
      ],
      popular: true,
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Upgrade to Premium
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Find your dream job faster with advanced features
          </p>

          {/* Billing cycle toggle */}
          <div className="inline-flex items-center gap-4 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-md transition ${
                billingCycle === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2 rounded-md transition ${
                billingCycle === "yearly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {Object.entries(plans).map(([tier, plan]) => (
            <Card
              key={tier}
              className={`p-8 ${
                plan.popular ? "border-primary border-2 shadow-lg" : ""
              }`}
            >
              {plan.popular && (
                <div className="flex justify-center -mt-12 mb-4">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    Most Popular
                  </span>
                </div>
              )}

              <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>

              <div className="mb-6">
                <span className="text-4xl font-bold">
                  £{billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}
                </span>
                <span className="text-muted-foreground">
                  /{billingCycle === "monthly" ? "month" : "year"}
                </span>
              </div>

              <Button
                onClick={() => handleUpgrade(tier)}
                disabled={loading}
                className="w-full mb-6"
                variant={plan.popular ? "default" : "outline"}
              >
                {loading ? "Processing..." : `Upgrade to ${plan.name}`}
              </Button>

              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>All plans include a 7-day free trial. Cancel anytime.</p>
          <p className="mt-2">Questions? Contact us at support@next-gig.co.uk</p>
        </div>
      </div>
    </div>
  );
}
```

---

## Week 3: Add Upgrade Prompts Throughout App

### 1. Dashboard Upgrade Banner
Show when free users are close to limits:

```jsx
// In dashboard when jobViewCount > 15
<Card className="bg-yellow-50 border-yellow-200 p-4 mb-4">
  <div className="flex items-center justify-between">
    <div>
      <h3 className="font-semibold text-yellow-900">
        Only {20 - jobViewCount} jobs remaining today
      </h3>
      <p className="text-sm text-yellow-700">
        Upgrade to Premium for unlimited job viewing
      </p>
    </div>
    <Button onClick={() => router.push('/upgrade')}>
      Upgrade
    </Button>
  </div>
</Card>
```

### 2. Job Card Premium Badge
Show locked features:

```jsx
// In JobCard component
{job.source === 'unjobs' && userTier === 'free' && (
  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
    <div className="text-center text-white p-4">
      <Lock className="w-12 h-12 mx-auto mb-2" />
      <h3 className="font-bold mb-1">Premium Only</h3>
      <p className="text-sm mb-4">Unlock UN Jobs with Premium</p>
      <Button onClick={() => router.push('/upgrade')} variant="secondary">
        Upgrade Now
      </Button>
    </div>
  </div>
)}
```

### 3. Advanced Filters Lock

```jsx
// In filter UI
<div className="relative">
  <label>Salary Range</label>
  <Input disabled={userTier === 'free'} />
  {userTier === 'free' && (
    <div className="absolute right-2 top-8">
      <Button size="sm" variant="ghost" onClick={() => router.push('/upgrade')}>
        🔒 Premium
      </Button>
    </div>
  )}
</div>
```

---

## Week 4: Launch & Optimize

### Day 1-3: Testing
- [ ] Test full payment flow
- [ ] Verify limits work correctly
- [ ] Test upgrade/downgrade
- [ ] Check email notifications
- [ ] Mobile testing

### Day 4-5: Soft Launch
- [ ] Enable for 10% of users
- [ ] Monitor conversion rate
- [ ] Fix any bugs
- [ ] Gather feedback

### Day 6-7: Full Launch
- [ ] Enable for all users
- [ ] Send announcement email
- [ ] Post on social media
- [ ] Monitor metrics

---

## Essential Metrics to Track

### Daily
- New signups
- Free → Premium conversions
- Daily job view counts
- Upgrade button clicks

### Weekly
- Premium subscriber count
- Revenue (MRR)
- Churn rate
- Popular features

### Monthly
- Total users by tier
- Lifetime value (LTV)
- Customer acquisition cost (CAC)
- Net Promoter Score (NPS)

---

## Quick Wins for Higher Conversion

### 1. 7-Day Free Trial
- Let users experience premium before paying
- Send reminder email on day 5
- Show value they're getting

### 2. Limited-Time Offer
- "50% off first month - Launch Special"
- Creates urgency
- Lowers barrier to entry

### 3. Social Proof
- "Join 500+ job seekers finding their next role"
- Show testimonials
- Display real-time upgrade notifications

### 4. Value Demonstration
- Show number of hidden jobs: "Unlock 150 more jobs"
- Comparison charts
- Success stories

---

## Sample Email Sequences

### Welcome Email (Day 1)
```
Subject: Welcome to Next Gig! Here's how to get started

Hi [Name],

Welcome to Next Gig! We're excited to help you find your dream job.

Here's what you can do right now:
✅ Set your job preferences
✅ Browse 20 jobs per day from LinkedIn & IfYouCould
✅ Track which jobs you've applied to

Want more? Premium members get:
• Unlimited job viewing
• All 4 job sources (UN Jobs, Workable + more)
• Email notifications for new jobs
• Advanced filters & saved searches

[Try Premium Free for 7 Days]

Happy job hunting!
The Next Gig Team
```

### Upgrade Nudge Email (Day 7)
```
Subject: You've hit your daily limit 3 times this week 🚀

Hi [Name],

We noticed you've been actively searching for jobs this week - that's great!

You've reached your daily viewing limit 3 times. That means you're missing out on matching jobs.

Premium members never hit limits and get:
✅ Unlimited job viewing
✅ 3x more job sources
✅ Email alerts for new matches

[Upgrade to Premium - First Month 50% Off]

Don't miss your next opportunity.

The Next Gig Team
```

---

## Code Snippets for Common Tasks

### Track Daily Job Views
```javascript
// /lib/analytics/jobViews.js
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/data/firebase";

export async function incrementDailyJobViews(userId) {
  const today = new Date().toISOString().split('T')[0];
  const viewRef = doc(db, "daily_job_views", `${userId}_${today}`);

  const viewDoc = await getDoc(viewRef);

  if (!viewDoc.exists()) {
    await setDoc(viewRef, { count: 1, date: today, userId });
    return 1;
  } else {
    const newCount = viewDoc.data().count + 1;
    await updateDoc(viewRef, { count: newCount });
    return newCount;
  }
}

export async function getDailyJobViewCount(userId) {
  const today = new Date().toISOString().split('T')[0];
  const viewRef = doc(db, "daily_job_views", `${userId}_${today}`);
  const viewDoc = await getDoc(viewRef);

  return viewDoc.exists() ? viewDoc.data().count : 0;
}
```

### Check if User Has Access
```javascript
// /lib/utils/accessControl.js
export async function checkFeatureAccess(userId, feature) {
  const { getUserSubscriptionStatus } = await import("@/lib/subscriptions/subscription");
  const status = await getUserSubscriptionStatus(userId);

  const featureMap = {
    advancedFilters: ["premium", "professional"],
    emailNotifications: ["premium", "professional"],
    aiMatching: ["professional"],
    resumeBuilder: ["professional"],
  };

  const allowedTiers = featureMap[feature] || [];
  return allowedTiers.includes(status.tier);
}
```

---

## Next Steps After Launch

### Month 2-3: Add Value
- [ ] Build email notification system
- [ ] Add saved searches
- [ ] Implement export feature
- [ ] Add job market insights

### Month 4-6: Professional Tier
- [ ] Build AI matching algorithm
- [ ] Create resume builder
- [ ] Add interview prep tools
- [ ] Launch Professional tier

### Ongoing
- [ ] A/B test pricing
- [ ] Survey users monthly
- [ ] Add more job sources
- [ ] Improve conversion rate
- [ ] Reduce churn

---

## Support Resources

### Payment Issues
- Stripe Dashboard: https://dashboard.stripe.com
- PayPal Dashboard: https://www.paypal.com/myaccount

### Analytics
- Set up Google Analytics
- Use Mixpanel for funnel tracking
- Add Hotjar for user recordings

### Customer Support
- Create FAQ page
- Add live chat (Intercom or Crisp)
- Monitor support@ email

---

**Remember**: Start small, validate with real users, iterate quickly. Your goal is to get your first 10 paying customers, learn from them, and improve.

Good luck! 🚀
