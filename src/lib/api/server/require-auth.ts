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

// Returns the current session user or throws "Unauthorized".
// Also rejects sessions where user.id isn't a real MongoDB ObjectId
// (Auth.js can issue a UUID on first sign-in before the DB write completes).
export async function requireAuth(): Promise<AuthUser> {
    const session = await auth();
    if (!session?.user?.id || !Types.ObjectId.isValid(session.user.id)) {
        throw new Error("Unauthorized");
    }
    return session.user as AuthUser;
}

// Same as requireAuth but also checks the user's role. Throws "Forbidden" if it doesn't match.
export async function requireRole(role: UserRole): Promise<AuthUser> {
    const user = await requireAuth();
    if (user.role !== role) {
        throw new Error("Forbidden");
    }
    return user;
}

// Validates that `id` is a 24-char hex MongoDB ObjectId before it reaches
// Mongoose. Throws "<Label> not found" instead of a raw CastError.
export function assertObjectId(id: string, label = "Resource"): void {
    if (!Types.ObjectId.isValid(id)) {
        throw new Error(`${label} not found`);
    }
}
