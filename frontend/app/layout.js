// app/layout.jsx
import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/providers/AuthProvider";
import SessionProvider from "@/components/SessionProvider";
import { Toaster } from "@/components/ui/toaster";


const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Next Gig",
  description: "Next Gig is your personal music booking platform. Discover, post and manage gigs easily.",
  metadataBase: new URL('https://home.next-gig.co.uk'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Next Gig",
    description: "Find gigs faster, post your own, and manage bookings all in one place.",
    url: "https://home.next-gig.co.uk",
    siteName: "Next Gig",
    images: [
      {
        url: "/og-image.jpg", // make sure this exists
        width: 1200,
        height: 630,
      },
    ],
    type: 'website',
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
          {children}
          </AuthProvider>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}