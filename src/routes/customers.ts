// routes/customers.ts — Customer management + search

import { Router } from "express";
import db from "../db.js";

const router = Router();

// GET /api/customers — List customers
router.get("/", async (req, res) => {
  const { limit = "50" } = req.query;
  const { rows } = await db.query(
    "SELECT * FROM customers ORDER BY created_at DESC LIMIT $1",
    [parseInt(limit as string, 10)],
  );
  res.json(rows);
});

// GET /api/customers/search?q=john — Full-text search across customer fields
router.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q) {
    res.status(400).json({ error: "Query parameter 'q' is required" });
    return;
  }

  const pattern = `%${q}%`;
  const { rows } = await db.query(
    `SELECT * FROM customers
     WHERE name ILIKE $1
        OR email ILIKE $1
        OR phone ILIKE $1
        OR address ILIKE $1
     ORDER BY created_at DESC`,
    [pattern],
  );
  res.json(rows);
});

// POST /api/customers — Create customer
router.post("/", async (req, res) => {
  const { name, email, phone, address } = req.body;
  const { rows } = await db.query(
    `INSERT INTO customers (name, email, phone, address)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, email, phone, address],
  );
  res.status(201).json(rows[0]);
});

export default router;
