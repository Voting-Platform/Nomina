# Auth Login Flow and Future Operations Guide

This project uses Auth0 with Next.js App Router and MongoDB.

## Quick Summary

- Authentication engine is centralized in `src/lib/auth0.ts`.
- Auth routes (`/auth/login`, `/auth/callback`, `/auth/logout`) are handled by Auth0 SDK through middleware in `src/proxy.ts`.
- Logged-in identity is mapped to your own Mongo `User` document in `src/actions/user.ts`.
- UI login state is currently driven from database user sync in `src/app/page.tsx`.

## File-by-File Responsibility

### 1) Auth0 Client

File: `src/lib/auth0.ts`

```ts
import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client();
```

What it does:
- Creates one reusable Auth0 server client instance.
- Provides `getSession()` and middleware handling for auth routes.

### 2) Proxy Middleware (Login Routing + Protected Route Guard)

File: `src/proxy.ts`

Key behavior:
- For all routes starting with `/auth/`, it calls `auth0.middleware(request)`.
- For protected routes (`/dashboard`, `/polls/create`), it checks session.
- If no session, redirects to `/auth/login`.

Relevant logic:

```ts
if (url.pathname.startsWith("/auth/")) {
  return await auth0.middleware(request);
}

const isProtected = PROTECTED_ROUTES.some((route) => url.pathname.startsWith(route));

if (isProtected) {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
}
```

### 3) Login Trigger from UI

File: `src/app/page.tsx` and `src/components/organisms/navbar.tsx`

Login starts when user clicks:

```tsx
href="/auth/login?connection=google-oauth2"
```

What happens next:
1. Browser hits `/auth/login`.
2. `src/proxy.ts` delegates to `auth0.middleware(request)`.
3. Auth0 login + callback complete.
4. Auth0 SDK stores session cookie.
5. Future server requests can read user session via `auth0.getSession()`.

### 4) Sync Auth0 User to Mongo User

File: `src/actions/user.ts`

Core behavior:
- Reads session via `auth0.getSession()`.
- Connects to MongoDB (`connectDB`).
- Looks up user by `auth0Id`.
- Creates user on first login.
- Handles duplicate key race condition (`11000`).
- Optionally refreshes stale profile data.

Why this is useful:
- You store app-level user data and roles in Mongo even though auth is in Auth0.
- All future operations can use your internal `User` model.

### 5) Database + User Model

Files:
- `src/lib/db.ts`
- `src/models/User.ts`

Current user fields:
- `name`
- `email` (unique)
- `auth0Id` (unique)
- `picture`
- `role` (`admin` or `user`)

## New Navbar (shadcn-style)

A professional navbar has been added in:
- `src/components/organisms/navbar.tsx`

It includes:
- Brand section
- Navigation links
- Login button when user is not logged in
- Profile avatar when logged in
- Dropdown menu with logout action

UI primitive files added:
- `src/components/ui/button.tsx`
- `src/components/ui/avatar.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/lib/utils.ts` (`cn` helper)

## How to Use This in Future Operations

## A) Protect Additional Routes

Update `PROTECTED_ROUTES` in `src/proxy.ts`:

```ts
const PROTECTED_ROUTES = ["/dashboard", "/polls/create", "/admin", "/settings"];
```

## B) Get Current Logged-In App User in Server Components

Use:

```ts
const dbUser = await getOrSyncDbUser();
```

This gives your Mongo user record (or `null` if anonymous).

## C) Role-Based Authorization (Admin)

Recommended pattern in server code:

```ts
const dbUser = await getOrSyncDbUser();
if (!dbUser) {
  // redirect to login or throw unauthorized
}
if (dbUser.role !== "admin") {
  // reject access
}
```

## D) Server Actions for Authenticated Mutations

In any server action:

```ts
"use server";

import { getOrSyncDbUser } from "@/actions/user";

export async function createSomething(data: FormData) {
  const dbUser = await getOrSyncDbUser();
  if (!dbUser) throw new Error("Unauthorized");

  // proceed with dbUser._id as owner/creator
}
```

## E) Show Identity in UI

In server-rendered components:
- Use `auth0.getSession()` when you only need identity display.
- Use `getOrSyncDbUser()` when you also need internal role/DB data.

## Recommended Operational Rules

1. Keep auth session checks server-side.
2. Use middleware for route-level protection.
3. Use `getOrSyncDbUser()` as the single source for app user data.
4. Use DB role checks for authorization, not just Auth0 presence.
5. Keep public pages free from accidental static auth calls unless route is forced dynamic.

## Yarn Commands

Install dependencies (if needed):

```bash
yarn install
```

Run dev server:

```bash
yarn dev
```

Build production:

```bash
yarn build
```

Run ESLint:

```bash
yarn lint
```

On Windows PowerShell with restricted policy, use:

```bash
yarn.cmd build
yarn.cmd lint
```
