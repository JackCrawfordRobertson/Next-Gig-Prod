// app/(public)/layout.js
import ArrowsBackgroundWrapper from "@/components/AnimatedBlocks/ArrowsBackgroundCompiler";


// Server-only metadata
export const metadata = {
  title: "Login",
};

export default function PublicLayout({ children }) {
  return (
    <div className="relative min-h-screen ">

      <ArrowsBackgroundWrapper />

 
       <main className="relative z-10">
        {children}
      </main>
    </div>
  );
}