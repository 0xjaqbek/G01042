import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { announcements, announcementAcks, users } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.isLeader) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allUsers = await db.select({ id: users.id }).from(users).where(eq(users.isActive, true));
  const totalUsers = allUsers.length;

  const result = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      priority: announcements.priority,
      isActive: announcements.isActive,
      expiresAt: announcements.expiresAt,
      createdAt: announcements.createdAt,
      createdBy: announcements.createdBy,
      authorName: users.name,
      ackCount: sql<number>`(select count(*) from announcement_acks where announcement_id = ${announcements.id})`.as("ack_count"),
    })
    .from(announcements)
    .innerJoin(users, eq(announcements.createdBy, users.id))
    .orderBy(desc(announcements.createdAt));

  return NextResponse.json({ announcements: result, totalUsers });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.isLeader) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, body, priority, expiresAt } = await request.json();
  if (!title) {
    return NextResponse.json({ error: "Tytuł jest wymagany" }, { status: 400 });
  }

  const [announcement] = await db
    .insert(announcements)
    .values({
      title,
      body: body || null,
      priority: priority || "normal",
      createdBy: Number(session.user.id),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    })
    .returning();

  return NextResponse.json({ announcement });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.isLeader) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, isActive } = await request.json();
  if (!id || typeof isActive !== "boolean") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const [updated] = await db
    .update(announcements)
    .set({ isActive })
    .where(eq(announcements.id, id))
    .returning();

  return updated
    ? NextResponse.json({ announcement: updated })
    : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.isLeader) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await db.delete(announcementAcks).where(eq(announcementAcks.announcementId, Number(id)));
  await db.delete(announcements).where(eq(announcements.id, Number(id)));

  return NextResponse.json({ ok: true });
}
