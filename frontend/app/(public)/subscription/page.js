// app/(public)/subscription/page.js
"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Zap, Mail, Shield, ArrowRight } from "lucide-react";

export default function SubscriptionPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          {/* Features Card */}
          <Card className="shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl md:text-2xl">What You Get</CardTitle>
              <CardDescription className="text-sm">
                Everything you need to land your next dream job
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-green-100 p-1.5 md:p-2 flex-shrink-0">
                  <Check className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm md:text-base">Daily Job Alerts</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Fresh opportunities delivered straight to your inbox
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-blue-100 p-1.5 md:p-2 flex-shrink-0">
                  <Mail className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm md:text-base">Smart Matching</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    AI-powered job recommendations based on your preferences
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-purple-100 p-1.5 md:p-2 flex-shrink-0">
                  <Zap className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm md:text-base">Multiple Sources</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Jobs from LinkedIn, UN Jobs, If You Could, and more
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-orange-100 p-1.5 md:p-2 flex-shrink-0">
                  <Shield className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm md:text-base">Application Tracking</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Keep track of where you've applied
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coming Soon Card */}
          <Card className="shadow-xl border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="text-center pb-4">
              <div className="inline-block bg-yellow-100 text-yellow-800 rounded-full px-4 py-1 text-sm font-semibold mb-4 mx-auto">
                Coming Soon
              </div>
              <CardTitle className="text-xl md:text-2xl">Premium Subscription</CardTitle>
              <CardDescription className="mt-2 text-sm">
                Enhanced features and unlimited access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6 text-center">
                <div className="mb-4">
                  <p className="text-2xl md:text-4xl font-bold text-gray-900">Free Now!</p>
                  <p className="text-muted-foreground text-sm mt-2">
                    Currently enjoying full access at no cost
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  We're building something special. Premium features coming soon with enhanced job matching and priority support.
                </p>
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="w-full"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-3 md:gap-4 pt-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Check className="h-3 w-3" />
                  Free Access
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Zap className="h-3 w-3" />
                  Always Updated
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Questions? Email us at{" "}
            <a
              href="mailto:jack@ya-ya.co.uk"
              className="text-black hover:underline"
            >
              support@next-gig.co.uk
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
