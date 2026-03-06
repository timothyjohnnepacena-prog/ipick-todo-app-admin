import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface SafeList {
    _id: string;
    name: string;
    ownerName: string;
    taskCount: number;
    completedCount: number;
}

interface TaskCountEntry {
    _id: string;
    total: number;
    completed: number;
}

// GET /api/admin/lists — Fetch all lists with owner info and task counts
export async function GET(): Promise<NextResponse> {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const client = await clientPromise;
        const db = client.db("kanban_db");

        const lists = await db.collection("lists").aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userEmail",
                    foreignField: "email",
                    as: "owner",
                },
            },
            {
                $addFields: {
                    ownerName: {
                        $ifNull: [
                            { $arrayElemAt: ["$owner.nickname", 0] },
                            { $arrayElemAt: ["$owner.name", 0] },
                            "Unknown",
                        ],
                    },
                },
            },
            { $project: { owner: 0, userEmail: 0 } },
        ]).toArray();

        const taskCounts = await db.collection("tasks").aggregate([
            { $group: { _id: "$listId", total: { $sum: 1 }, completed: { $sum: { $cond: ["$completed", 1, 0] } } } },
        ]).toArray();

        const countMap: Record<string, { total: number; completed: number }> = {};
        (taskCounts as unknown as TaskCountEntry[]).forEach((tc) => {
            countMap[tc._id] = { total: tc.total, completed: tc.completed };
        });

        const safeLists: SafeList[] = lists.map((list) => ({
            _id: list._id.toString(),
            name: (list.name as string) || "",
            ownerName: (list.ownerName as string) || "Unknown",
            taskCount: countMap[list._id.toString()]?.total || 0,
            completedCount: countMap[list._id.toString()]?.completed || 0,
        }));

        return NextResponse.json({ data: safeLists });
    } catch (err) {
        console.error("GET /api/admin/lists error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH /api/admin/lists — Rename a list
export async function PATCH(request: NextRequest): Promise<NextResponse> {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const { listId, newName } = await request.json();

        if (!listId || !ObjectId.isValid(listId)) {
            return NextResponse.json({ error: "Invalid list ID" }, { status: 400 });
        }

        const safeName = typeof newName === "string" ? newName.replace(/[<>]/g, "").trim().slice(0, 100) : "";
        if (!safeName) {
            return NextResponse.json({ error: "List name is required" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db("kanban_db");

        const result = await db.collection("lists").updateOne(
            { _id: new ObjectId(listId) },
            { $set: { name: safeName } }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: "List not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("PATCH /api/admin/lists error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/admin/lists — Delete a list and its tasks
export async function DELETE(request: NextRequest): Promise<NextResponse> {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const { listId } = await request.json();

        if (!listId || !ObjectId.isValid(listId)) {
            return NextResponse.json({ error: "Invalid list ID" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db("kanban_db");

        const list = await db.collection("lists").findOne({ _id: new ObjectId(listId) });
        if (!list) {
            return NextResponse.json({ error: "List not found" }, { status: 404 });
        }

        await Promise.all([
            db.collection("tasks").deleteMany({ listId: listId }),
            db.collection("lists").deleteOne({ _id: new ObjectId(listId) }),
        ]);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("DELETE /api/admin/lists error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
