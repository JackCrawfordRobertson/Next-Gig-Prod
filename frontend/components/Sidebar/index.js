"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { showToast } from "@/lib/toast";
import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ThemeProvider } from "@/providers/ThemeProvider";
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
  Palette,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { signOutCompletely } from "@/lib/firebase";

export default function SidebarLayout({ children }) {
  const router = useRouter();
  const { data: session } = useSession();
  const pathname = usePathname();
  const [playgroundOpen, setPlaygroundOpen] = useState(true);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);
  const [desktopUserMenuOpen, setDesktopUserMenuOpen] = useState(false);

  // Add this function before your component
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Morning";
    if (hour >= 12 && hour < 18) return "Afternoon";
    if (hour >= 18 && hour < 22) return "Evening";
    return "Good night";
  };

  const handleSignOut = async () => {
    try {
      // Use the new comprehensive sign-out function from firebase.js
      await signOutCompletely();

      // Then sign out from NextAuth with the signedOut parameter
      await signOut({
        redirect: true,
        callbackUrl: "/login?signedOut=true",
      });

      // The code below will likely not execute due to the redirect,
      // but included as a fallback
      showToast({
        title: "Success",
        description: "Successfully signed out",
        variant: "success",
      });

      router.push("/login?signedOut=true");
    } catch (error) {
      console.error("Sign out error:", error);
      showToast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });

      // Force reload as last resort
      window.location.href = "/login?signedOut=true";
    }
  };
  
  const handleProfileSettingsClick = () => {
    setDesktopUserMenuOpen(false);
    router.push('/profile-settings');
  };

  const handleMobileProfileSettingsClick = () => {
    setMobileUserMenuOpen(false);
    router.push('/profile-settings');
  };


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

        {/* Main navigation */}
        <SidebarMenu className="space-y-1">
          {/* Playground dropdown */}
          <div>
            <Link
              href="/dashboard"
              className="w-full flex items-center justify-between px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <div className="flex items-center">
                <Home className="w-4 h-4 mr-3 text-gray-500" />
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
              <Briefcase className="w-4 h-4 mr-3 text-gray-500" />
              <span>LinkedIn Jobs</span>
              <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link
              href="/ifyoucould"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <Palette className="w-4 h-4 mr-3 text-gray-500" />
              <span>If You Could</span>
              <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link
              href="/unjobs"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <Globe className="w-4 h-4 mr-3 text-gray-500" />
              <span>UN Jobs</span>
              <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
            </Link>
          </SidebarMenuItem>

          {/* <SidebarMenuItem>
          <Link
            href="/workable"
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <BookOpen className="w-4 h-4 mr-3 text-gray-500" />
            <span>Workable</span>
            <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
          </Link>
        </SidebarMenuItem> */}
        </SidebarMenu>

        {/* Created by section */}
        <div className="mt-auto px-1 py-1 text-xs text-gray-500  flex items-center justify-center gap-2">
          <a
            href="https://jack-robertson.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-foreground hover:underline"
          >
            <span>Created by</span>

            <Image
              src="/Blue_LogoV2.svg"
              alt="Creator icon"
              width={20}
              height={20}
              className="rounded-s-none"
            />
          </a>
        </div>

        {/* User section at bottom */}
        <div className="relative">
          <button
            onClick={() => setDesktopUserMenuOpen(!desktopUserMenuOpen)}
            className="w-full p-4 border-t flex justify-between items-center hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Avatar className="w-9 h-9 rounded-full border">
                <AvatarImage
                  src={session?.user?.profilePicture || "/av.svg"}
                  alt="User Avatar"
                />
                <AvatarFallback className="bg-purple-100 text-purple-800">
                  {session?.user?.firstName
                    ? session.user.firstName.charAt(0)
                    : session?.user?.name
                    ? session.user.name.charAt(0)
                    : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-700">
                  {getTimeBasedGreeting()}, {session?.user?.firstName || "User"}
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
            <div className="absolute bottom-full left-0 right-0 bg-white border shadow-lg rounded-t-md overflow-auto md:overflow-hidden">
             <button
  onClick={handleProfileSettingsClick}
  className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-sm border-b w-full text-left"
>
  <Settings className="w-4 h-4" />
  Profile Settings
</button>
              <button
                onClick={handleSignOut}
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
        href="/ifyoucould"
        className={`flex flex-col items-center ${
          pathname === "/ifyoucould" ? "text-primary" : "text-gray-500"
        }`}
      >
        <Palette className="w-6 h-6" />
        <span className="text-xs mt-1">IfYouCould</span>
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
          <div className="absolute bottom-16 right-0 bg-white border shadow-lg rounded-md overflow-auto md:overflow-hidden w-48">
            <Link
              href="/profile-settings"
              className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-sm border-b"
            >
              <Settings className="w-4 h-4" />
              Profile Settings
            </Link>
            <button
              onClick={handleSignOut}
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
        <div className="flex h-screen w-screen">
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
