
// app/layout.jsx
import "./globals.css";
import { Inter } from "next/font/google";
import SessionProvider from "@/components/SessionProvider";
import ClientToaster from "@/components/ClientToaster";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Next Gig",
  description: "Aggregated job listings from various sources",
  icons: {
    icon: "/Blue_LogoV2.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="antialiased">
        <SessionProvider>
          {children}
        </SessionProvider>
        <ClientToaster />
      </body>
    </html>
  );
}