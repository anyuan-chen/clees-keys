// seed.ts — Seed Clee's Keys database with sample data

import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? "postgresql://localhost:5432/clees_keys",
});

const KEY_TYPES = ["house", "car", "safe", "padlock", "mailbox", "cabinet", "deadbolt"];
const STORES = ["main-shop", "downtown", "mobile-van"];
const STATUSES = ["pending", "cutting", "ready", "picked-up"];
const DESCRIPTIONS = [
  "House key copy",
  "Schlage deadbolt rekey",
  "Car key duplicate",
  "Padlock key replacement",
  "Mailbox key copy",
  "Safe combination reset and new key",
  "Cabinet lock rekey",
  "Master key system setup",
  "High-security key cut",
  "Transponder key programming",
];

const SERVICE_TYPES = ["key-cutting", "lockout", "rekey", "safe-install"];
const TECHNICIANS = ["tech-001", "tech-002", "tech-003", "tech-004"];
const LOG_MESSAGES = [
  "Customer locked out, deadbolt rekey completed",
  "Key cutting for Schlage SC1 blank",
  "Emergency lockout service, picked wafer lock",
  "Safe combination reset and new key cut",
  "Transponder key programming for Honda Civic",
  "Master key system installation for office building",
  "Broken key extraction from Yale deadbolt",
  "High-security Medeco key duplication",
  "Cabinet lock rekey, 4 locks total",
  "Automotive lockout, slim jim entry",
];

const BRANDS = ["Schlage", "Kwikset", "Yale", "Medeco", "Mul-T-Lock", "ASSA"];
const LOCATIONS = ["main-shop", "downtown", "warehouse"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return d.toISOString();
}

async function seed(): Promise<void> {
  console.log("Seeding Clee's Keys database...");

  // Orders (1000 rows)
  console.log("  Seeding orders...");
  for (let i = 0; i < 1000; i++) {
    await pool.query(
      `INSERT INTO orders (order_date, description, key_type, price, status, customer_id, store)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        randomDate(30),
        pick(DESCRIPTIONS),
        pick(KEY_TYPES),
        (Math.random() * 200 + 5).toFixed(2),
        pick(STATUSES),
        `cust-${Math.floor(Math.random() * 500)}`,
        pick(STORES),
      ],
    );
  }

  // Service logs (800 rows)
  console.log("  Seeding service logs...");
  for (let i = 0; i < 800; i++) {
    await pool.query(
      `INSERT INTO service_logs (timestamp, message, service_type, technician, job_id, duration_ms)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        randomDate(30),
        pick(LOG_MESSAGES),
        pick(SERVICE_TYPES),
        pick(TECHNICIANS),
        `job-${Math.random().toString(36).slice(2, 10)}`,
        (Math.random() * 5000).toFixed(1),
      ],
    );
  }

  // Key inventory (200 rows)
  console.log("  Seeding key inventory...");
  for (let i = 0; i < 200; i++) {
    await pool.query(
      `INSERT INTO key_inventory (sku, brand, key_type, description, quantity, price, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        `SKU-${String(i).padStart(4, "0")}`,
        pick(BRANDS),
        pick(KEY_TYPES),
        `${pick(BRANDS)} ${pick(KEY_TYPES)} key blank`,
        Math.floor(Math.random() * 100),
        (Math.random() * 50 + 1).toFixed(2),
        pick(LOCATIONS),
      ],
    );
  }

  // Appointments (300 rows)
  console.log("  Seeding appointments...");
  for (let i = 0; i < 300; i++) {
    await pool.query(
      `INSERT INTO appointments (appointment_date, customer_id, service_type, technician, status, notes, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        randomDate(14),
        `cust-${Math.floor(Math.random() * 500)}`,
        pick(SERVICE_TYPES),
        pick(TECHNICIANS),
        pick(["scheduled", "confirmed", "completed", "cancelled"]),
        Math.random() > 0.5 ? "Customer requested morning slot" : null,
        `${Math.floor(Math.random() * 9999)} Main St`,
      ],
    );
  }

  // Customer billing (500 rows)
  console.log("  Seeding customer billing...");
  for (let i = 0; i < 500; i++) {
    await pool.query(
      `INSERT INTO customer_billing (invoice_date, customer_id, description, amount, status, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        randomDate(60),
        `cust-${Math.floor(Math.random() * 500)}`,
        pick(DESCRIPTIONS),
        (Math.random() * 300 + 10).toFixed(2),
        pick(["unpaid", "paid", "overdue"]),
        pick(["cash", "card", "check", null]),
      ],
    );
  }

  console.log("Seeding complete.");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
