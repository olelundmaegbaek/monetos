"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Target,
  List,
  Calculator,
  Upload,
  Settings,
  User,
  Globe,
  ChevronLeft,
  ChevronRight,
  Eye,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navItems = [
  { href: "/", icon: LayoutDashboard, labelDA: "Oversigt", labelEN: "Dashboard" },
  { href: "/income", icon: TrendingUp, labelDA: "Indkomst", labelEN: "Income" },
  { href: "/expenses", icon: TrendingDown, labelDA: "Udgifter", labelEN: "Expenses" },
  { href: "/budget", icon: Target, labelDA: "Budget", labelEN: "Budget" },
  { href: "/overblik", icon: Eye, labelDA: "Overblik", labelEN: "Overview" },
  { href: "/transactions", icon: List, labelDA: "Transaktioner", labelEN: "Transactions" },
  { href: "/tax", icon: Calculator, labelDA: "Skat", labelEN: "Tax" },
  { href: "/import", icon: Upload, labelDA: "Import", labelEN: "Import" },
  { href: "/profile", icon: User, labelDA: "Profil", labelEN: "Profile" },
  { href: "/settings", icon: Settings, labelDA: "Indstillinger", labelEN: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { config, locale, setLocale } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-card h-screen sticky top-0 transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <h1 className="font-bold text-lg">monetos.me</h1>
              {config && (
                <p className="text-xs text-muted-foreground">{config.displayName}</p>
              )}
            </div>
          </div>
        ) : (
          <Coins className="h-5 w-5 text-emerald-600 mx-auto" />
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const label = locale === "da" ? item.labelDA : item.labelEN;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Language switcher */}
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocale(locale === "da" ? "en" : "da")}
          className="w-full justify-start gap-2"
        >
          <Globe className="h-4 w-4" />
          {!collapsed && (locale === "da" ? "English" : "Dansk")}
        </Button>
      </div>
    </aside>
  );
}
