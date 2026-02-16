// routes/technicians.ts — Technician performance analytics
//
// Provides search and analytics endpoints for technician management.
// Used by the ops dashboard to track performance and allocate work.

import { Router } from "express";
import db from "../db.js";

const router = Router();

// GET /api/technicians/search?q=mike — Search technicians by name or notes
router.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q) {
    res.status(400).json({ error: "Query parameter 'q' is required" });
    return;
  }

  const pattern = `%${q}%`;
  const { rows } = await db.query(
    `SELECT DISTINCT technician, COUNT(*) AS job_count
     FROM service_logs
     WHERE technician ILIKE $1 OR message ILIKE $1
     GROUP BY technician
     ORDER BY job_count DESC`,
    [pattern],
  );
  res.json(rows);
});

// GET /api/technicians/performance — Performance breakdown by tech, service type, and week
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
       MAX(duration_ms) AS slowest_job,
       PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95_duration
     FROM service_logs
     ${whereClause}
     GROUP BY technician, service_type, DATE_TRUNC('week', timestamp)
     ORDER BY week DESC, technician ASC`,
    params,
  );
  res.json(rows);
});

// GET /api/technicians/leaderboard — Top technicians by completed jobs this month
router.get("/leaderboard", async (req, res) => {
  const { rows } = await db.query(
    `SELECT
       technician,
       COUNT(*) AS jobs_completed,
       AVG(duration_ms) AS avg_duration_ms,
       COUNT(DISTINCT service_type) AS service_types_handled,
       SUM(CASE WHEN duration_ms < 1800000 THEN 1 ELSE 0 END) AS fast_jobs
     FROM service_logs
     WHERE timestamp > DATE_TRUNC('month', NOW())
     GROUP BY technician
     ORDER BY jobs_completed DESC
     LIMIT 10`,
  );
  res.json(rows);
});

// GET /api/technicians/utilization — Daily utilization heatmap data
router.get("/utilization", async (req, res) => {
  const { technician } = req.query;
  const params: unknown[] = [];
  let whereClause = "";

  if (technician) {
    whereClause = "WHERE technician ILIKE $1";
    params.push(`%${technician}%`);
  }

  const { rows } = await db.query(
    `SELECT
       technician,
       DATE_TRUNC('day', timestamp) AS day,
       EXTRACT(HOUR FROM timestamp) AS hour,
       COUNT(*) AS job_count,
       SUM(duration_ms) AS total_duration_ms
     FROM service_logs
     ${whereClause}
     GROUP BY technician, DATE_TRUNC('day', timestamp), EXTRACT(HOUR FROM timestamp)
     ORDER BY day DESC, hour ASC`,
    params,
  );
  res.json(rows);
});

export default router;
