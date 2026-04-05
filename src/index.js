import 'dotenv/config';
import express from "express";
import { rateLimit } from 'express-rate-limit';

import { register, login } from "./controllers/auth.js";
import { 
  createTransaction, 
  getTransactions, 
  getDashboardSummary, 
  deleteTransaction 
} from "./controllers/finance.js";
import { authorize } from "./middleware/auth.js";

const app = express();

app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, 
  message: { error: "Too many requests, please try again later." }
});

app.use("/auth/", limiter);
app.use("/api/", limiter);

app.post("/auth/register", register);
app.post("/auth/login", login);

app.post("/api/transactions", authorize(["ADMIN"]), createTransaction);
app.delete("/api/transactions/:id", authorize(["ADMIN"]), deleteTransaction);

app.get("/api/transactions", authorize(["ADMIN", "ANALYST", "VIEWER"]), getTransactions);
app.get("/api/dashboard", authorize(["ADMIN", "ANALYST", "VIEWER"]), getDashboardSummary);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
