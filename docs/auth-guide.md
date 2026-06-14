# Authentication Guide

## Overview

This project uses **NextAuth v5** (Auth.js) with:
- **Strategy**: JWT (stored in a secure HttpOnly cookie)
- **Provider**: Google OAuth only
- **Session data**: `id` (MongoDB `_id`), `role` (`UserRole` enum), `image`, `name`, `email` — all embedded in the JWT on first sign-in

---

## Architecture

```
Browser request
    │
    ▼
middleware.ts  ← Edge runtime (fast, no DB)
    │   Reads JWT cookie, calls authorized() from auth.config.ts
    │   Unauthenticated → redirect to /login
    │   Authenticated   → continue
    ▼
Server Component / Layout
    │   Can call auth() to get full session
    ▼
Server Action
    │   Calls requireAuth() — second layer, also protects direct POST calls
    │   Checks ownership (election.createdBy === user.id)
    ▼
Database
```

> **Why two layers?** Middleware protects page routes (browser GET). Server actions are
> HTTP POST endpoints that bypass the middleware matcher — `requireAuth()` inside each
> action is the only thing protecting them from direct API calls.

---

## 1. Getting the User in a Server Component

Call `auth()` from `@/auth`. It decodes the JWT cookie and returns the session synchronously.

```ts
// src/app/dashboard/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  // Middleware already redirected unauthenticated users, but this is safe to add
  if (!session) redirect("/login");

  const user = session.user;
  // user.id     — MongoDB _id string
  // user.email  — Google email
  // user.name   — Google display name
  // user.image  — avatar URL
  // user.role   — UserRole enum value from DB

  return <h1>Hello, {user.name}</h1>;
}
```

No provider needed — `auth()` is a plain async function in server components.

---

## 2. Getting the User in a Client Component

Client components cannot call `auth()` directly (server-only). Two patterns:

### Option A — Receive as prop from a server parent (recommended)

This is the pattern used by `Sidebar`. The server layout calls `auth()` once and passes
the user down. Zero extra client-server round-trips.

```ts
// src/app/some-layout.tsx  (Server Component)
import { auth } from "@/auth";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user ?? null;
  return <ClientShell user={user}>{children}</ClientShell>;
}
```

```ts
// src/components/ClientShell.tsx  ("use client")
"use client";

type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: string;
};

export function ClientShell({
  user,
  children,
}: {
  user: SessionUser | null;
  children: React.ReactNode;
}) {
  if (!user) return <>{children}</>;
  return (
    <div>
      <span>Signed in as {user.name}</span>
      {children}
    </div>
  );
}
```

### Option B — `useSession()` hook (when prop drilling is impractical)

Requires `SessionProvider` in `src/app/providers.tsx`. Add it alongside `QueryClientProvider`:

```ts
// src/app/providers.tsx
"use client";
import { SessionProvider } from "next-auth/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000 } },
  }));
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}
```

Then in any client component:

```ts
"use client";
import { useSession } from "next-auth/react";

export function ProfileBadge() {
  const { data: session, status } = useSession();
  if (status === "loading") return <Spinner />;
  if (status === "unauthenticated") return null;
  return <span>{session.user.name}</span>;
}
```

> **Tradeoff**: `useSession()` makes an extra client-side fetch to `/api/auth/session` on
> mount. Prefer prop drilling (Option A) for data that's already available at layout level.

---

## 3. Authenticating Server Actions

Every server action that reads or mutates user-owned data must call `requireAuth()` first.
It throws `"Unauthorized"` if there is no valid session, preventing unauthenticated calls.

```ts
// src/lib/api/server/election/delete-election.ts
"use server";

import { connectDB } from "@/config";
import { Election } from "@/models";
import { requireAuth } from "@/lib/api/server/require-auth";

export async function deleteElection(electionId: string) {
  // 1. Authenticate — throws if no session
  const user = await requireAuth();

  await connectDB();

  // 2. Fetch the resource
  const election = await Election.findOne({ _id: electionId, deletedAt: null });
  if (!election) throw new Error("Election not found");

  // 3. Authorise — ownership check prevents IDOR
  //    Return a generic 404 message so callers can't probe for existence
  if (election.createdBy.toString() !== user.id) {
    throw new Error("Election not found");
  }

  // 4. Mutate
  election.deletedAt = new Date();
  await election.save();

  return { success: true };
}
```

