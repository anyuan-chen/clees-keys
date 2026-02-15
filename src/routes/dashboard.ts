// routes/dashboard.ts — Analytics dashboard endpoints
//
// These use complex GROUP BY queries that would be better as ES aggregations.

import { Router } from "express";
import db from "../db.js";

const router = Router();

// GET /api/dashboard/service-breakdown — Service type breakdown by technician and day
router.get("/service-breakdown", async (_req, res) => {
  const { rows } = await db.query(
    `SELECT
       service_type,
       technician,
       DATE_TRUNC('day', timestamp) AS day,
       COUNT(*) AS count,
       AVG(duration_ms) AS avg_duration
     FROM service_logs
     GROUP BY service_type, technician, DATE_TRUNC('day', timestamp)
     ORDER BY day DESC`,
  );
  res.json(rows);
});

// GET /api/dashboard/inventory-facets — Inventory breakdown by key type and brand
router.get("/inventory-facets", async (_req, res) => {
  const { rows } = await db.query(
    `SELECT
       key_type,
       brand,
       COUNT(*) AS count,
       SUM(quantity) AS total_stock,
       AVG(price) AS avg_price
     FROM key_inventory
     GROUP BY key_type, brand
     ORDER BY count DESC`,
  );
  res.json(rows);
});

// GET /api/dashboard/revenue — Revenue breakdown by week and store
router.get("/revenue", async (_req, res) => {
  const { rows } = await db.query(
    `SELECT
       DATE_TRUNC('week', order_date) AS week,
       store,
       COUNT(*) AS order_count,
       SUM(price) AS revenue,
       AVG(price) AS avg_order_value
     FROM orders
     GROUP BY DATE_TRUNC('week', order_date), store
     ORDER BY week DESC`,
  );
  res.json(rows);
});

export default router;
