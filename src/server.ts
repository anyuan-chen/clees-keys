// server.ts — Express entry point for Clee's Keys

import express from "express";
import ordersRouter from "./routes/orders.js";
import inventoryRouter from "./routes/inventory.js";
import serviceLogsRouter from "./routes/service-logs.js";
import appointmentsRouter from "./routes/appointments.js";
import billingRouter from "./routes/billing.js";
import dashboardRouter from "./routes/dashboard.js";

const app = express();
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "clees-keys" });
});

// Routes
app.use("/api/orders", ordersRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/service-logs", serviceLogsRouter);
app.use("/api/appointments", appointmentsRouter);
app.use("/api/billing", billingRouter);
app.use("/api/dashboard", dashboardRouter);

const PORT = parseInt(process.env.PORT ?? "3000", 10);

app.listen(PORT, () => {
  console.log(`Clee's Keys running on http://localhost:${PORT}`);
});

export default app;
