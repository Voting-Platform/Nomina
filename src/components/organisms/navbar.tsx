import Link from "next/link";
import { CirclePlus, LayoutDashboard, LogOut, Vote } from "lucide-react";

import { auth0 } from "@/lib/auth0";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/atoms/avatar";
import { Button } from "@/components/atoms/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/molecules/dropdown-menu";

function getInitials(name?: string, email?: string) {
  if (name && name.trim().length > 0) {
    return name
      .split(" ")
      .slice(0, 2)
      .map((token) => token[0]?.toUpperCase())
      .join("");
  }

  if (email) {
    return email.slice(0, 2).toUpperCase();
  }

  return "U";
}

export async function Navbar() {
  const session = await auth0.getSession();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md">
      <nav className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 sm:gap-8">
          <Link href="/" className="flex items-center gap-2 text-[var(--text-primary)]">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-white">
              <Vote className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold tracking-wide">Nomina</span>
          </Link>

          {user && (
            <div className="hidden items-center gap-1 sm:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/elections/create">
                  <CirclePlus className="h-4 w-4" />
                  Create Election
                </Link>
              </Button>
            </div>
          )}
        </div>

        {!user ? (
          <Button asChild>
            <a href="/auth/login?connection=google-oauth2">Continue with Google</a>
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-full ring-offset-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/20"
                aria-label="Open profile menu"
              >
                <Avatar className="h-10 w-10 border border-[var(--border)]">
                  <AvatarImage src={user.picture ?? ""} alt={user.name ?? "User"} />
                  <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="space-y-0.5">
                <p className="text-sm font-medium text-[var(--text-primary)]">{user.name ?? "User"}</p>
                <p className="text-xs text-[var(--text-secondary)]">{user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/auth/logout" className="text-[var(--destructive)] focus:text-[var(--destructive-hover)]">
                  <LogOut className="h-4 w-4" />
                  Log out
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </nav>
    </header>
  );
}
