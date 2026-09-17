# Guizhou Business Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a homepage big-data dashboard focused on Guizhou's commercial map, supply-chain opportunities, and embodied-intelligence conversion.

**Architecture:** Add an authenticated dashboard API that aggregates existing SQLite records into region, industry, opportunity, and next-action summaries. Add a special frontend `dashboard` home view that uses the API rather than the generic CRUD module renderer.

**Tech Stack:** Node.js, Express, better-sqlite3, vanilla JavaScript, CSS.

---

### Task 1: Dashboard API

**Files:**
- Modify: `backend/src/app.js`
- Modify: `backend/core.test.js`

- [ ] Add a failing API test for `GET /api/dashboard/guizhou-business-map`.
- [ ] Compute summary metrics from existing tables: assets, opportunities, supply_demand, supply_chain_orders, execution_tasks.
- [ ] Return cards, region distribution, conversion funnel, supply-chain opportunities, robot opportunities, and prioritized actions.
- [ ] Require authentication and asset view permission.
- [ ] Run `node backend/core.test.js`.

### Task 2: Homepage Dashboard UI

**Files:**
- Modify: `frontend/app.js`
- Modify: `frontend/styles.css`
- Modify: `frontend/ui.test.js`

- [ ] Add failing UI assertions for dashboard nav and dashboard render functions.
- [ ] Add `dashboard` as the first homepage nav item.
- [ ] Render dashboard cards, Guizhou region bars, conversion funnel, opportunity lists, and action queue.
- [ ] Hide CRUD sidebars/editor for dashboard.
- [ ] Run `node frontend/ui.test.js`.

### Task 3: Verification

**Files:**
- All touched files.

- [ ] Run `npm run check`.
- [ ] Run `npm test`.
- [ ] Run `git diff --check`.
