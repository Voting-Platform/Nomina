import Link from "next/link";
import { CirclePlus, LayoutDashboard, LogOut, Vote } from "lucide-react";

import { auth0 } from "@/lib/auth0";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-zinc-900">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 text-white">
              <Vote className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold tracking-wide">Nomina</span>
          </Link>

          <div className="hidden items-center gap-2 sm:flex">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">Home</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/polls/create">
                <CirclePlus className="h-4 w-4" />
                Create Poll
              </Link>
            </Button>
          </div>
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
                className="rounded-full ring-offset-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                aria-label="Open profile menu"
              >
                <Avatar className="h-10 w-10 border border-zinc-200">
                  <AvatarImage src={user.picture ?? ""} alt={user.name ?? "User"} />
                  <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="space-y-0.5">
                <p className="text-sm font-medium text-zinc-900">{user.name ?? "User"}</p>
                <p className="text-xs text-zinc-500">{user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/auth/logout" className="text-red-600 focus:text-red-700">
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
