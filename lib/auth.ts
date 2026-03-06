import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

interface AdminCheckResult {
    error: NextResponse | null;
    session: Session | null;
}


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
