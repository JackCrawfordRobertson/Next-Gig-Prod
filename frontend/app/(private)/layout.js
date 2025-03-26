// app/(public)/layout.js
import SidebarLayout from "@/components/Sidebar";
import ArrowsBackgroundWrapper from "@/components/AnimatedBlocks/ArrowsBackgroundCompiler";

export const metadata = {
    title: "Next Gig",
};

export default function PublicLayout({children}) {
    return (
        <div className="relative min-h-screen overflow-hidden">
            <ArrowsBackgroundWrapper />
            <SidebarLayout>{children}</SidebarLayout>;
        </div>
    );
}
