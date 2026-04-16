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
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navGroups = [
  {
    items: [
      { href: "/", icon: LayoutDashboard, labelDA: "Oversigt", labelEN: "Dashboard" },
      { href: "/income", icon: TrendingUp, labelDA: "Indkomst", labelEN: "Income" },
      { href: "/expenses", icon: TrendingDown, labelDA: "Udgifter", labelEN: "Expenses" },
      { href: "/budget", icon: Target, labelDA: "Budget", labelEN: "Budget" },
      { href: "/overblik", icon: Eye, labelDA: "Overblik", labelEN: "Overview" },
    ],
  },
  {
    items: [
      { href: "/transactions", icon: List, labelDA: "Transaktioner", labelEN: "Transactions" },
      { href: "/tax", icon: Calculator, labelDA: "Skat", labelEN: "Tax" },
      { href: "/import", icon: Upload, labelDA: "Import", labelEN: "Import" },
    ],
  },
  {
    items: [
      { href: "/profile", icon: User, labelDA: "Profil", labelEN: "Profile" },
      { href: "/settings", icon: Settings, labelDA: "Indstillinger", labelEN: "Settings" },
      { href: "/about", icon: HelpCircle, labelDA: "Om Monetos", labelEN: "About" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { config, locale, setLocale } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground h-screen sticky top-0 transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <svg
              viewBox="0 0 32 32"
              className="h-8 w-8 shrink-0"
              aria-hidden="true"
            >
              <circle cx="16" cy="16" r="14" fill="#eab308" />
              <circle cx="16" cy="16" r="14" fill="none" stroke="#ca8a04" strokeWidth="1.5" />
              <circle cx="16" cy="16" r="10.5" fill="none" stroke="#ca8a04" strokeWidth="0.75" opacity="0.5" />
              <text x="16" y="21.5" textAnchor="middle" fontFamily="serif" fontWeight="700" fontSize="16" fill="#78350f">M</text>
            </svg>
            <div>
              <h1 className="font-serif text-xl tracking-tight text-foreground">Monetos</h1>
              {config && (
                <p className="text-[11px] text-muted-foreground leading-none mt-0.5">{config.displayName}</p>
              )}
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 text-muted-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {navGroups.map((group, gi) => (
          <div key={gi} className="space-y-0.5">
            {group.items.map((item) => {
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
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150",
                    isActive
                      ? "bg-primary/8 text-primary font-semibold shadow-xs"
                      : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive && "text-primary")} />
                  {!collapsed && <span>{label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocale(locale === "da" ? "en" : "da")}
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        >
          <Globe className="h-4 w-4" />
          {!collapsed && (locale === "da" ? "English" : "Dansk")}
        </Button>
      </div>
    </aside>
  );
}
