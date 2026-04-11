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
  const { isSetupDone, config } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isSetupDone) {
      router.replace("/setup");
    }
  }, [isSetupDone, router]);

  if (!isSetupDone) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-background/80 backdrop-blur-md px-6 py-4">
          <MonthSelector />
          {config && (
            <span className="text-sm text-muted-foreground">
              {config.displayName}
            </span>
          )}
        </header>
        {/* Page content */}
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
