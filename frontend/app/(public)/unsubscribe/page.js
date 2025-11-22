"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db, doc, getDoc, updateDoc } from "@/lib/data/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { showToast } from "@/lib/utils/toast";

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [userExists, setUserExists] = useState(false);
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    // Validate email parameter exists
    if (!email) {
      setError("No email address provided in the URL");
    }
  }, [email]);

  const handleUnsubscribe = async () => {
    if (!email) {
      setError("No email address provided");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Query Firestore to find user by email
      const { collection, query, where, getDocs } = await import("@/lib/data/firebase");

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("No account found with this email address");
        setLoading(false);
        return;
      }

      // Get the first matching user document
      const userDoc = querySnapshot.docs[0];
      const userId = userDoc.id;
      const userData = userDoc.data();

      setFirstName(userData.firstName || "");
      setUserExists(true);

      // Check if already unsubscribed
      if (userData.emailNotificationsEnabled === false) {
        setSuccess(true);
        setLoading(false);
        showToast({
          title: "Already Unsubscribed",
          description: "You're already unsubscribed from email notifications",
          variant: "default",
        });
        return;
      }

      // Update user document to disable email notifications
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, {
        emailNotificationsEnabled: false,
        unsubscribedAt: new Date().toISOString(),
      });

      setSuccess(true);
      showToast({
        title: "Successfully Unsubscribed",
        description: "You won't receive any more job alert emails from us",
        variant: "success",
      });
    } catch (err) {
      console.error("Error unsubscribing:", err);
      setError("Failed to unsubscribe. Please try again or contact support.");
      showToast({
        title: "Unsubscribe Failed",
        description: "There was an error processing your request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResubscribe = () => {
    router.push("/login?redirect=/profile-settings?tab=privacy");
  };

  // Error state - no email in URL
  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-destructive">
              Invalid Link
            </CardTitle>
            <CardDescription>
              This unsubscribe link is missing required information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              The unsubscribe link you followed is incomplete or invalid. Please use the link from your email, or contact support for help.
            </p>
            <div className="flex flex-col gap-2">
              <Link href="/login">
                <Button className="w-full">Go to Login</Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Go to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 text-6xl">✅</div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Unsubscribed Successfully
            </CardTitle>
            <CardDescription>
              {firstName ? `${firstName}, you've` : "You've"} been removed from our mailing list
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{email}</strong> will no longer receive job alert emails from Next Gig.
              </p>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Changed your mind? You can re-enable email notifications anytime by:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Logging into your account</li>
                <li>Going to Profile Settings → Privacy</li>
                <li>Toggling "Email Notifications" back on</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button onClick={handleResubscribe} className="w-full">
                Re-enable Notifications
              </Button>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Go to Home
                </Button>
              </Link>
            </div>

            <p className="text-xs text-center text-muted-foreground pt-2">
              You'll still be able to use Next Gig and view jobs manually
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state - account not found or other errors
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full shadow-lg border-destructive">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 text-6xl">❌</div>
            <CardTitle className="text-2xl font-bold text-destructive">
              Unsubscribe Failed
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Email:</strong> {email}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                If you continue having issues, please contact support at:
              </p>
              <a
                href="mailto:support@next-gig.co.uk"
                className="text-sm text-primary underline block"
              >
                support@next-gig.co.uk
              </a>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button onClick={handleUnsubscribe} variant="outline" className="w-full">
                Try Again
              </Button>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Go to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default state - show unsubscribe confirmation
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 text-6xl">📧</div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Unsubscribe from Job Alerts?
          </CardTitle>
          <CardDescription>
            You're about to stop receiving job notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Email:</strong> {email}
            </p>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>If you unsubscribe:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>You'll stop receiving job alert emails</li>
              <li>You can still access your Next Gig account</li>
              <li>You can re-enable notifications anytime in your settings</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button
              onClick={handleUnsubscribe}
              disabled={loading}
              variant="destructive"
              className="w-full"
            >
              {loading ? "Processing..." : "Yes, Unsubscribe"}
            </Button>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                Cancel (Keep Receiving Emails)
              </Button>
            </Link>
          </div>

          <p className="text-xs text-center text-muted-foreground pt-2">
            We're sorry to see you go, but we understand
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
