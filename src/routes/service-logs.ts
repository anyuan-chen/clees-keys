// routes/service-logs.ts — Service log management + search
//
// Search endpoints use Elasticsearch match + range / fuzziness

import { Router } from "express";
import db from "../db.js";
import es from "../es.js";

const router = Router();

// GET /api/service-logs — List recent service logs
router.get("/", async (req, res) => {
  const { technician, limit = "50" } = req.query;
  const params: unknown[] = [];
  let query = "SELECT * FROM service_logs";

  if (technician) {
    query += " WHERE technician = $1";
    params.push(technician);
  }

  query += " ORDER BY timestamp DESC LIMIT $" + (params.length + 1);
  params.push(parseInt(limit as string, 10));

  const { rows } = await db.query(query, params);
  res.json(rows);
});

// GET /api/service-logs/:id — Get single log entry
router.get("/:id", async (req, res) => {
  const { rows } = await db.query("SELECT * FROM service_logs WHERE id = $1", [req.params.id]);
  if (rows.length === 0) {
    res.status(404).json({ error: "Service log not found" });
    return;
  }
  res.json(rows[0]);
});

// POST /api/service-logs — Create log entry
router.post("/", async (req, res) => {
  const { message, service_type, technician, job_id, duration_ms } = req.body;
  const { rows } = await db.query(
    `INSERT INTO service_logs (message, service_type, technician, job_id, duration_ms)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [message, service_type, technician, job_id, duration_ms],
  );
  res.status(201).json(rows[0]);
});

// GET /api/service-logs/search?q=lockout&since=2026-01-01 — Log search via ES bool query
router.get("/search", async (req, res) => {
  const { q, since } = req.query;
  if (!q) {
    res.status(400).json({ error: "Query parameter 'q' is required" });
    return;
  }

  const must: object[] = [{ match: { message: q as string } }];
  if (since) {
    must.push({ range: { timestamp: { gte: since as string } } });
  }

  const result = await es.search({
    index: "service_logs",
    query: { bool: { must } },
    sort: [{ timestamp: "desc" }],
  });

  res.json(result.hits.hits.map((h) => h._source));
});

// GET /api/service-logs/fuzzy?q=lokout — Fuzzy search via ES match + AUTO fuzziness
router.get("/fuzzy", async (req, res) => {
  const { q } = req.query;
  if (!q) {
    res.status(400).json({ error: "Query parameter 'q' is required" });
    return;
  }

  const result = await es.search({
    index: "service_logs",
    query: {
      match: {
        message: { query: q as string, fuzziness: "AUTO" },
      },
    },
  });

  res.json(result.hits.hits.map((h) => ({ ...h._source, score: h._score })));
});

export default router;
