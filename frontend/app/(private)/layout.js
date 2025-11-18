// app/private/layout.js
import SidebarLayout from "@/components/Sidebar";
import ArrowsBackgroundWrapper from "@/components/AnimatedBlocks/ArrowsBackgroundCompiler";
import PrivateRoute from "@/components/routing/PrivateRoute";
import SessionVerifier from "@/components/auth/SessionVerifier";
import ErrorBoundary from "@/components/shared/ErrorBoundary";

export const metadata = {
    title: "Next Gig",
};

export default function PrivateLayout({ children }) {
    // Client-side session check is handled by PrivateRoute component
    return (
        <PrivateRoute>
            <ErrorBoundary>
                <SessionVerifier />
                <div className="relative min-h-screen bg-background">
                    <ArrowsBackgroundWrapper />
                    <div className="absolute inset-0 bg-white/20 dark:bg-black/40 backdrop-blur-lg w-screen h-screen pointer-events-none" />
                    <div className="relative z-10">
                        <SidebarLayout>{children}</SidebarLayout>
                    </div>
                </div>
            </ErrorBoundary>
        </PrivateRoute>
    );
}