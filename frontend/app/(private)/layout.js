// app/private/layout.js
import SidebarLayout from "@/components/Sidebar";
import ArrowsBackgroundWrapper from "@/components/AnimatedBlocks/ArrowsBackgroundCompiler";
import PrivateRoute from "@/components/PrivateRoute";

export const metadata = {
    title: "Next Gig",
};

export default function PrivateLayout({ children }) {
    return (
        <PrivateRoute>
            <div className="relative min-h-screen">
                {/* Animated background at the lowest layer */}
                <ArrowsBackgroundWrapper />
                
                {/* Glassy overlay above the animated background */}
                <div className="absolute inset-0 bg-white/30 backdrop-blur-lg w-screen h-screen" />
                
                {/* Sidebar and content on top of everything */}
                <div className="relative z-10">
                    <SidebarLayout>{children}</SidebarLayout>
                </div>
            </div>
        </PrivateRoute>
    );
}