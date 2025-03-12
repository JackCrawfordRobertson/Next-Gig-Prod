import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import SidebarLayout from "@/components/Sidebar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// ✅ Metadata stays outside of Client Components
export const metadata = {
  title: "Next Gig",
  description: "Aggregated job listings from various sources",
  icons: {
    icon: "/Blue_LogoV2.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <SessionProvider> {/* ✅ Ensures NextAuth session is available */}
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}