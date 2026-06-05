import "server-only";
import { auth } from "@/auth";
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
    if (!session?.user?.id) {
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
