"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Home, Briefcase, Globe, Building } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";


export default function SidebarLayout({ children }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Desktop Sidebar Component
  const DesktopSidebar = () => (
    <Sidebar className="h-full w-64 flex flex-col border-r shadow-lg max-md:hidden">
      <SidebarContent className="flex flex-col flex-1">
        <div className="p-6 border-b flex justify-between items-center">
          <Image src="/nextgig-logo.svg" alt="Logo" width={120} height={100} />
          <ThemeToggle />
        </div>

        <SidebarMenu className="p-4 space-y-3">
          <SidebarMenuItem>
            <Link
              href="/dashboard"
              className={`block px-4 py-2 rounded transition ${
                pathname === "/dashboard" ? "bg-sidebar-accent text-white" : ""
              }`}
            >
              Dashboard
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link
              href="/linkedin"
              className={`block px-4 py-2 rounded transition ${
                pathname === "/linkedin" ? "bg-sidebar-accent text-white" : ""
              }`}
            >
              LinkedIn Jobs
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link
              href="/unjobs"
              className={`block px-4 py-2 rounded transition ${
                pathname === "/unjobs" ? "bg-sidebar-accent text-white" : ""
              }`}
            >
              UN Jobs
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link
              href="/workable"
              className={`block px-4 py-2 rounded transition ${
                pathname === "/workable" ? "bg-sidebar-accent text-white" : ""
              }`}
            >
              Workable
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="h-[1px] mx-6 my-4 border-t"></div>

        <div className="mt-auto p-6 flex flex-col items-center gap-3">
          <Avatar className="w-14 h-14 border shadow-md">
            <AvatarImage 
              src={session?.user?.profilePicture || "/Memoji.png"} 
              alt="User Avatar" 
            />
            <AvatarFallback>
              {session?.user?.name ? session.user.name.charAt(0) : "U"}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm">{session?.user?.name || "User"}</p>
          <button
  onClick={() => signOut({ callbackUrl: '/login' })}
  className="w-full bg-red-500 text-white py-2 rounded-md"
>
  Sign Out
</button>
        </div>
      </SidebarContent>
    </Sidebar>
  );

  // Mobile Bottom Navigation Component
  const MobileBottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden z-50 flex justify-around items-center py-2 shadow-lg">
      <Link 
        href="/dashboard" 
        className={`flex flex-col items-center ${
          pathname === "/dashboard" ? "text-primary" : "text-gray-500"
        }`}
      >
        <Home className="w-6 h-6" />
        <span className="text-xs mt-1">Home</span>
      </Link>
      <Link 
        href="/linkedin" 
        className={`flex flex-col items-center ${
          pathname === "/linkedin" ? "text-primary" : "text-gray-500"
        }`}
      >
        <Briefcase className="w-6 h-6" />
        <span className="text-xs mt-1">LinkedIn</span>
      </Link>
      <Link 
        href="/unjobs" 
        className={`flex flex-col items-center ${
          pathname === "/unjobs" ? "text-primary" : "text-gray-500"
        }`}
      >
        <Globe className="w-6 h-6" />
        <span className="text-xs mt-1">UN Jobs</span>
      </Link>
      <Link 
        href="/workable" 
        className={`flex flex-col items-center ${
          pathname === "/workable" ? "text-primary" : "text-gray-500"
        }`}
      >
        <Building className="w-6 h-6" />
        <span className="text-xs mt-1">Workable</span>
      </Link>
      <Link 
        href="/profile"
        className="flex flex-col items-center"
      >
        <Avatar className="w-10 h-10">
          <AvatarImage 
            src={session?.user?.profilePicture || "/Memoji.png"} 
            alt="User Avatar" 
          />
          <AvatarFallback>
            {session?.user?.name ? session.user.name.charAt(0) : "U"}
          </AvatarFallback>
        </Avatar>
      </Link>
    </div>
  );

  return (
    <ThemeProvider>
      <SidebarProvider>
        <div className="flex h-screen w-screen overflow-hidden">
          {/* Desktop Sidebar */}
          <DesktopSidebar />

          {/* Main Content */}
          <main className="flex-1 h-full overflow-auto p-0 md:pl-0">
            {children}
          </main>

          {/* Mobile Bottom Navigation */}
          <MobileBottomNav />
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}