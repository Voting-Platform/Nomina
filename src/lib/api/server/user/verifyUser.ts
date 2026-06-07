import "server-only";
import { connectDB } from "@/config";
import { User } from "@/models";
import type { AdapterUser } from "next-auth/adapters";
import type { User as UserType } from "next-auth";

export async function verifyUser(user: UserType | AdapterUser): Promise<boolean> {
    await connectDB();
    const existingUser = await User.findOne({ email: user.email });
    if (!existingUser) {
        // name is required — fall back to the email prefix if Google doesn't
        // provide a display name, to prevent a Mongoose validation error.
        await new User({
            name: user.name ?? user.email?.split("@")[0] ?? "User",
            email: user.email,
            googleId: user.id,
            picture: user.image,
        }).save();
    }

    // To restrict sign-in, add conditions here before returning true.
    // Examples:
    //   Domain allowlist:  if (!user.email?.endsWith("@yourcompany.com")) return false;
    //   Pre-approved only: if (!existingUser?.isApproved) return false;
    return true;
}
