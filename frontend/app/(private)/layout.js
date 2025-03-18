// app/(public)/layout.js
import SidebarLayout from "@/components/Sidebar";
import ArrowsBackground from "@/components/AnimatedBlocks";

export const metadata = {
    title: "Get Started",
};

export default function PublicLayout({children}) {
    return (
        <div className="relative min-h-screen overflow-hidden">
            <ArrowsBackground />
            <SidebarLayout>{children}</SidebarLayout>;
        </div>
    );
}
