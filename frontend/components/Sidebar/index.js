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
import {
  ChevronDown,
  ChevronRight,
  BookOpen,
  Settings,
  Home,
  Briefcase,
  Globe,
  Building,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";

export default function SidebarLayout({ children }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [playgroundOpen, setPlaygroundOpen] = useState(true);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);
  const [desktopUserMenuOpen, setDesktopUserMenuOpen] = useState(false);

  // Desktop Sidebar Component
  const DesktopSidebar = () => (
    <Sidebar className="h-full w-64 flex flex-col border-r max-md:hidden bg-white">
      <SidebarContent className="flex flex-col flex-1">
        {/* Company section */}
        <div className="p-6 flex justify-center items-center">
          <div>
            <Image
              src="/nextgig-logo.svg"
              alt="Logo"
              width={150}
              height={100}
            />
          </div>
        </div>

        <div className="mt-0 px-4">
          <p className="text-sm text-gray-500 mb-2">Platform</p>
        </div>

        {/* Main navigation */}
        <SidebarMenu className="space-y-1">
          {/* Playground dropdown */}
          <div>
            <Link
              href="/dashboard"
              className="w-full flex items-center justify-between px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <div className="flex items-center">
                <Home className="w-5 h-5 mr-3 text-gray-500" />
                <span>Dashboard</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          </div>

          <SidebarMenuItem>
            <Link
              href="/linkedin"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <Briefcase className="w-5 h-5 mr-3 text-gray-500" />
              <span>LinkedIn Jobs</span>
              <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link
              href="/unjobs"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <Globe className="w-5 h-5 mr-3 text-gray-500" />
              <span>UN Jobs</span>
              <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link
              href="/workable"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <BookOpen className="w-5 h-5 mr-3 text-gray-500" />
              <span>Workable</span>
              <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User section at bottom */}
        <div className="mt-auto relative">
          <button
            onClick={() => setDesktopUserMenuOpen(!desktopUserMenuOpen)}
            className="w-full p-4 border-t flex justify-between items-center hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Avatar className="w-9 h-9 rounded-full border">
                <AvatarImage
                  src={session?.user?.profilePicture || "/Memoji.png"}
                  alt="User Avatar"
                />
                <AvatarFallback className="bg-purple-100 text-purple-800">
                  {session?.user?.name ? session.user.name.charAt(0) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-700">
                  {session?.user?.name || "User"}
                </p>
                <p className="text-xs text-gray-500">
                  {session?.user?.email || "user@example.com"}
                </p>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${
                desktopUserMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Desktop User Dropdown */}
          {desktopUserMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 bg-white border shadow-lg rounded-t-md overflow-hidden">
              <Link
                href="/profile-settings"
                className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-sm border-b"
              >
                <Settings className="w-4 h-4" />
                Profile Settings
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-sm text-red-600"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );

  // Mobile Bottom Navigation Component with dropdown
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

      {/* Profile with dropdown menu */}
      <div className="relative">
        <button
          onClick={() => setMobileUserMenuOpen(!mobileUserMenuOpen)}
          className={`flex flex-col items-center ${
            pathname === "/profile-settings" ? "text-primary" : "text-gray-500"
          }`}
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
          <span className="text-xs mt-1">Profile</span>
        </button>

        {/* Mobile User Menu Dropdown */}
        {mobileUserMenuOpen && (
          <div className="absolute bottom-16 right-0 bg-white border shadow-lg rounded-md overflow-hidden w-48">
            <Link
              href="/profile-settings"
              className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-sm border-b"
            >
              <Settings className="w-4 h-4" />
              Profile Settings
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-sm text-red-600"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
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
