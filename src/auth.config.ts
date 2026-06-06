import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
        error: "/error",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            // Auth.js v5 can assign an internal UUID to user.id when the DB
            // lookup fails on first sign-in. Only treat a 24-char hex string
            // (MongoDB ObjectId) as a valid session.
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
