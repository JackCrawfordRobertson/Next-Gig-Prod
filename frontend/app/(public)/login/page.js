"use client";

import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FcGoogle } from "react-icons/fc"; // ✅ Google icon for button

export default function LoginPage() {
  const router = useRouter();
  const isDev = process.env.NODE_ENV === "development"; // ← Check dev vs production

  // Get session data from NextAuth
  const { data: realSession, status } = useSession();
  const session = isDev ? null : realSession; // Mock session in dev mode

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Redirect authenticated users (production only)
  useEffect(() => {
    if (!isDev && status === "authenticated") {
      checkUserExists(session?.user?.email);
    }
  }, [status, session]);

  // ✅ Check if user exists in Firestore, redirect accordingly
  const checkUserExists = async (email) => {
    if (!email) return;

    const userRef = doc(db, "users", email);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // ✅ Existing user, send to dashboard
      router.push("/dashboard");
    } else {
      // ❌ New user, send to complete profile
      router.push("/complete-profile");
    }
  };

  // ✅ Handle Google Sign-In
  const handleGoogleLogin = async () => {
    if (isDev) {
      console.log("DEV MODE: Skipping real Google login");
      return;
    }

    try {
      const result = await signIn("google", { redirect: false });
      if (result?.error) {
        throw new Error(result.error);
      }

      // ✅ Check Firestore for user info after login
      checkUserExists(result?.user?.email);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      alert("Google Sign-In failed. Please try again.");
    }
  };

  // ✅ Handle Email/Password Login
  const handleLogin = async () => {
    if (isDev) {
      console.log("DEV MODE: Skipping real email login. Your inputs:", { email, password });
      return;
    }

    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        throw new Error(result.error);
      }

      router.push("/dashboard");
    } catch (error) {
      alert("Login failed. Please check your credentials.");
    }
  };

  // ✅ Show Welcome Page if Logged In
  if (session) {
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

  // ✅ Sign-In Form
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
          {/* Google Sign-In Button */}
          <Button 
            onClick={handleGoogleLogin} 
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-black hover:bg-gray-100"
          >
            <FcGoogle size={20} /> Sign in with Google
          </Button>

          {/* Divider */}
          <div className="relative my-4 flex items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="px-2 text-gray-500 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          {/* Email & Password Login */}
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