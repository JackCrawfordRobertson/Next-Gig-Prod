"use client";

import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const isDev = process.env.NODE_ENV === "development"; // ← Check dev vs production

  // Get the real session (production usage)
  const { data: realSession, status } = useSession();

  // In dev mode, mock a session as if not logged in
  // so we can always see the login form
  const session = isDev ? null : realSession;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Redirect authenticated users (production only)
  useEffect(() => {
    if (!isDev && status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router, isDev]);

  // Handle login with email/password
  const handleLogin = async () => {
    if (isDev) {
      // In dev, just skip real sign-in
      console.log("DEV MODE: Skipping real signIn. Your inputs:");
      console.log({ email, password });
      alert("Dev mode - Login flow skipped. Check console logs.");
      return;
    }

    // Production logic: sign in with NextAuth
    try {
      await signIn("credentials", { email, password });
      router.push("/dashboard");
    } catch (error) {
      alert("Login failed. Please check your credentials.");
    }
  };

  if (session) {
    // If session exists (production only), show a "Welcome" and sign-out
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle>Welcome, {session.user.email}</CardTitle>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => signOut()} variant="destructive">
              Sign Out
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Otherwise, show the sign-in form
  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-6">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <p className="text-gray-500 text-sm">
            Sign in with Google or enter your details
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => (isDev ? console.log("Dev mode Google login") : signIn("google"))} className="w-full">
            Sign in with Google
          </Button>

          <div className="relative my-4 flex items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="px-2 text-gray-500 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button onClick={handleLogin} className="w-full">
            Sign in with Email
          </Button>
          <Button
            onClick={() => router.push("/complete-profile")}
            variant="secondary"
            className="w-full"
          >
            Create Account
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}