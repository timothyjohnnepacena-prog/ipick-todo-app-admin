import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface SafeUser {
    _id: string;
    name: string;
    nickname: string;
    username: string;
    email: string;
    isAdmin: boolean;
    isVerifiedByAdmin: boolean;
    createdAt: Date | null;
}

// GET /api/admin/users — Fetch all users (sanitized, no passwords)
export async function GET(): Promise<NextResponse> {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const client = await clientPromise;
        const db = client.db("kanban_db");

        const users = await db.collection("users").find({}).toArray();

        const safeUsers: SafeUser[] = users.map((user) => ({
            _id: user._id.toString(),
            name: (user.name as string) || "",
            nickname: (user.nickname as string) || "",
            username: (user.username as string) || "",
            email: (user.email as string) || "",
            isAdmin: !!user.isAdmin,
            isVerifiedByAdmin: user.isVerifiedByAdmin === true,
            createdAt: (user.createdAt as Date) || null,
        }));

        return NextResponse.json({ data: safeUsers });
    } catch (err) {
        console.error("GET /api/admin/users error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH /api/admin/users — Approve or reject a user account
export async function PATCH(request: NextRequest): Promise<NextResponse> {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const { userId, action } = await request.json();

        if (!userId || !ObjectId.isValid(userId)) {
            return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
        }

        if (!["approve", "reject"].includes(action)) {
            return NextResponse.json({ error: "Invalid action. Use 'approve' or 'reject'." }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db("kanban_db");

        const result = await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            { $set: { isVerifiedByAdmin: action === "approve" } }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, action });
    } catch (err) {
        console.error("PATCH /api/admin/users error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/admin/users — Remove a user and all their data
export async function DELETE(request: NextRequest): Promise<NextResponse> {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const { userId } = await request.json();

        if (!userId || !ObjectId.isValid(userId)) {
            return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db("kanban_db");

        const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.isAdmin === true) {
            return NextResponse.json({ error: "Cannot delete admin accounts" }, { status: 403 });
        }

        await Promise.all([
            db.collection("tasks").deleteMany({ userEmail: user.email }),
            db.collection("lists").deleteMany({ userEmail: user.email }),
            db.collection("activity_logs").deleteMany({ userEmail: user.email }),
            db.collection("users").deleteOne({ _id: new ObjectId(userId) }),
        ]);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("DELETE /api/admin/users error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
