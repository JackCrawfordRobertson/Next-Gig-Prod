// app/layout.js
import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/providers/AuthProvider";
import SessionProvider from "@/components/auth/SessionProvider";
import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ErrorMonitoringInit } from "@/lib/init/errorMonitoring";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: {
    default: "Next Gig | Job Hunting Finally Organised",
    template: "%s | Next Gig"
  },
  description:
    "Job hunting shouldn't be a full-time job. Next Gig does the hunting for you. We find the jobs that match what you're after and deliver them straight to your inbox every 8 hours. Finally, job hunting organised.",
  keywords: [
    "job alerts UK",
    "job hunting organised",
    "automated job search",
    "jobs delivered email",
    "curated job listings",
    "UK job board",
    "job finder UK",
    "personalized job alerts",
    "job hunting made easy",
    "job matching platform"
  ],
  authors: [{ name: "Next Gig" }],
  creator: "Next Gig",
  publisher: "Next Gig",
  metadataBase: new URL("https://next-gig.co.uk"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Next Gig | Job Hunting Finally Organised",
    description:
      "Job hunting shouldn't eat up your time. Next Gig finds the jobs that match what you're after and delivers them straight to your inbox every 8 hours. That's it.",
    url: "https://next-gig.co.uk",
    siteName: "Next Gig",
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Next Gig - Job Hunting Finally Organised"
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Next Gig | Job Hunting Finally Organised",
    description: "Job hunting shouldn't be a full-time job. We do the hunting, you get the jobs delivered every 8 hours.",
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
    "description": "Job hunting finally organised. Next Gig hunts down the jobs that match what you're after and delivers them straight to your inbox every 8 hours. No endless scrolling, no wasted time.",
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
      "Job alerts delivered every 8 hours - automated and curated",
      "Match jobs to your exact criteria and preferences",
      "Jobs from LinkedIn, IfYouCould, UN Jobs and more",
      "Straight to your inbox - no scrolling through job boards",
      "Track and manage all your job applications"
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
        <ErrorMonitoringInit />
        <ThemeProvider>
          <SessionProvider>
            <AuthProvider>
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </AuthProvider>
          </SessionProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}