"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar, SidebarProvider, SidebarContent, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useEffect, useState } from "react";

export default function SidebarLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // ✅ Prevents infinite loop by checking "isMounted"
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router, isMounted]);

  // ✅ Prevents blank screen by ensuring it's fully mounted
  if (!isMounted) return null;

  // ✅ Show loading screen while fetching session
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // ✅ Only render Sidebar if user is authenticated
  if (status !== "authenticated") return null;

  return (
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

              {/* User Profile & Sign Out */}
              <div className="mt-auto p-6 flex flex-col items-center gap-3">
                {session?.user?.image ? (
                  <div className="w-14 h-14 rounded-full border overflow-hidden shadow-md">
                    <Image
                      src={session.user.image}
                      alt="User Avatar"
                      width={56}
                      height={56}
                      className="rounded-full"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full border overflow-hidden shadow-md">
                    <Image src="/Memoji.png" alt="User Avatar" width={56} height={56} />
                  </div>
                )}

                <p className="text-sm">{session?.user?.name || "User"}</p>

                {/* Sign Out Button */}
                <button
                  onClick={() => signOut()}
                  className="w-full bg-red-500 text-white py-2 rounded-md"
                >
                  Sign Out
                </button>
              </div>
            </SidebarContent>
          </Sidebar>

          {/* Main Content */}
          <main className="flex-1 h-full overflow-auto p-0">{children}</main>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}