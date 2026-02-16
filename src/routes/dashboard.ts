// routes/dashboard.ts — Analytics dashboard

import { Router } from "express";
import db from "../db.js";

const router = Router();

// GET /api/dashboard/revenue — Revenue breakdown by week and store
router.get("/revenue", async (req, res) => {
  const { rows } = await db.query(
    `SELECT
       DATE_TRUNC('week', order_date) AS week,
       store,
       key_type,
       COUNT(*) AS order_count,
       SUM(price) AS revenue,
       AVG(price) AS avg_order_value
     FROM orders
     GROUP BY DATE_TRUNC('week', order_date), store, key_type
     ORDER BY week DESC, revenue DESC`,
  );
  res.json(rows);
});

export default router;
