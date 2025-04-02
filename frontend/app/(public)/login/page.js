"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import { showToast } from "@/lib/toast";

import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const isDev = process.env.NODE_ENV === "development";

  // Get session data from NextAuth
  const { data: session, status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);

  // Redirect authenticated users directly to dashboard
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  // Handle Email/Password Login
  const handleLogin = async () => {
    try {
      setIsLoading(true);
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) throw new Error(result.error);

      // Show success toast
      showToast({
        title: "Success",
        description: "Successfully logged in",
        variant: "success",
      });
      // Directly push to dashboard on successful login
      router.push("/dashboard");
    } catch (error) {
      showToast({
        title: "Error",
        description: "Login failed. Please check your details and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Password Reset Request
  const handleResetPassword = async () => {
    if (!resetEmail) {
      showToast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      if (!response.ok) throw new Error("Failed to send reset email");

      showToast({
        title: "Success",
        description:
          "If an account exists with this email, you will receive a password reset link shortly.",
        variant: "success",
      });
      setShowResetForm(false);
    } catch (error) {
      showToast({
        title: "Error",
        description: "An error occurred. Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Display password reset form
  if (showResetForm) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <p className="text-gray-500 text-sm">
              Enter your email to receive a password reset link
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resetEmail">Email</Label>
              <Input
                id="resetEmail"
                type="email"
                placeholder="you@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 w-full">
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
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Login form
  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-6">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="flex flex-col items-center text-center">
          <div className="mb-4">
            <Image
              src="/nextgig-logo.svg"
              alt="Company Logo"
              width={140}
              height={50}
              priority
            />
          </div>
          <p className="text-lg font-medium text-gray-700 mt-2">
            Dream gigs delivered. Not searched for.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 w-full">
          <Button onClick={handleLogin} className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>

          <div className="relative flex items-center w-full">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="px-2 text-gray-500 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <Button
            onClick={() => router.push("/complete-profile")}
            variant="secondary"
            className="w-full flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            <UserPlus size={18} /> Create Account
          </Button>

          <div className="text-left">
            <Button
              variant="link"
              className="p-0 mt-1 h-auto text-sm"
              onClick={() => setShowResetForm(true)}
            >
              Forgot password?
            </Button>
          </div>

          <div className="text-center mt-1 text-xs text-gray-500">
            By logging in, you agree to our{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms & Conditions
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
