// routes/inventory.ts — Key inventory management

import { Router } from "express";
import db from "../db.js";

const router = Router();

// GET /api/inventory — List inventory items
router.get("/", async (req, res) => {
  const { location, limit = "50" } = req.query;
  const params: unknown[] = [];
  let query = "SELECT * FROM key_inventory";

  if (location) {
    query += " WHERE location = $1";
    params.push(location);
  }

  query += " ORDER BY updated_at DESC LIMIT $" + (params.length + 1);
  params.push(parseInt(limit as string, 10));

  const { rows } = await db.query(query, params);
  res.json(rows);
});

// GET /api/inventory/:id — Get single item
router.get("/:id", async (req, res) => {
  const { rows } = await db.query("SELECT * FROM key_inventory WHERE id = $1", [req.params.id]);
  if (rows.length === 0) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  res.json(rows[0]);
});

// POST /api/inventory — Add inventory item
router.post("/", async (req, res) => {
  const { sku, brand, key_type, description, quantity, price, location } = req.body;
  const { rows } = await db.query(
    `INSERT INTO key_inventory (sku, brand, key_type, description, quantity, price, location)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [sku, brand, key_type, description, quantity, price, location],
  );
  res.status(201).json(rows[0]);
});

// PATCH /api/inventory/:id — Update stock quantity
router.patch("/:id", async (req, res) => {
  const { quantity } = req.body;
  const { rows } = await db.query(
    "UPDATE key_inventory SET quantity = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
    [quantity, req.params.id],
  );
  if (rows.length === 0) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  res.json(rows[0]);
});

export default router;
