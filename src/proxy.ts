import { NextResponse } from "next/server";
import { auth0 } from "./lib/auth0";

// Centralized configuration for protected routes
// In the future, this could be imported from a config file
const PROTECTED_ROUTES = ["/dashboard", "/polls/create"];

export async function proxy(request: Request) {
  const url = new URL(request.url);

  // 1. If this is an Auth0 internal API route, surrender control fully to the SDK.
  // This completely avoids the "Double getSession()" performance hit.
  if (url.pathname.startsWith("/auth/")) {
    return await auth0.middleware(request);
  }

  // 2. Array of routes that require physical login to access
  const isProtected = PROTECTED_ROUTES.some((route) => url.pathname.startsWith(route));

  // 3. Protect route: Force redirect to Auth0 login if no session!
  if (isProtected) {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  // 4. Proceed as normal for public routes or authenticated users
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};