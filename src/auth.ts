import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { verifyUser } from "@/lib/api/server/user/verifyUser";
import { getDBUser } from "@/lib/api/server/user/getDBUser";
import type { UserRole } from "@/types";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: {
    strategy: "jwt",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Runs only on first sign-in — embed DB user data into the token.
        // Auth.js v5 sets user.id to an internal UUID; we must replace it
        // with the MongoDB ObjectId so server actions can query by createdBy.
        const dbUser = await getDBUser(user.email!);
        if (dbUser) {
          token.id = dbUser._id;
          token.role = dbUser.role;
          token.picture = dbUser.picture;
        } else {
          // verifyUser should have created the user already; if not found
          // here, clear token.id so requireAuth() rejects cleanly instead
          // of passing the Auth.js UUID into MongoDB queries.
          token.id = undefined;
        }
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role as UserRole,
          image: token.picture as string,
        },
      };
    },
    async signIn({ user }) {
      const isAllowedToSignIn = await verifyUser(user);
      if (!isAllowedToSignIn) return false;
      return true;
    },
  },
  secret: process.env.AUTH_SECRET,
});
