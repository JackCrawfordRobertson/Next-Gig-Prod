"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation"; // 1) Import usePathname
import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function SidebarLayout({ children }) {
  const { data: session } = useSession();
  const pathname = usePathname(); // 2) Get current URL path

  return (
    <ThemeProvider>
      <SidebarProvider>
        <div className="flex h-screen w-screen overflow-hidden">
          <Sidebar className="h-full w-64 flex flex-col border-r shadow-lg ">
            <SidebarContent className="flex flex-col flex-1">
              <div className="p-6 border-b flex justify-between items-center">
                <h1 className="text-xl font-bold tracking-wide flex items-center gap-2">
                  Next Gig
                  <Image src="/Blue_LogoV2.svg" alt="Logo" width={25} height={25} />
                </h1>
                <ThemeToggle />
              </div>

              <SidebarMenu className="p-4 space-y-3">
                <SidebarMenuItem>
                  {/* 3) Conditionally apply 'active' classes if pathname matches */}
                  <Link
                    href="/dashboard"
                    className={`block px-4 py-2 rounded transition ${
                      pathname === "/dashboard" ? "bg-primary text-white" : ""
                    }`}
                  >
                    Dashboard
                  </Link>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <Link
                    href="/linkedin"
                    className={`block px-4 py-2 rounded transition ${
                      pathname === "/linkedin" ? "bg-primary text-white" : ""
                    }`}
                  >
                    LinkedIn Jobs
                  </Link>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <Link
                    href="/unjobs"
                    className={`block px-4 py-2 rounded transition ${
                      pathname === "/unjobs" ? "bg-primary text-white" : ""
                    }`}
                  >
                    UN Jobs
                  </Link>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <Link
                    href="/workable"
                    className={`block px-4 py-2 rounded transition ${
                      pathname === "/workable" ? "bg-primary text-white" : ""
                    }`}
                  >
                    Workable
                  </Link>
                </SidebarMenuItem>
              </SidebarMenu>

              <div className="h-[1px] mx-6 my-4 border-t"></div>

              {/* Profile and Sign Out at the bottom */}
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
                <button
                  onClick={() => signOut()}
                  className="w-full bg-red-500 text-white py-2 rounded-md"
                >
                  Sign Out
                </button>
              </div>
            </SidebarContent>
          </Sidebar>

          <main className="flex-1 h-full overflow-auto p-0">{children}</main>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}