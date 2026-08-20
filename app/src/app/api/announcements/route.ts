import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { announcements, announcementAcks, users } from "@/db/schema";
import { eq, and, desc, or, gt, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = Number(session.user.id);

  // Get active, non-expired announcements
  const now = new Date();
  const active = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      priority: announcements.priority,
      createdBy: announcements.createdBy,
      createdAt: announcements.createdAt,
      expiresAt: announcements.expiresAt,
      authorName: users.name,
    })
    .from(announcements)
    .innerJoin(users, eq(announcements.createdBy, users.id))
    .where(
      and(
        eq(announcements.isActive, true),
        or(isNull(announcements.expiresAt), gt(announcements.expiresAt, now))
      )
    )
    .orderBy(desc(announcements.createdAt));

  // Get user's acks
  const acks = await db
    .select({ announcementId: announcementAcks.announcementId })
    .from(announcementAcks)
    .where(eq(announcementAcks.userId, userId));

  const ackedIds = new Set(acks.map((a) => a.announcementId));

  const result = active.map((a) => ({
    ...a,
    acked: ackedIds.has(a.id),
  }));

  return NextResponse.json({ announcements: result });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { announcementId } = await request.json();
  if (!announcementId) {
    return NextResponse.json({ error: "Missing announcementId" }, { status: 400 });
  }

  const userId = Number(session.user.id);

  // Check if already acked
  const existing = await db
    .select()
    .from(announcementAcks)
    .where(
      and(
        eq(announcementAcks.announcementId, announcementId),
        eq(announcementAcks.userId, userId)
      )
    );

  if (existing.length === 0) {
    await db.insert(announcementAcks).values({
      announcementId,
      userId,
    });
  }

  return NextResponse.json({ ok: true });
}
