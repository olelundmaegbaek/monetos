"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { MonthSelector } from "@/components/layout/month-selector";
import { useApp } from "@/components/providers/app-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSetupDone, isLoading, config } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isSetupDone) {
      router.replace("/setup");
    }
  }, [isLoading, isSetupDone, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Indlæser...</div>
      </div>
    );
  }

  if (!isSetupDone) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/40 bg-background/75 backdrop-blur-xl px-6 py-3">
          <MonthSelector />
        </header>
        {/* Page content */}
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
