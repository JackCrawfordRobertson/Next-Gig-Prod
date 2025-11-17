// app/layout.js
import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/providers/AuthProvider";
import SessionProvider from "@/components/auth/SessionProvider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Next Gig - Automated Job Alerts",
  description:
    "Next Gig delivers relevant job listings straight to your inbox every 8 hours. No more endless scrolling through job boards.",
  metadataBase: new URL("https://next-gig.co.uk"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Next Gig - Automated Job Alerts",
    description:
      "Receive tailored job listings via email every 8 hours. Let the jobs find you.",
    url: "https://next-gig.co.uk",
    siteName: "Next Gig",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
  icons: {
    icon: "/Blue_LogoV2.svg",
  },
  // Disable DarkReader browser extension to prevent hydration mismatches
  other: {
    "darkreader-lock": "true",
  },
};

import { ThemeProvider } from "@/providers/ThemeProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <SessionProvider>
            <AuthProvider>
              <div className="fixed right-2 top-5 md:bottom-4 md:top-auto z-50 bg-yellow-300 text-yellow-900 text-xs font-semibold px-3 py-1 rounded-full shadow-md pointer-events-none select-none">
                <span className="block md:hidden">🚧 BETA</span>
                <span className="hidden md:block">🚧 Experimental area - BETA</span>
              </div>
              {children}
            </AuthProvider>
          </SessionProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}