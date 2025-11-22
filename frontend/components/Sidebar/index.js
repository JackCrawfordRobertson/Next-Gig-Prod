"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { showToast } from "@/lib/utils/toast";
import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { useTheme } from "next-themes";
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
  Moon,
  Sun,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/data/firebase'; // adjust path as needed

// Updated function to fetch user profile using session data
const getCurrentUserProfile = async (userId) => {
  try {
    if (!userId) return null;
    
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export default function SidebarLayout({ children }) {
  const router = useRouter();
  const { data: session } = useSession();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [playgroundOpen, setPlaygroundOpen] = useState(true);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);
  const [desktopUserMenuOpen, setDesktopUserMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Fetch user profile from Firebase using NextAuth session
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (session?.user?.id) {
        const profile = await getCurrentUserProfile(session.user.id);
        setUserProfile(profile);
      }
    };

    fetchUserProfile();
  }, [session]);

  // Get profile data with fallbacks
  const profilePicUrl = userProfile?.profilePicture || session?.user?.profilePicture || "/av.svg";
  const firstName = userProfile?.firstName || session?.user?.firstName || "User";
  const userEmail = userProfile?.email || session?.user?.email || "user@example.com";

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
      // Show success message first
      showToast({
        title: "Signing out...",
        description: "Redirecting you to login page",
        variant: "default",
      });

      // Sign out and redirect to login page
      await signOut({
        redirect: false,
        callbackUrl: "/login",
      });

      // Force page refresh and redirect to login
      window.location.href = "/login";
    } catch (error) {
      console.error("Sign out error:", error);

      // Force redirect even if sign out fails
      window.location.href = "/login";
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
    <Sidebar className="h-full w-64 flex flex-col border-r max-md:hidden bg-background">
      <SidebarContent className="flex flex-col flex-1 bg-background">
        {/* Company section - Clickable logo */}
        <div className="p-6 flex justify-center items-center">
          <Link href="/dashboard" className="cursor-pointer hover:opacity-80 transition-opacity">
            <Image
              src="/nextgig-logo.svg"
              alt="Next Gig Logo"
              width={150}
              height={100}
            />
          </Link>
        </div>

        {/* Main navigation */}
        <SidebarMenu className="space-y-1">
          {/* Playground dropdown */}
          <div>
            <Link
              href="/dashboard"
              className="w-full flex items-center justify-between px-4 py-2 text-foreground hover:bg-accent rounded-md transition-colors"
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
              className="flex items-center px-4 py-2 text-foreground hover:bg-accent rounded-md transition-colors"
            >
              <Briefcase className="w-4 h-4 mr-3 text-gray-500" />
              <span>linkedin Jobs</span>
              <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link
              href="/ifyoucould"
              className="flex items-center px-4 py-2 text-foreground hover:bg-accent rounded-md transition-colors"
            >
              <Palette className="w-4 h-4 mr-3 text-gray-500" />
              <span>If You Could Jobs</span>
              <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link
              href="/unjobs"
              className="flex items-center px-4 py-2 text-foreground hover:bg-accent rounded-md transition-colors"
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
            className="w-full p-4 border-t flex justify-between items-center hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-3">
              <Avatar className="w-9 h-9 rounded-full border">
                <AvatarImage
                  src={profilePicUrl}
                  alt="User Avatar"
                />
                <AvatarFallback className="bg-purple-100 text-purple-800">
                  {firstName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-700">
                  {getTimeBasedGreeting()}, {firstName}
                </p>
                <p className="text-xs text-gray-500">
                  {userEmail}
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
            <div className="absolute bottom-full left-0 right-0 bg-background border shadow-lg rounded-t-md overflow-auto md:overflow-hidden">
             <button
  onClick={handleProfileSettingsClick}
  className="flex items-center gap-2 px-4 py-3 hover:bg-accent text-sm border-b w-full text-left text-foreground transition-colors"
>
  <Settings className="w-4 h-4" />
  Profile Settings
</button>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent text-sm border-b text-foreground transition-colors text-left"
              >
                <span className="flex items-center gap-2">
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                  Dark Mode
                </span>
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-950 text-sm text-red-600 transition-colors"
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
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t md:hidden z-50 flex justify-around items-center py-2 shadow-lg">
      <Link
        href="/dashboard"
        className={`flex flex-col items-center transition-colors ${
          pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
        }`}
      >
        <Home className="w-6 h-6" />
        <span className="text-xs mt-1">Home</span>
      </Link>
      <Link
        href="/linkedin"
        className={`flex flex-col items-center transition-colors ${
          pathname === "/linkedin" ? "text-primary" : "text-muted-foreground"
        }`}
      >
        <Briefcase className="w-6 h-6" />
        <span className="text-xs mt-1">linkedin</span>
      </Link>
      <Link
        href="/ifyoucould"
        className={`flex flex-col items-center transition-colors ${
          pathname === "/ifyoucould" ? "text-primary" : "text-muted-foreground"
        }`}
      >
        <Palette className="w-6 h-6" />
        <span className="text-xs mt-1">IfYouCould</span>
      </Link>
      <Link
        href="/unjobs"
        className={`flex flex-col items-center transition-colors ${
          pathname === "/unjobs" ? "text-primary" : "text-muted-foreground"
        }`}
      >
        <Globe className="w-6 h-6" />
        <span className="text-xs mt-1">UN Jobs</span>
      </Link>

      {/* Profile with dropdown menu */}
      <div className="relative">
        <button
          onClick={() => setMobileUserMenuOpen(!mobileUserMenuOpen)}
          className={`flex flex-col items-center transition-colors ${
            pathname === "/profile-settings" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <Avatar className="w-10 h-10">
            <AvatarImage
              src={profilePicUrl}
              alt="User Avatar"
            />
            <AvatarFallback>
              {firstName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs mt-1">Profile</span>
        </button>

        {/* Mobile User Menu Dropdown */}
        {mobileUserMenuOpen && (
          <div className="absolute bottom-16 right-0 bg-background border shadow-lg rounded-md overflow-auto md:overflow-hidden w-48">
            <button
              onClick={handleMobileProfileSettingsClick}
              className="flex items-center gap-2 px-4 py-3 hover:bg-accent text-sm border-b w-full text-left text-foreground transition-colors"
            >
              <Settings className="w-4 h-4" />
              Profile Settings
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-full flex items-center gap-2 px-4 py-3 hover:bg-accent text-sm border-b text-foreground transition-colors text-left"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
              Dark Mode
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-950 text-sm text-red-600 transition-colors"
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