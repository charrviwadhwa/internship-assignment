import express from "express";
import 'dotenv/config';
import { authorize } from "./middleware/auth.js";
import { addTransaction, getDashboardSummary } from "./controllers/finance.js";

const app = express();
app.use(express.json());

// Financial Routes
app.post("/api/records", authorize(["ADMIN"]), addTransaction);
app.get("/api/dashboard", authorize(["ADMIN", "ANALYST", "VIEWER"]), getDashboardSummary);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));