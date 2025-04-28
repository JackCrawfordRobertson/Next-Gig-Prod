// app/layout.js
import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/providers/AuthProvider";
import SessionProvider from "@/components/SessionProvider";
import { Toaster } from "@/components/ui/toaster";
import { EnvironmentSwitcher } from "@/components/EnvironmentToggle";

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
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="antialiased">
        <SessionProvider>
          <AuthProvider>
            <div className="fixed right-2 top-5 md:bottom-4 md:top-auto z-50 bg-yellow-300 text-yellow-900 text-xs font-semibold px-3 py-1 rounded-full shadow-md pointer-events-none select-none">
              <span className="block md:hidden">🚧 BETA</span>
              <span className="hidden md:block">🚧 Experimental area - BETA</span>
            </div>
            <EnvironmentSwitcher />
            {children}
          </AuthProvider>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}