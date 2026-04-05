import { db } from "../db/index.js";
import { transactions } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";

export const addTransaction = async (req, res) => {
  const { amount, type, category, description } = req.body;

  try {
    const [newRecord] = await db.insert(transactions).values({
      amount,
      type,
      category,
      description,
      userId: req.user.id
    }).returning();

    res.status(201).json(newRecord);
  } catch (error) {
    res.status(400).json({ error: "Invalid input data" });
  }
};

export const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;

   
    const result = await db.select({
      type: transactions.type,
      total: sql`sum(${transactions.amount})`.mapWith(Number),
    })
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .groupBy(transactions.type);

    const income = result.find(r => r.type === 'INCOME')?.total || 0;
    const expense = result.find(r => r.type === 'EXPENSE')?.total || 0;

    res.json({
      totalIncome: income,
      totalExpenses: expense,
      netBalance: income - expense,
      categorySummary: "/api/finance/categories (Optional Endpoint)"
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};