import "server-only";
import { connectDB } from "@/config";
import { User } from "@/models";
import type { UserRole } from "@/types";

export async function getDBUser(email: string) {
    await connectDB();
    const user = await User.findOne({ email }).lean();
    if (!user) return null;
    return {
        _id: (user._id as { toString(): string }).toString(),
        name: user.name as string,
        email: user.email as string,
        picture: (user.picture as string) ?? null,
        role: user.role as UserRole,
    };
}
