// routes/dashboard.ts — Analytics dashboard endpoints
//
// Uses Elasticsearch aggregations instead of multi-dimensional GROUP BY

import { Router } from "express";
import es from "../es.js";

const router = Router();

// GET /api/dashboard/service-breakdown — Service type breakdown by technician and day
router.get("/service-breakdown", async (_req, res) => {
  const result = await es.search({
    index: "service_logs",
    size: 0,
    aggs: {
      by_service_type: {
        terms: { field: "service_type" },
        aggs: {
          by_technician: {
            terms: { field: "technician" },
            aggs: {
              by_day: {
                date_histogram: { field: "timestamp", calendar_interval: "day" },
                aggs: {
                  avg_duration: { avg: { field: "duration_ms" } },
                },
              },
            },
          },
        },
      },
    },
  });

  res.json(result.aggregations);
});

// GET /api/dashboard/inventory-facets — Inventory breakdown by key type and brand
router.get("/inventory-facets", async (_req, res) => {
  const result = await es.search({
    index: "key_inventory",
    size: 0,
    aggs: {
      by_key_type: {
        terms: { field: "key_type" },
        aggs: {
          by_brand: {
            terms: { field: "brand" },
            aggs: {
              total_stock: { sum: { field: "quantity" } },
              avg_price: { avg: { field: "price" } },
            },
          },
        },
      },
    },
  });

  res.json(result.aggregations);
});

// GET /api/dashboard/revenue — Revenue breakdown by week and store
router.get("/revenue", async (_req, res) => {
  const result = await es.search({
    index: "orders",
    size: 0,
    aggs: {
      by_week: {
        date_histogram: { field: "order_date", calendar_interval: "week" },
        aggs: {
          by_store: {
            terms: { field: "store" },
            aggs: {
              revenue: { sum: { field: "price" } },
              avg_order_value: { avg: { field: "price" } },
            },
          },
        },
      },
    },
  });

  res.json(result.aggregations);
});

export default router;
