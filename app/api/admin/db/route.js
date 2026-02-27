import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function GET(request) {
  try {
    const client = await clientPromise;
    const db = client.db("kanban_db");
    const { searchParams } = new URL(request.url);
    const collectionName = searchParams.get("collection");

    if (!collectionName) {
      const collections = await db.listCollections().toArray();
      const stats = await db.command({ dbStats: 1 });
      return NextResponse.json({ 
        collections: collections.map(c => c.name), 
        stats 
      });
    }

    const data = await db.collection(collectionName).find({}).limit(50).toArray();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { collection, id } = await request.json();
    const client = await clientPromise;
    const db = client.db("kanban_db");

    await db.collection(collection).deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}