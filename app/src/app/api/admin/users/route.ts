import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.isLeader) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      role: users.role,
      isLeader: users.isLeader,
      isActive: users.isActive,
    })
    .from(users);

  return NextResponse.json({ users: allUsers });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.isLeader) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, role, pin } = body;

  const hashedPin = await hash(pin || "1234", 10);

  const [user] = await db
    .insert(users)
    .values({
      name,
      pin: hashedPin,
      role: role as "kierowca" | "ratownik",
      isLeader: false,
    })
    .returning({
      id: users.id,
      name: users.name,
      role: users.role,
      isLeader: users.isLeader,
      isActive: users.isActive,
    });

  return NextResponse.json({ user });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.isLeader) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, action, pin, isActive } = body;

  if (action === "resetPin") {
    const hashedPin = await hash(pin || "1234", 10);
    await db.update(users).set({ pin: hashedPin }).where(eq(users.id, userId));
  } else if (action === "toggleActive") {
    await db
      .update(users)
      .set({ isActive: Boolean(isActive) })
      .where(eq(users.id, userId));
  }

  return NextResponse.json({ success: true });
}
