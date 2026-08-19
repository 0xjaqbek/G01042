import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { vehicleIncidents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  const incidents = userId
    ? await db
        .select()
        .from(vehicleIncidents)
        .where(eq(vehicleIncidents.userId, parseInt(userId)))
        .orderBy(desc(vehicleIncidents.createdAt))
    : await db
        .select()
        .from(vehicleIncidents)
        .orderBy(desc(vehicleIncidents.createdAt));

  return NextResponse.json({ incidents });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { userId, date, type, severity, description, location, mileage, actionTaken } =
    body;

  const [incident] = await db
    .insert(vehicleIncidents)
    .values({
      userId: parseInt(userId),
      date,
      type,
      severity: severity as "info" | "minor" | "major" | "critical",
      description,
      location: location || null,
      mileage: mileage || null,
      actionTaken: actionTaken || null,
    })
    .returning();

  return NextResponse.json({ incident });
}
