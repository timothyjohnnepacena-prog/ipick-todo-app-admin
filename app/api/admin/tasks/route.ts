import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface SafeTask {
    _id: string;
    text: string;
    listId: string;
    listName: string;
    displayName: string;
    completed: boolean;
    createdAt: Date | null;
    completedAt: Date | null;
    order: number;
}

// GET /api/admin/tasks — Fetch all tasks with owner display names
export async function GET(): Promise<NextResponse> {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const client = await clientPromise;
        const db = client.db("kanban_db");

        const tasks = await db.collection("tasks").aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userEmail",
                    foreignField: "email",
                    as: "authorDetails",
                },
            },
            {
                $lookup: {
                    from: "lists",
                    let: { listId: "$listId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", { $toObjectId: "$$listId" }],
                                },
                            },
                        },
                    ],
                    as: "listDetails",
                },
            },
            {
                $addFields: {
                    displayName: {
                        $ifNull: [
                            { $arrayElemAt: ["$authorDetails.nickname", 0] },
                            { $arrayElemAt: ["$authorDetails.name", 0] },
                            "Unknown",
                        ],
                    },
                    listName: {
                        $ifNull: [
                            "$listName",
                            { $arrayElemAt: ["$listDetails.name", 0] },
                            "Deleted List",
                        ],
                    },
                },
            },
            { $project: { userEmail: 0, authorDetails: 0, listDetails: 0 } },
            { $sort: { createdAt: -1 } },
        ]).toArray();

        const safeTasks: SafeTask[] = tasks.map((task) => ({
            _id: task._id.toString(),
            text: (task.text as string) || "",
            listId: (task.listId as string) || "",
            listName: (task.listName as string) || "Deleted List",
            displayName: (task.displayName as string) || "Unknown",
            completed: !!task.completed,
            createdAt: (task.createdAt as Date) || null,
            completedAt: (task.completedAt as Date) || null,
            order: task.order as number,
        }));

        return NextResponse.json({ data: safeTasks });
    } catch (err) {
        console.error("GET /api/admin/tasks error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH /api/admin/tasks — Edit a task's text
export async function PATCH(request: NextRequest): Promise<NextResponse> {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const { taskId, newText } = await request.json();

        if (!taskId || !ObjectId.isValid(taskId)) {
            return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
        }

        const safeText = typeof newText === "string" ? newText.replace(/[<>]/g, "").trim().slice(0, 500) : "";
        if (!safeText) {
            return NextResponse.json({ error: "Task text is required" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db("kanban_db");

        const result = await db.collection("tasks").updateOne(
            { _id: new ObjectId(taskId) },
            { $set: { text: safeText } }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("PATCH /api/admin/tasks error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/admin/tasks — Delete a task
export async function DELETE(request: NextRequest): Promise<NextResponse> {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const { taskId } = await request.json();

        if (!taskId || !ObjectId.isValid(taskId)) {
            return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db("kanban_db");

        const result = await db.collection("tasks").deleteOne({ _id: new ObjectId(taskId) });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("DELETE /api/admin/tasks error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
