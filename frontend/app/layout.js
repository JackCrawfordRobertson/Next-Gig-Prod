// app/layout.jsx (Server Component by default)
import "./globals.css";
import { Inter } from "next/font/google";
import SessionProvider from "@/components/SessionProvider"; // your next-auth session provider
import { ToastProvider } from "@/components/ui/toast-provider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

// Static metadata for the entire app
export const metadata = {
  title: "Next Gig",
  description: "Aggregated job listings from various sources",
  icons: {
    icon: "/Blue_LogoV2.svg",
  },
};

export default function RootLayout({ children }) {
  // This is a Server Component
  // We only do minimal logic here, e.g. setting up fonts, global styles
  return (
    <html lang="en" className={inter.className}>
      <body className="antialiased">
        {/* Provide NextAuth session to ALL routes (public + private) */}
        <SessionProvider>
          {children}
        </SessionProvider>
        <ToastProvider />
      </body>
    </html>
  );
}