import { NextResponse } from "next/server";
import { db } from "@/db";
import { materials } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allMaterials = await db
    .select()
    .from(materials)
    .where(eq(materials.isActive, true));

  return NextResponse.json({ materials: allMaterials });
}
