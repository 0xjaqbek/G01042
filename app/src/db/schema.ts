import {
  pgTable,
  serial,
  text,
  varchar,
  boolean,
  integer,
  date,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

// Enums
export const roleEnum = pgEnum("role", ["kierowca", "ratownik"]);
export const shiftTypeEnum = pgEnum("shift_type", ["D", "N", "DN"]);
export const shiftFunctionEnum = pgEnum("shift_function", ["K", "R"]);
export const proposalStatusEnum = pgEnum("proposal_status", [
  "draft",
  "submitted",
  "approved",
  "rejected",
]);
export const incidentSeverityEnum = pgEnum("incident_severity", [
  "info",
  "minor",
  "major",
  "critical",
]);

// ─── Users ───
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  pin: varchar("pin", { length: 255 }).notNull(), // hashed
  role: roleEnum("role").notNull(),
  isLeader: boolean("is_leader").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Schedule (final, approved by leader) ───
export const scheduleEntries = pgTable("schedule_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  date: date("date").notNull(),
  shiftType: shiftTypeEnum("shift_type").notNull(), // D, N, DN
  shiftFunction: shiftFunctionEnum("shift_function").notNull(), // K or R
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Shift Proposals ───
export const shiftProposals = pgTable("shift_proposals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  status: proposalStatusEnum("status").default("draft").notNull(),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const proposalEntries = pgTable("proposal_entries", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id")
    .references(() => shiftProposals.id, { onDelete: "cascade" })
    .notNull(),
  date: date("date").notNull(),
  shiftType: shiftTypeEnum("shift_type").notNull(),
  shiftFunction: shiftFunctionEnum("shift_function").notNull(),
});

// ─── Checklist Templates ───
export const checklistCategories = pgTable("checklist_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const checklistItems = pgTable("checklist_items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .references(() => checklistCategories.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  expectedQuantity: integer("expected_quantity"), // for countable items
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// ─── Daily Checklist Completions ───
export const dailyChecklists = pgTable("daily_checklists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  date: date("date").notNull(),
  shiftType: shiftTypeEnum("shift_type").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const checklistCompletions = pgTable("checklist_completions", {
  id: serial("id").primaryKey(),
  dailyChecklistId: integer("daily_checklist_id")
    .references(() => dailyChecklists.id, { onDelete: "cascade" })
    .notNull(),
  itemId: integer("item_id")
    .references(() => checklistItems.id)
    .notNull(),
  checked: boolean("checked").default(false).notNull(),
  quantity: integer("quantity"), // actual count if applicable
  notes: text("notes"),
});

// ─── Material Usage ───
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(), // szt, opak, ml, etc.
  minStock: integer("min_stock").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const materialUsage = pgTable("material_usage", {
  id: serial("id").primaryKey(),
  materialId: integer("material_id")
    .references(() => materials.id)
    .notNull(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  date: date("date").notNull(),
  quantity: integer("quantity").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const supplyOrders = pgTable("supply_orders", {
  id: serial("id").primaryKey(),
  createdBy: integer("created_by")
    .references(() => users.id)
    .notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  notes: text("notes"),
  isSent: boolean("is_sent").default(false).notNull(),
});

export const supplyOrderItems = pgTable("supply_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => supplyOrders.id, { onDelete: "cascade" })
    .notNull(),
  materialId: integer("material_id")
    .references(() => materials.id)
    .notNull(),
  quantityUsed: integer("quantity_used").notNull(),
  quantityOrdered: integer("quantity_ordered").notNull(),
});

// ─── Vehicle Incident Reports ───
export const vehicleIncidents = pgTable("vehicle_incidents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  date: date("date").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // uszkodzenie, awaria, kolizja, inne
  description: text("description").notNull(),
  severity: incidentSeverityEnum("severity").notNull(),
  location: varchar("location", { length: 200 }),
  mileage: integer("mileage"),
  actionTaken: text("action_taken"),
  isResolved: boolean("is_resolved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
