// app/private/layout.js
import { redirect } from 'next/navigation';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import SidebarLayout from "@/components/Sidebar";
import ArrowsBackgroundWrapper from "@/components/AnimatedBlocks/ArrowsBackgroundCompiler";
import PrivateRoute from "@/components/PrivateRoute";

export const metadata = {
    title: "Next Gig",
};

export default async function PrivateLayout({ children }) {
    // Server-side session check with Next-Auth
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    return (
        <PrivateRoute>
            <div className="relative min-h-screen">
                <ArrowsBackgroundWrapper />
                <div className="absolute inset-0 bg-white/30 backdrop-blur-lg w-screen h-screen" />
                <div className="relative z-10">
                    <SidebarLayout>{children}</SidebarLayout>
                </div>
            </div>
        </PrivateRoute>
    );
}