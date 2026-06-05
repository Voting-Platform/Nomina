import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
        error: "/error",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const { pathname } = nextUrl;
            const isProtected =
                pathname.startsWith("/dashboard") ||
                pathname.startsWith("/elections");

            if (isProtected && !isLoggedIn) {
                return Response.redirect(new URL("/login", nextUrl));
            }
            return true;
        },
    },
    providers: [],
} satisfies NextAuthConfig;
