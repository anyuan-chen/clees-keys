// routes/appointments.ts — Appointment booking CRUD

import { Router } from "express";
import db from "../db.js";

const router = Router();

// GET /api/appointments — List appointments
router.get("/", async (req, res) => {
  const { technician, status, limit = "50" } = req.query;
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (technician) {
    conditions.push(`technician = $${paramIdx++}`);
    params.push(technician);
  }
  if (status) {
    conditions.push(`status = $${paramIdx++}`);
    params.push(status);
  }

  let query = "SELECT * FROM appointments";
  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }
  query += ` ORDER BY appointment_date DESC LIMIT $${paramIdx}`;
  params.push(parseInt(limit as string, 10));

  const { rows } = await db.query(query, params);
  res.json(rows);
});

// GET /api/appointments/:id — Get single appointment
router.get("/:id", async (req, res) => {
  const { rows } = await db.query("SELECT * FROM appointments WHERE id = $1", [req.params.id]);
  if (rows.length === 0) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }
  res.json(rows[0]);
});

// POST /api/appointments — Book appointment
router.post("/", async (req, res) => {
  const { appointment_date, customer_id, service_type, technician, notes, address } = req.body;
  const { rows } = await db.query(
    `INSERT INTO appointments (appointment_date, customer_id, service_type, technician, notes, address)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [appointment_date, customer_id, service_type, technician, notes, address],
  );
  res.status(201).json(rows[0]);
});

// PATCH /api/appointments/:id — Update appointment status
router.patch("/:id", async (req, res) => {
  const { status } = req.body;
  const { rows } = await db.query(
    "UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *",
    [status, req.params.id],
  );
  if (rows.length === 0) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }
  res.json(rows[0]);
});

// DELETE /api/appointments/:id — Cancel appointment
router.delete("/:id", async (req, res) => {
  const { rowCount } = await db.query("DELETE FROM appointments WHERE id = $1", [req.params.id]);
  if (rowCount === 0) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }
  res.status(204).end();
});

export default router;
