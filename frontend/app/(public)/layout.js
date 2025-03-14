import AnimatedBlocks from "@/components/AnimatedBlocks"; // ✅ Import animated background

export const metadata = {
  title: "Get Started",
};

export default function PublicLayout({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ✅ Animated background */}
      <AnimatedBlocks />

      {/* ✅ Page content on top */}
      <main className="relative z-10">{children}</main>
    </div>
  );
}