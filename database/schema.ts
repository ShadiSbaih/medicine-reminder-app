import { sql } from "drizzle-orm";
import {
    integer,
    real,
    sqliteTable,
    text,
    uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const doseStatuses = ["taken", "missed", "skipped"] as const;
export type DoseStatus = (typeof doseStatuses)[number];

export const schemaMigrations = sqliteTable("schema_migrations", {
  version: integer("version").primaryKey(),
  name: text("name").notNull(),
  appliedAt: text("applied_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  checksum: text("checksum").notNull(),
});

export const medications = sqliteTable("medications", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(),
  times: text("times").notNull().default("[]"),
  startDate: text("start_date").notNull(),
  duration: text("duration").notNull(),
  notes: text("notes"),
  color: text("color").notNull().default("#2DB19A"),
  reminderEnabled: integer("reminder_enabled", { mode: "boolean" })
    .notNull()
    .default(true),
  currentSupply: real("current_supply").notNull().default(0),
  totalSupply: real("total_supply").notNull().default(0),
  refillAt: real("refill_at").notNull().default(0),
  refillReminder: integer("refill_reminder", { mode: "boolean" })
    .notNull()
    .default(false),
  lastRefillDate: text("last_refill_date"),
  isDeleted: integer("is_deleted", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const doseHistory = sqliteTable(
  "dose_history",
  {
    id: text("id").primaryKey(),
    medicationId: text("medication_id")
      .notNull()
      .references(() => medications.id, { onDelete: "cascade" }),
    timestamp: text("timestamp").notNull(),
    taken: integer("taken", { mode: "boolean" }).notNull().default(false),
    status: text("status").notNull(),
    scheduledTime: text("scheduled_time"),
    doseDate: text("dose_date").notNull(),
    notes: text("notes"),
    supplyBefore: real("supply_before"),
    supplyAfter: real("supply_after"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    medicationDateTimeUnique: uniqueIndex(
      "uq_dose_history_medication_date_time",
    ).on(table.medicationId, table.doseDate, table.scheduledTime),
  }),
);

export const notificationEvents = sqliteTable("notification_events", {
  id: text("id").primaryKey(),
  medicationId: text("medication_id").references(() => medications.id, {
    onDelete: "cascade",
  }),
  type: text("type").notNull(),
  scheduledFor: text("scheduled_for").notNull(),
  expoNotifId: text("expo_notif_id"),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  readAt: text("read_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type MedicationRow = typeof medications.$inferSelect;
export type NewMedicationRow = typeof medications.$inferInsert;

export type DoseHistoryRow = typeof doseHistory.$inferSelect;
export type NewDoseHistoryRow = typeof doseHistory.$inferInsert;
