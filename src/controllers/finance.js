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
    const visibilityFilter = isNull(transactions.deletedAt);

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
  const userId = req.user.id;

  try {
    
    const baseFilter = (req.user.role === 'ADMIN') 
      ? eq(transactions.userId, userId) 
      : isNull(transactions.deletedAt);

    
    const [totals, categoryTotals, recentActivity, monthlyTrends] = await Promise.all([
      
      db.select({
        type: transactions.type,
        total: sql`sum(${transactions.amount})`.mapWith(Number),
      }).from(transactions).where(baseFilter).groupBy(transactions.type),

      
      db.select({
        category: transactions.category,
        total: sql`sum(${transactions.amount})`.mapWith(Number),
      }).from(transactions).where(baseFilter).groupBy(transactions.category),

      db.select().from(transactions).where(baseFilter).orderBy(desc(transactions.date)).limit(5),

      db.select({
        month: sql`to_char(${transactions.date}, 'YYYY-MM')`,
        totalIncome: sql`sum(case when ${transactions.type} = 'INCOME' then ${transactions.amount} else 0 end)`.mapWith(Number),
        totalExpense: sql`sum(case when ${transactions.type} = 'EXPENSE' then ${transactions.amount} else 0 end)`.mapWith(Number),
      }).from(transactions).where(baseFilter).groupBy(sql`to_char(${transactions.date}, 'YYYY-MM')`).orderBy(sql`to_char(${transactions.date}, 'YYYY-MM')`)
    ]);

    const income = totals.find(t => t.type === 'INCOME')?.total || 0;
    const expense = totals.find(t => t.type === 'EXPENSE')?.total || 0;

    res.json({
      summary: {
        totalIncome: income,
        totalExpenses: expense,
        netBalance: income - expense,
      },
      categoryBreakdown: categoryTotals,
      recentTransactions: recentActivity,
      trends: monthlyTrends,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ error: "Dashboard analytics failed" });
  }
};

export const updateTransaction = async (req, res) => {
  const { id } = req.params;
  const { amount, type, category, description, date } = req.body;

  try {
    
    const updateData = {};
    if (amount !== undefined) updateData.amount = amount.toString();
    if (type) updateData.type = type;
    if (category) updateData.category = category;
    if (description) updateData.description = description;
    if (date) updateData.date = new Date(date);

   
    const [updatedRecord] = await db
      .update(transactions)
      .set(updateData)
      .where(
        and(
          eq(transactions.id, id),

          req.user.role === "ADMIN" ? undefined : eq(transactions.userId, req.user.id),
          isNull(transactions.deletedAt)
        )
      )
      .returning();

    if (!updatedRecord) {
      return res.status(404).json({ error: "Transaction not found or unauthorized" });
    }

    res.json(updatedRecord);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update transaction" });
  }
};

export const deleteTransaction = async (req, res) => {
  const { id } = req.params;

  try {
    const [existingTransaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);

    if (!existingTransaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (existingTransaction.deletedAt) {
      return res.status(200).json({
        message: "Transaction already deleted",
        deletedRecord: existingTransaction
      });
    }

    const [deletedRecord] = await db
      .update(transactions)
      .set({ deletedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning();

    res.json({ message: "Transaction deleted successfully", deletedRecord });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete transaction" });
  }
};
