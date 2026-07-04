---
name: project-rider-transactions-display
description: Real shape/display rules for rider transaction data (movement_type slugs, payment_method hidden) — applies to Balance and the future Historial change
metadata:
  type: project
---

Confirmed against real staging data while building the `balance-screen` change (2026-07-04):

- `movement_type` from `GET /riders/balance` (and presumably `GET /riders/transactions`, same shape) is an internal slug, not display-ready text — e.g. `"ride_bank"` for the commission of a completed delivery. The wireframe's illustrative labels ("Comisión entrega", "Descuento plataforma") do not match the real backend values.
- `payment_method` (e.g. `"PagoMovil"`) should **not** be shown to the rider — explicit product decision, it's not useful information for them.

**Why:** discovered only by testing the real Balance screen against staging, not from the API docs (which just describe both fields as untyped strings).

**How to apply:** `features/balance/utils/movementTypeLabel.ts` centralizes the slug→label mapping (`ride_bank` → "Carrera", humanized fallback for unknown slugs). When building the Historial (08) change (`GET /riders/transactions`, same transaction shape), reuse this same mapping and the same rule of never rendering `payment_method` — don't reintroduce it there without checking this decision first.
