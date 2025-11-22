// app/(public)/login/page.js - Update existing file
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { showToast } from "@/lib/utils/toast";
import Link from "next/link";
import Image from "next/image";
import { useAnimatedTitle } from "@/hooks/useAnimatedTitle";

export default function LoginPage() {
  // ✨ Typewriter animation in browser tab
  useAnimatedTitle({
    animation: "typewriter",
    interval: 300, // Speed of typing
  });
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const handleLogin = async () => {
    setError(null);

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      setIsLoading(true);

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Map NextAuth error codes to user-friendly messages
        if (result.error === "CredentialsSignin") {
          setError("Invalid email or password. Please try again.");
        } else {
          setError(result.error || "Login failed. Please try again.");
        }
        return;
      }

      if (!result?.ok) {
        setError("Login failed. Please try again.");
        return;
      }

      showToast({
        title: "Success",
        description: "Successfully logged in",
        variant: "success",
      });

      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      setError(
        "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      setError("Please enter your email address");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      showToast({
        title: "Password Reset Link Sent",
        description:
          "Check your email for instructions to reset your password.",
        variant: "success",
      });

      setShowResetForm(false);
    } catch (error) {
      console.error("Reset password error:", error);
      setError(
        "An error occurred while requesting password reset. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      showResetForm ? handleResetPassword() : handleLogin();
    }
  };

  if (showResetForm) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent p-6">
        <div className="w-full max-w-md shadow-lg bg-background rounded-lg p-6 border border-border">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">Reset Password</h2>
            <p className="text-muted-foreground text-sm">
              Enter your email to receive a password reset link
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="resetEmail">Email</Label>
              <Input
                id="resetEmail"
                type="email"
                placeholder="you@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>

            <Button
              onClick={handleResetPassword}
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>

            <Button
              variant="ghost"
              onClick={() => setShowResetForm(false)}
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-6">
<div className="w-full max-w-md shadow-lg bg-background/80 dark:bg-background/95 backdrop-blur-md rounded-lg p-6 border border-border">
<div className="text-center mb-6">
          <div className="flex justify-center">
            <Image
              src="/nextgig-logo.svg"
              alt="Next Gig Logo"
              width={100}
              height={36}
              priority
              style={{ width: "200px", height: "auto" }}
            />
          </div>
          <p className="text-foreground mt-2">
            Dream gigs delivered. Not searched for.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>

          <Button onClick={handleLogin} className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>

          <div className="flex justify-between items-center">
            <Button
              variant="link"
              className="p-0 text-sm"
              onClick={() => setShowResetForm(true)}
            >
              Forgot password?
            </Button>

            <Button
              variant="link"
              className="p-0 text-sm"
              onClick={() => router.push("/complete-profile")}
            >
              Create Account
            </Button>
          </div>
          <div className="text-center mt-6 text-xs text-muted-foreground">
            <div className="flex justify-center space-x-4">
              <Link href="/privacy" className="hover:underline text-muted-foreground">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:underline text-muted-foreground">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
