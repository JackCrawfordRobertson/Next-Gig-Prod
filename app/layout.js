import { Inter } from "next/font/google";
import "./globals.css";
import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import { Github } from "lucide-react";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const inter = Inter({
  variable: "--font-inter",
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
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider>
          <SidebarProvider>
            <div className="flex h-screen w-screen overflow-hidden">
              {/* Sidebar */}
              <Sidebar className="h-full w-64 flex flex-col border-r shadow-lg">
                <SidebarContent className="flex flex-col flex-1">
                  {/* Sidebar Header */}
                  <div className="p-6 border-b flex justify-between items-center">
                    <h1 className="text-xl font-bold tracking-wide flex items-center gap-2">
                      Next Gig
                      <Image src="/Blue_LogoV2.svg" alt="Logo" width={25} height={25} />
                    </h1>
                    <ThemeToggle />
                  </div>

                  {/* Sidebar Navigation */}
                  <SidebarMenu className="p-4 space-y-3">
                    <SidebarMenuItem>
                      <Link href="/dashboard" className="block px-4 py-2 rounded transition">
                        Dashboard
                      </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Link href="/linkedin" className="block px-4 py-2 rounded transition">
                        LinkedIn Jobs
                      </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Link href="/unjobs" className="block px-4 py-2 rounded transition">
                        UN Jobs
                      </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Link href="/workable" className="block px-4 py-2 rounded transition">
                        Workable Jobs
                      </Link>
                    </SidebarMenuItem>
                  </SidebarMenu>

                  {/* Divider */}
                  <div className="h-[1px] mx-6 my-4 border-t"></div>

                  {/* Profile & Contact */}
                  <div className="mt-auto p-6 flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full border overflow-hidden shadow-md">
                      <Image src="/Memoji.png" alt="User Avatar" width={56} height={56} />
                    </div>
                    <p className="text-sm">Built by Jack Robertson</p>

                    {/* Contact & GitHub */}
                    <div className="flex gap-3">
                      <a
                        href="mailto:jack@ya-ya.co.uk"
                        className="px-4 py-2 rounded-md transition"
                      >
                        Contact
                      </a>
                      <a
                        href="https://github.com/JackCrawfordRobertson/job-scraper-bot.git"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center p-2 rounded-md transition"
                      >
                        <Github className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                </SidebarContent>
              </Sidebar>

              {/* Main Content */}
              <main className="flex-1 h-full overflow-auto p-0">{children}</main>
            </div>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}