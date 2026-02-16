// routes/orders.ts — Order management CRUD

import { Router } from "express";
import db from "../db.js";

const router = Router();

// GET /api/orders — List orders with optional status filter
router.get("/", async (req, res) => {
  const { status, limit = "50" } = req.query;
  const params: unknown[] = [];
  let query = "SELECT * FROM orders";

  if (status) {
    query += " WHERE status = $1";
    params.push(status);
  }

  query += " ORDER BY order_date DESC LIMIT $" + (params.length + 1);
  params.push(parseInt(limit as string, 10));

  const { rows } = await db.query(query, params);
  res.json(rows);
});

// GET /api/orders/:id — Get single order
router.get("/:id", async (req, res) => {
  const { rows } = await db.query("SELECT * FROM orders WHERE id = $1", [req.params.id]);
  if (rows.length === 0) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(rows[0]);
});

// POST /api/orders — Create order
router.post("/", async (req, res) => {
  const { description, key_type, price, customer_id, store } = req.body;
  const { rows } = await db.query(
    `INSERT INTO orders (description, key_type, price, customer_id, store)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [description, key_type, price, customer_id, store],
  );
  res.status(201).json(rows[0]);
});

// PATCH /api/orders/:id — Update order status
router.patch("/:id", async (req, res) => {
  const { status } = req.body;
  const { rows } = await db.query(
    "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
    [status, req.params.id],
  );
  if (rows.length === 0) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(rows[0]);
});

// DELETE /api/orders/:id — Delete order
router.delete("/:id", async (req, res) => {
  const { rowCount } = await db.query("DELETE FROM orders WHERE id = $1", [req.params.id]);
  if (rowCount === 0) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.status(204).end();
});

// GET /api/orders/autocomplete?prefix=dead — Autocomplete on description
router.get("/autocomplete", async (req, res) => {
  const { prefix } = req.query;
  if (!prefix) {
    res.status(400).json({ error: "Query parameter 'prefix' is required" });
    return;
  }

  const pattern = `${prefix}%`;
  const { rows } = await db.query(
    `SELECT id, description, key_type FROM orders
     WHERE description ILIKE $1 OR key_type ILIKE $1
     LIMIT 10`,
    [pattern],
  );
  res.json(rows);
});

export default router;
