"use client";
import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Account created! You can now sign in.");
    } catch (error) {
      console.error("Sign-Up Error:", error);
      alert(error.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <Card className="w-full max-w-md shadow-lg">
        {session ? (
          <>
            <CardHeader>
              <CardTitle>Welcome, {session.user.email}</CardTitle>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <Button onClick={() => signOut()} variant="destructive">
                Sign Out
              </Button>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <p className="text-gray-500 text-sm">Sign in with Google or create an account</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => signIn("google")} className="w-full">
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
              <Button onClick={() => signIn("credentials", { email, password })} className="w-full">
                Sign in with Email
              </Button>
              <Button onClick={handleSignUp} variant="secondary" className="w-full">
                Create Account
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}