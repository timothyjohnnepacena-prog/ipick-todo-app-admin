// lib/auth.ts — Shared admin session verification for API routes
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

interface AdminCheckResult {
    error: NextResponse | null;
    session: Session | null;
}

/**
 * Verify that the request is from an authenticated admin user.
 * Returns the session if valid, or a NextResponse with 401 status.
 */
export async function requireAdmin(): Promise<AdminCheckResult> {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.isAdmin) {
        return {
            error: NextResponse.json(
                { error: "Unauthorized — admin access required" },
                { status: 401 }
            ),
            session: null,
        };
    }

    return { error: null, session };
}
