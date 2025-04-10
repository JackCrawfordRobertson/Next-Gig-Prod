// app/private/layout.js
import { redirect } from 'next/navigation';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import SidebarLayout from "@/components/Sidebar";
import ArrowsBackgroundWrapper from "@/components/AnimatedBlocks/ArrowsBackgroundCompiler";
import PrivateRoute from "@/components/PrivateRoute";
import SessionVerifier from "@/components/SessionVerifier";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata = {
    title: "Next Gig",
};

export default async function PrivateLayout({ children, params }) {
    // Server-side session check with Next-Auth
    const session = await getServerSession(authOptions);
  
    if (!session) {
        // Create the login URL with a return path
        const returnUrl = encodeURIComponent(process.env.NEXT_PUBLIC_BASE_URL || 'https://next-gig.co.uk');
        const loginUrl = `/login?callbackUrl=${returnUrl}`;
        
        // Use the Response.redirect for more reliable redirects
        return Response.redirect(new URL(loginUrl, 'https://next-gig.co.uk'));
    }
  
    return (
        <PrivateRoute>
            <ErrorBoundary>
                <SessionVerifier />
                <div className="relative min-h-screen">
                    <ArrowsBackgroundWrapper />
                    <div className="absolute inset-0 bg-white/30 backdrop-blur-lg w-screen h-screen" />
                    <div className="relative z-10">
                        <SidebarLayout>{children}</SidebarLayout>
                    </div>
                </div>
            </ErrorBoundary>
        </PrivateRoute>
    );
}