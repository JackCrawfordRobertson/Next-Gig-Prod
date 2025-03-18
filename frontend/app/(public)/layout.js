// app/(public)/layout.js
import ArrowsBackground from "@/components/AnimatedBlocks";


// Server-only metadata
export const metadata = {
  title: "Get Started",
};

export default function PublicLayout({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden">

      <ArrowsBackground />

 
       {/* Just render children without any fade/transition */}
       <main className="relative z-10">
        {children}
      </main>
    </div>
  );
}