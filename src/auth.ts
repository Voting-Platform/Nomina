import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { verifyUser } from "@/lib/api/server/user/verifyUser";
import type { UserRole } from "@/types";
import { authConfig } from "./auth.config";
import { connectDB } from "@/config";
import { User } from "@/models";

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
        // Runs only on first sign-in. Use a single atomic upsert so we
        // never end up with a failed lookup after a successful create.
        // $setOnInsert leaves existing users untouched.
        await connectDB();
        const dbUser = await User.findOneAndUpdate(
          { email: user.email },
          {
            $setOnInsert: {
              name: user.name ?? user.email?.split("@")[0] ?? "User",
              email: user.email,
              googleId: user.id,
              picture: user.image,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean<{ _id: { toString(): string }; role: UserRole; picture?: string }>();

        if (dbUser) {
          token.id = dbUser._id.toString();
          token.role = dbUser.role;
          token.picture = dbUser.picture ?? null;
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
