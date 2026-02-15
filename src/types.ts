// types.ts — Shared types for Clee's Keys

export interface Order {
  id: number;
  order_date: string;
  description: string;
  key_type: string;
  price: number;
  status: string;
  customer_id: string;
  store: string;
}

export interface ServiceLog {
  id: number;
  timestamp: string;
  message: string;
  service_type: string;
  technician: string;
  job_id: string;
  duration_ms: number;
}

export interface KeyInventoryItem {
  id: number;
  sku: string;
  brand: string;
  key_type: string;
  description: string;
  quantity: number;
  price: number;
  location: string;
  updated_at: string;
}

export interface Appointment {
  id: number;
  appointment_date: string;
  customer_id: string;
  service_type: string;
  technician: string;
  status: string;
  notes: string | null;
  address: string;
}

export interface CustomerBillingRecord {
  id: number;
  invoice_date: string;
  customer_id: string;
  description: string;
  amount: number;
  status: string;
  payment_method: string | null;
}
