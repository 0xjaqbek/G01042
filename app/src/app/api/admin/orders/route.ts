import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, lte } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  materials,
  materialUsage,
  supplyOrderItems,
  supplyOrders,
} from "@/db/schema";

async function getUsage(periodStart: string, periodEnd: string) {
  const rows = await db
    .select({
      materialId: materials.id,
      materialName: materials.name,
      unit: materials.unit,
      minStock: materials.minStock,
      quantity: materialUsage.quantity,
    })
    .from(materialUsage)
    .innerJoin(materials, eq(materialUsage.materialId, materials.id))
    .where(
      and(
        gte(materialUsage.date, periodStart),
        lte(materialUsage.date, periodEnd)
      )
    );

  return Array.from(
    rows.reduce((grouped, row) => {
      const current = grouped.get(row.materialId) ?? {
        materialId: row.materialId,
        materialName: row.materialName,
        unit: row.unit,
        minStock: row.minStock,
        quantityUsed: 0,
      };
      current.quantityUsed += row.quantity;
      grouped.set(row.materialId, current);
      return grouped;
    }, new Map<number, { materialId: number; materialName: string; unit: string; minStock: number; quantityUsed: number }>()).values()
  ).sort((a, b) => b.quantityUsed - a.quantityUsed);
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.isLeader) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const params = new URL(request.url).searchParams;
  const periodStart = params.get("from");
  const periodEnd = params.get("to");
  if (!periodStart || !periodEnd || periodStart > periodEnd) {
    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  }

  return NextResponse.json({ items: await getUsage(periodStart, periodEnd) });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.isLeader) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { periodStart, periodEnd, notes, items } = await request.json();
  if (!periodStart || !periodEnd || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Invalid order" }, { status: 400 });
  }

  const [order] = await db
    .insert(supplyOrders)
    .values({
      createdBy: Number(session.user.id),
      periodStart,
      periodEnd,
      notes: notes || null,
    })
    .returning({ id: supplyOrders.id, generatedAt: supplyOrders.generatedAt });

  await db.insert(supplyOrderItems).values(
    items.map((item: { materialId: number; quantityUsed: number; quantityOrdered: number }) => ({
      orderId: order.id,
      materialId: Number(item.materialId),
      quantityUsed: Number(item.quantityUsed),
      quantityOrdered: Number(item.quantityOrdered),
    }))
  );

  return NextResponse.json({ order });
}
