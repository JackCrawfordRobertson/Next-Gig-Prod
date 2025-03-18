"use client";

import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react"; // ✅ Icon for "Create Account"
import { Separator } from "@/components/ui/separator"; // ✅ ShadCN Separator

export default function LoginPage() {
    const router = useRouter();
    const isDev = process.env.NODE_ENV === "development";

    // Get session data from NextAuth
    const { data: session, status } = useSession();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Redirect authenticated users to dashboard
    useEffect(() => {
        if (!isDev && status === "authenticated") {
            router.push("/dashboard");
        }
    }, [status, router, isDev]);

    // ✅ Handle Email/Password Login
    const handleLogin = async () => {
        try {
            const result = await signIn("credentials", { email, password, redirect: false });
            if (result?.error) throw new Error(result.error);

            router.push("/dashboard");
        } catch (error) {
            alert("Login failed. Please check your details and try again.");
        }
    };

    // ✅ Show Welcome Page if Logged In
    if (session) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader>
                        <CardTitle>Welcome back, {session.user.email}</CardTitle>
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
                    <CardTitle>Log In</CardTitle>
                    <p className="text-gray-500 text-sm">Get back to where you left off.</p>
                </CardHeader>

                <CardContent className="space-y-4">
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
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-2 w-full">
                    <Button onClick={handleLogin} className="w-full">
                        Sign In
                    </Button>

            {/* ✅ Full-width divider using divs */}
<div className="relative flex items-center w-full">
    <div className="flex-grow border-t border-gray-300"></div>
    <span className="px-2 text-gray-500 text-sm">OR</span>
    <div className="flex-grow border-t border-gray-300"></div>
</div>

                    <Button
                        onClick={() => router.push("/complete-profile")}
                        variant="secondary"
                        className="w-full flex items-center justify-center gap-2"
                    >
                        <UserPlus size={18} /> Create Account
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}