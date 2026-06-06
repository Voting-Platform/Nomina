import "server-only";
import { auth } from "@/auth";
import { Types } from "mongoose";
import type { UserRole } from "@/types";

type AuthUser = {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: UserRole;
};

export async function requireAuth(): Promise<AuthUser> {
    const session = await auth();
    // Auth.js v5 may populate user.id with an internal UUID when the DB
    // lookup fails on first sign-in. Reject any id that isn't a valid
    // MongoDB ObjectId so it never reaches Mongoose queries.
    if (!session?.user?.id || !Types.ObjectId.isValid(session.user.id)) {
        throw new Error("Unauthorized");
    }
    return session.user as AuthUser;
}

export async function requireRole(role: UserRole): Promise<AuthUser> {
    const user = await requireAuth();
    if (user.role !== role) {
        throw new Error("Forbidden");
    }
    return user;
}
