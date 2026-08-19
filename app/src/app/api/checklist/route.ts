import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  checklistCategories,
  checklistItems,
  dailyChecklists,
  checklistCompletions,
} from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const userId = parseInt(searchParams.get("userId") || session.user.id);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  // Get all categories and items
  const categories = await db
    .select()
    .from(checklistCategories)
    .orderBy(asc(checklistCategories.sortOrder));

  const items = await db
    .select()
    .from(checklistItems)
    .where(eq(checklistItems.isActive, true))
    .orderBy(asc(checklistItems.sortOrder));

  // Get today's checklist for this user
  const [existing] = await db
    .select()
    .from(dailyChecklists)
    .where(
      and(eq(dailyChecklists.userId, userId), eq(dailyChecklists.date, date))
    )
    .limit(1);

  let completions: any[] = [];
  if (existing) {
    completions = await db
      .select()
      .from(checklistCompletions)
      .where(eq(checklistCompletions.dailyChecklistId, existing.id));
  }

  // Build response
  const result = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    items: items
      .filter((item) => item.categoryId === cat.id)
      .map((item) => {
        const completion = completions.find((c) => c.itemId === item.id);
        return {
          id: item.id,
          name: item.name,
          description: item.description,
          expectedQuantity: item.expectedQuantity,
          checked: completion?.checked || false,
          quantity: completion?.quantity || null,
          notes: completion?.notes || "",
        };
      }),
  }));

  return NextResponse.json({ categories: result });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { userId, date, items } = body;

  // Get or create daily checklist
  let [existing] = await db
    .select()
    .from(dailyChecklists)
    .where(
      and(
        eq(dailyChecklists.userId, parseInt(userId)),
        eq(dailyChecklists.date, date)
      )
    )
    .limit(1);

  if (!existing) {
    [existing] = await db
      .insert(dailyChecklists)
      .values({
        userId: parseInt(userId),
        date,
        shiftType: "D", // default, could be improved
      })
      .returning();
  }

  // Delete old completions
  await db
    .delete(checklistCompletions)
    .where(eq(checklistCompletions.dailyChecklistId, existing.id));

  // Insert new completions
  if (items && items.length > 0) {
    await db.insert(checklistCompletions).values(
      items.map((item: any) => ({
        dailyChecklistId: existing.id,
        itemId: item.itemId,
        checked: item.checked,
        quantity: item.quantity,
        notes: item.notes || "",
      }))
    );
  }

  // Update completed timestamp
  await db
    .update(dailyChecklists)
    .set({ completedAt: new Date() })
    .where(eq(dailyChecklists.id, existing.id));

  return NextResponse.json({ success: true });
}
