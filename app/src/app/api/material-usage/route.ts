import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { materialUsage, materials } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const userId = searchParams.get("userId");

  const entries = await db
    .select({
      id: materialUsage.id,
      materialId: materialUsage.materialId,
      materialName: materials.name,
      quantity: materialUsage.quantity,
      notes: materialUsage.notes,
    })
    .from(materialUsage)
    .innerJoin(materials, eq(materialUsage.materialId, materials.id))
    .where(
      userId
        ? and(
            eq(materialUsage.date, date),
            eq(materialUsage.userId, parseInt(userId))
          )
        : eq(materialUsage.date, date)
    );

  return NextResponse.json({ entries });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { userId, date, materialId, quantity, notes } = body;

  const [entry] = await db
    .insert(materialUsage)
    .values({
      userId: parseInt(userId),
      date,
      materialId: parseInt(materialId),
      quantity: parseInt(quantity),
      notes: notes || null,
    })
    .returning();

  return NextResponse.json({ id: entry.id });
}
