"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  Vote,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components";
import { signOutAction } from "@/lib/actions/auth";

const SIDEBAR_OPEN = 200;
const SIDEBAR_CLOSED = 68;

type SidebarUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
} | null;

type SidebarProps = {
  user: SidebarUser;
  children: React.ReactNode;
};

function getInitials(name?: string | null, email?: string | null) {
  if (name?.trim()) {
    return name
      .split(" ")
      .slice(0, 2)
      .map((t) => t[0]?.toUpperCase())
      .join("");
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "U";
}

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
] as const;

export function Sidebar({ user, children }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const activeHref = useMemo(() => {
    const sorted = [...NAV_LINKS].sort((a, b) => b.href.length - a.href.length);
    return sorted.find(
      (l) => pathname === l.href || pathname.startsWith(l.href + "/"),
    )?.href;
  }, [pathname]);

  const sidebarW = collapsed ? SIDEBAR_CLOSED : SIDEBAR_OPEN;

  if (!user) {
    return (
      <main className="min-h-screen bg-[var(--background)]">{children}</main>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {/* ── Sidebar ── */}
      <aside
        style={{ width: sidebarW }}
        className="fixed left-0 top-0 h-screen flex flex-col bg-[var(--surface)] border-r border-[var(--border)] overflow-hidden z-30 transition-[width] duration-300 ease-in-out"
      >
        {/* Header */}
        <div className="flex items-center h-16 px-3 border-b border-[var(--border)] shrink-0 justify-between gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 min-w-0 text-[var(--text-primary)]"
          >
            {!collapsed && (
              <>
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-white">
                  <Vote className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold tracking-wide whitespace-nowrap overflow-hidden">
                  Nomina
                </span>
              </>
            )}
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setCollapsed((p) => !p)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 py-4 overflow-y-auto overflow-x-hidden">
          <ul className="space-y-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = activeHref === href;
              return (
                <li key={href}>
                  <Button
                    variant={active ? "default" : "ghost"}
                    size="sm"
                    asChild
                    className={`w-full transition-none ${collapsed ? "justify-center px-0" : "justify-start"}`}
                  >
                    <Link href={href} className="flex items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <span className="whitespace-nowrap">{label}</span>
                      )}
                    </Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Profile */}
        <div className="px-2 py-3 border-t border-[var(--border)] shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full flex items-center rounded-lg p-2 hover:bg-[var(--surface-hover)] transition-colors text-left ${collapsed ? "justify-center" : "gap-3"}`}
              >
                <Avatar className="h-8 w-8 shrink-0 border border-[var(--border)]">
                  <AvatarImage src={user.image ?? ""} alt={user.name ?? "User"} />
                  <AvatarFallback>
                    {getInitials(user.name, user.email)}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                      {user.name ?? "User"}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] truncate">
                      {user.email}
                    </p>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel className="space-y-0.5">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {user.name ?? "User"}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">{user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-[var(--destructive)] focus:text-[var(--destructive-hover)] cursor-pointer"
                onClick={() => signOutAction()}
              >
                <LogOut className="h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main
        style={{ marginLeft: sidebarW }}
        className="flex-1 min-w-0 transition-[margin] duration-200 ease-in-out bg-[var(--background)]"
      >
        {children}
      </main>
    </div>
  );
}
