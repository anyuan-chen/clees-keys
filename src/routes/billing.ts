// routes/billing.ts — Customer billing / invoice management

import { Router } from "express";
import db from "../db.js";

const router = Router();

// GET /api/billing — List invoices
router.get("/", async (req, res) => {
  const { customer_id, status, limit = "50" } = req.query;
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (customer_id) {
    conditions.push(`customer_id = $${paramIdx++}`);
    params.push(customer_id);
  }
  if (status) {
    conditions.push(`status = $${paramIdx++}`);
    params.push(status);
  }

  let query = "SELECT * FROM customer_billing";
  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }
  query += ` ORDER BY invoice_date DESC LIMIT $${paramIdx}`;
  params.push(parseInt(limit as string, 10));

  const { rows } = await db.query(query, params);
  res.json(rows);
});

// GET /api/billing/:id — Get single invoice
router.get("/:id", async (req, res) => {
  const { rows } = await db.query("SELECT * FROM customer_billing WHERE id = $1", [req.params.id]);
  if (rows.length === 0) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  res.json(rows[0]);
});

// POST /api/billing — Create invoice
router.post("/", async (req, res) => {
  const { customer_id, description, amount, payment_method } = req.body;
  const { rows } = await db.query(
    `INSERT INTO customer_billing (customer_id, description, amount, payment_method)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [customer_id, description, amount, payment_method],
  );
  res.status(201).json(rows[0]);
});

// PATCH /api/billing/:id — Update invoice status
router.patch("/:id", async (req, res) => {
  const { status, payment_method } = req.body;

  const sets: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (status) {
    sets.push(`status = $${paramIdx++}`);
    params.push(status);
  }
  if (payment_method) {
    sets.push(`payment_method = $${paramIdx++}`);
    params.push(payment_method);
  }

  if (sets.length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  params.push(req.params.id);
  const query = `UPDATE customer_billing SET ${sets.join(", ")} WHERE id = $${paramIdx} RETURNING *`;
  const { rows } = await db.query(query, params);

  if (rows.length === 0) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  res.json(rows[0]);
});

export default router;
