// routes/technicians.ts — Technician performance analytics

import { Router } from "express";
import db from "../db.js";

const router = Router();

// GET /api/technicians/performance — Weekly performance breakdown by technician and service type
router.get("/performance", async (req, res) => {
  const { since } = req.query;
  const params: unknown[] = [];
  let whereClause = "";

  if (since) {
    whereClause = "WHERE timestamp > $1";
    params.push(since);
  }

  const { rows } = await db.query(
    `SELECT
       technician,
       service_type,
       DATE_TRUNC('week', timestamp) AS week,
       COUNT(*) AS jobs_completed,
       AVG(duration_ms) AS avg_duration_ms,
       MIN(duration_ms) AS fastest_job,
       MAX(duration_ms) AS slowest_job
     FROM service_logs
     ${whereClause}
     GROUP BY technician, service_type, DATE_TRUNC('week', timestamp)
     ORDER BY week DESC, technician ASC`,
    params,
  );
  res.json(rows);
});

export default router;
