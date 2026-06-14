import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
        error: "/error",
    },
    callbacks: {
        // Must live here (not only in auth.ts) so the proxy middleware can
        // map token.id → session.user.id before the authorized check runs.
        // Without this, the middleware sees the raw Auth.js UUID instead of
        // the MongoDB ObjectId, so hasValidId is always false → redirect loop.
        session({ session, token }) {
            return {
                ...session,
                user: {
                    ...session.user,
                    id: token.id as string,
                },
            };
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const hasValidId = /^[a-f\d]{24}$/i.test(auth?.user?.id ?? "");
            const { pathname } = nextUrl;
            const isProtected =
                pathname.startsWith("/dashboard") ||
                pathname.startsWith("/elections");

            if (isProtected && (!isLoggedIn || !hasValidId)) {
                return Response.redirect(new URL("/login", nextUrl));
            }
            return true;
        },
    },
    providers: [],
} satisfies NextAuthConfig;
