import { pgTable, text, varchar, timestamp, decimal, pgEnum, uuid, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";


export const roleEnum = pgEnum("role", ["ADMIN", "ANALYST", "VIEWER"]);
export const statusEnum = pgEnum("status", ["ACTIVE", "INACTIVE"]);
export const typeEnum = pgEnum("type", ["INCOME", "EXPENSE"]);


export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").default("VIEWER").notNull(),
  status: statusEnum("status").default("ACTIVE").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  type: typeEnum("type").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  description: text("description"),
  date: timestamp("date").defaultNow().notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  userDateIdx: index("user_date_idx").on(table.userId, table.date),
}));


export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));
