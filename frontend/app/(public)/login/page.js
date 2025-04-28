// app/(public)/login/page.js - Update existing file
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { showToast } from "@/lib/toast";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
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
        throw new Error(result.error);
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
        "Login failed. Please check your email and password and try again."
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
        <div className="w-full max-w-md shadow-lg bg-white rounded-lg p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">Reset Password</h2>
            <p className="text-gray-500 text-sm">
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
<div className="w-full max-w-md shadow-lg bg-white/70 backdrop-blur-md rounded-lg p-6 border border-white/20">
<div className="text-center mb-6">
          <div className="flex justify-center">
            <Image
              src="/nextgig-logo.svg"
              alt="Next Gig Logo"
              width={140}
              height={50}
              priority
            />
          </div>
          <p className="text-gray-700 mt-2">
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
          <div className="text-center mt-6 text-xs text-gray-500">
            <div className="flex justify-center space-x-4">
              <Link href="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:underline">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
