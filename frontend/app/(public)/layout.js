import AnimatedBlocks from "@/components/AnimatedBlocks"; 

export const metadata = {
  title: "Get Started",
};

export default function PublicLayout({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBlocks />

      <main className="relative z-10">{children}</main>
    </div>
  );
}