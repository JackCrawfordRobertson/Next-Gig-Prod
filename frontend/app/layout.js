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
  title: {
    default: "Next Gig - Automated Job Alerts | Get Jobs Delivered to Your Inbox",
    template: "%s | Next Gig"
  },
  description:
    "Next Gig delivers relevant job listings straight to your inbox every 8 hours. No more endless scrolling through job boards. Find your next opportunity effortlessly.",
  keywords: [
    "job alerts",
    "automated job search",
    "job notifications",
    "career opportunities",
    "job board",
    "employment alerts",
    "job matching",
    "job finder",
    "UK jobs",
    "remote jobs"
  ],
  authors: [{ name: "Next Gig" }],
  creator: "Next Gig",
  publisher: "Next Gig",
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
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Next Gig - Automated Job Alerts Platform"
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Next Gig - Automated Job Alerts",
    description: "Receive tailored job listings via email every 8 hours. Let the jobs find you.",
    images: ["/og-image.png"],
    creator: "@nextgig",
    site: "@nextgig"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/Blue_LogoV2.svg",
        color: "#3b82f6"
      },
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Next Gig",
  },
  formatDetection: {
    telephone: false,
  },
  // Disable DarkReader browser extension to prevent hydration mismatches
  other: {
    "darkreader-lock": "true",
  },
};

// Viewport configuration (Next.js 15+)
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" }
  ],
};

import { ThemeProvider } from "@/providers/ThemeProvider";

export default function RootLayout({ children }) {
  // Structured Data for SEO (JSON-LD)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Next Gig",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Any",
    "description": "Automated job alert platform that delivers relevant job listings straight to your inbox every 8 hours.",
    "url": "https://next-gig.co.uk",
    "author": {
      "@type": "Organization",
      "name": "Next Gig"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "GBP"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "100",
      "bestRating": "5",
      "worstRating": "1"
    },
    "featureList": [
      "Automated job alerts every 8 hours",
      "Personalized job matching",
      "Multiple job board integration",
      "Email notifications",
      "Job application tracking"
    ]
  };

  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      </head>
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