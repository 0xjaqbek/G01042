import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, vehicleIncidents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!session.user.isLeader && (!userId || userId !== session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const incidents = userId
    ? await db
        .select()
        .from(vehicleIncidents)
        .where(eq(vehicleIncidents.userId, parseInt(userId)))
        .orderBy(desc(vehicleIncidents.createdAt))
    : await db
        .select({
          id: vehicleIncidents.id,
          userId: vehicleIncidents.userId,
          userName: users.name,
          date: vehicleIncidents.date,
          type: vehicleIncidents.type,
          description: vehicleIncidents.description,
          severity: vehicleIncidents.severity,
          location: vehicleIncidents.location,
          mileage: vehicleIncidents.mileage,
          actionTaken: vehicleIncidents.actionTaken,
          isResolved: vehicleIncidents.isResolved,
          createdAt: vehicleIncidents.createdAt,
        })
        .from(vehicleIncidents)
        .innerJoin(users, eq(vehicleIncidents.userId, users.id))
        .orderBy(desc(vehicleIncidents.createdAt));

  return NextResponse.json({ incidents });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.isLeader) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { incidentId, isResolved } = await request.json();
  if (!incidentId || typeof isResolved !== "boolean") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const [incident] = await db
    .update(vehicleIncidents)
    .set({ isResolved })
    .where(eq(vehicleIncidents.id, Number(incidentId)))
    .returning({ id: vehicleIncidents.id, isResolved: vehicleIncidents.isResolved });

  return incident
    ? NextResponse.json({ incident })
    : NextResponse.json({ error: "Not found" }, { status: 404 });
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
