// app/(public)/layout.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import ArrowsBackgroundWrapper from "@/components/AnimatedBlocks/ArrowsBackgroundCompiler";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";

// Server-only metadata
export const metadata = {
  title: "Login",
};

export default async function PublicLayout({ children }) {
  // We still check session in public layout to potentially redirect logged-in users
  const session = await getServerSession(authOptions);

  return (
    <div className="relative min-h-screen">
      <ErrorBoundary>
        <ArrowsBackgroundWrapper />
        
        <main className="relative z-10">
          {children}
        </main>
        
        <Toaster />
      </ErrorBoundary>
    </div>
  );
}