`requireAuth` lives in `src/lib/api/server/require-auth.ts` and returns:

```ts
{
  id: string;       // MongoDB _id
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
}
```

### Pattern: authenticate → fetch → authorise → mutate

Always in that order. Never skip the ownership check — without it, any authenticated user
can operate on any other user's data (IDOR vulnerability).

---

## 4. Role-Based Authorization

Use `requireRole()` to restrict an action to a specific role.

```ts
"use server";
import { requireRole } from "@/lib/api/server/require-auth";
import { UserRole } from "@/types";

// Only admins can access this
export async function adminDeleteAnyElection(electionId: string) {
  const user = await requireRole(UserRole.ADMIN); // throws "Forbidden" for non-admins
  // ...
}
```

For actions where admins bypass ownership but regular users don't:

```ts
export async function getElectionData(electionId: string) {
  const user = await requireAuth();

  const election = await Election.findOne({ _id: electionId, deletedAt: null });
  if (!election) throw new Error("Election not found");

  // Admins can see any election; regular users only see their own
  if (user.role !== UserRole.ADMIN && election.createdBy.toString() !== user.id) {
    throw new Error("Election not found");
  }

  return election;
}
```

The `UserRole` enum is at `src/types/enums/`. Current values:

| Value          | Meaning                  |
|----------------|--------------------------|
| `UserRole.USER`  | Default — election creator |
| `UserRole.ADMIN` | Platform administrator   |

---

## 5. Route Protection (Middleware)

`src/middleware.ts` runs at the **Edge** (before any server component renders) for every
request matching the `matcher`.

```ts
// src/middleware.ts
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/dashboard/:path*", "/elections/:path*"],
};
```

The `authorized` callback in `src/auth.config.ts` decides what to do:

```ts
authorized({ auth, request: { nextUrl } }) {
  const isLoggedIn = !!auth?.user;
  const isProtected =
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/elections");

  if (isProtected && !isLoggedIn) {
    return Response.redirect(new URL("/login", nextUrl));
  }
  return true;
}
```

**To protect a new route**, add it to both places:

```ts
// middleware.ts — add to matcher
matcher: ["/dashboard/:path*", "/elections/:path*", "/admin/:path*"]

// auth.config.ts — add to the pathname check
nextUrl.pathname.startsWith("/admin")
```

**Public routes** (no entry needed anywhere):
- `/` — landing page
- `/login` — sign-in page
- `/error` — auth error page
- `/api/auth/*` — NextAuth internal endpoints
- `/vote/*` — voter-facing ballot page (public by design)

---

## 6. Restricting Sign-In (Who Can Register)

By default, any Google account can sign in and gets auto-registered as `UserRole.USER`.
Edit `src/lib/api/server/user/verifyUser.ts` to gate access:

```ts
export async function verifyUser(user: UserType | AdapterUser): Promise<boolean> {
  await connectDB();
  const existingUser = await User.findOne({ email: user.email });

  // --- Option 1: Restrict to a specific domain ---
  if (!user.email?.endsWith("@yourcompany.com")) return false;

  // --- Option 2: Pre-approved list only (admin must create the user first) ---
  if (!existingUser) return false; // reject unknown accounts

  // --- Option 3: Approved flag on the user document ---
  if (!existingUser?.isApproved) return false;

  if (!existingUser) {
    await new User({ name: user.name, email: user.email, googleId: user.id, picture: user.image }).save();
  }
  return true;
}
```

`return false` redirects the user to `/error?error=AccessDenied`, which your custom error
page already handles with a user-friendly message.

---

## 7. JWT Token Lifecycle

```
First sign-in:
  Google OAuth → signIn() callback → jwt() callback (user present)
                                         └─ getDBUser(email) → DB
                                         └─ token.id, token.role, token.picture set
                                     └─ session() callback → session.user enriched
                                     └─ JWT cookie written (HttpOnly, Secure)

Subsequent requests:
  Cookie sent → jwt() callback (user absent, token reused)
              → session() callback → session.user from token
```

**Important**: The JWT is only updated on sign-in. If you change a user's role in the DB,
they must sign out and back in for the new role to take effect. For immediate role
enforcement, add a DB lookup in the `jwt` callback on every request (with caching to
avoid N+1 queries per request).
