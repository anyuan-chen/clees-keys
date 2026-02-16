// routes/customers.ts — Customer management + search
//
// Customers can be searched by name, phone, or address for quick lookup
// during walk-in visits and phone calls.

import { Router } from "express";
import db from "../db.js";

const router = Router();

// GET /api/customers — List customers with optional pagination
router.get("/", async (req, res) => {
  const { limit = "50", offset = "0" } = req.query;
  const { rows } = await db.query(
    "SELECT * FROM customers ORDER BY created_at DESC LIMIT $1 OFFSET $2",
    [parseInt(limit as string, 10), parseInt(offset as string, 10)],
  );
  res.json(rows);
});

// GET /api/customers/:id — Get single customer with order history
router.get("/:id", async (req, res) => {
  const { rows } = await db.query(
    `SELECT c.*, json_agg(o.*) AS recent_orders
     FROM customers c
     LEFT JOIN orders o ON o.customer_id = c.id
     WHERE c.id = $1
     GROUP BY c.id`,
    [req.params.id],
  );
  if (rows.length === 0) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  res.json(rows[0]);
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

// GET /api/customers/lookup?phone=555 — Quick phone lookup (prefix match)
router.get("/lookup", async (req, res) => {
  const { phone } = req.query;
  if (!phone) {
    res.status(400).json({ error: "Query parameter 'phone' is required" });
    return;
  }

  const { rows } = await db.query(
    `SELECT id, name, phone, address FROM customers
     WHERE phone LIKE $1
     ORDER BY name ASC
     LIMIT 10`,
    [`${phone}%`],
  );
  res.json(rows);
});

// GET /api/customers/nearby?q=oak — Address search for nearby customers
router.get("/nearby", async (req, res) => {
  const { q } = req.query;
  if (!q) {
    res.status(400).json({ error: "Query parameter 'q' is required" });
    return;
  }

  const { rows } = await db.query(
    `SELECT *, similarity(address, $1) AS match_score
     FROM customers
     WHERE similarity(address, $1) > 0.2
     ORDER BY match_score DESC
     LIMIT 20`,
    [q],
  );
  res.json(rows);
});

export default router;
