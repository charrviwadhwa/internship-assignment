import { db } from "../db/index.js";
import { transactions } from "../db/schema.js";
import { eq, and, desc, isNull, sql, ilike, or } from "drizzle-orm";

export const createTransaction = async (req, res) => {
  const { amount, type, category, description, date } = req.body;
  try {
    const [newRecord] = await db.insert(transactions).values({
      amount: amount.toString(),
      type,
      category,
      description,
      date: date ? new Date(date) : new Date(),
      userId: req.user.id,
    }).returning();
    res.status(201).json(newRecord);
  } catch (error) {
    res.status(500).json({ error: "Validation failed" });
  }
};

export const getTransactions = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";
  const offset = (page - 1) * limit;

  try {
    const visibilityFilter = req.user.role === "ADMIN" 
      ? eq(transactions.userId, req.user.id) 
      : isNull(transactions.deletedAt);

    const userRecords = await db
      .select()
      .from(transactions)
      .where(
        and(
          visibilityFilter,
          isNull(transactions.deletedAt),
          or(
            ilike(transactions.category, `%${search}%`),
            ilike(transactions.description, `%${search}%`)
          )
        )
      )
      .orderBy(desc(transactions.date))
      .limit(limit)
      .offset(offset);

    res.json({ page, limit, data: userRecords });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

export const getDashboardSummary = async (req, res) => {
  try {
    const visibilityFilter = req.user.role === "ADMIN" 
      ? eq(transactions.userId, req.user.id) 
      : isNull(transactions.deletedAt);

    const summary = await db
      .select({
        type: transactions.type,
        total: sql`sum(${transactions.amount})`.mapWith(Number),
      })
      .from(transactions)
      .where(and(visibilityFilter, isNull(transactions.deletedAt)))
      .groupBy(transactions.type);

    const income = summary.find(s => s.type === 'INCOME')?.total || 0;
    const expense = summary.find(s => s.type === 'EXPENSE')?.total || 0;

    res.json({
      totalIncome: income,
      totalExpenses: expense,
      netBalance: income - expense,
      viewingAs: req.user.role,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: "Aggregation failed" });
  }
};

export const deleteTransaction = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.update(transactions)
      .set({ deletedAt: new Date() })
      .where(and(eq(transactions.id, id), eq(transactions.userId, req.user.id)))
      .returning();

    if (result.length === 0) return res.status(404).json({ error: "Record not found or unauthorized" });
    res.json({ message: "Transaction soft-deleted" });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
};
