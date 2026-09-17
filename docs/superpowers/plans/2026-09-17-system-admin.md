# System Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build complete system management for users, roles, permissions, and audit logs.

**Architecture:** Reuse the existing metadata-driven CRUD architecture by adding system modules to `backend/src/modules.js` and matching SQLite tables in `backend/src/schema.js`. Add targeted auth helpers in `backend/src/db.js` and enforce role permissions in `backend/src/app.js`, while keeping the seeded admin role unrestricted.

**Tech Stack:** Node.js, Express, better-sqlite3, JWT cookie auth, vanilla JavaScript frontend.

---

### Task 1: Lock System Module Metadata

**Files:**
- Modify: `backend/core.test.js`
- Modify: `backend/src/modules.js`
- Modify: `backend/src/schema.js`

- [ ] Add failing assertions that `users`, `roles`, `permissions`, and `audit_logs` modules exist.
- [ ] Add failing assertions that schema tables include `roles`, `permissions`, `role_permissions`, and `audit_logs`.
- [ ] Implement module metadata for the four system modules.
- [ ] Implement schema tables.
- [ ] Run `node backend/core.test.js`.

### Task 2: Add Auth, Permission, and Audit Behavior

**Files:**
- Modify: `backend/core.test.js`
- Modify: `backend/src/db.js`
- Modify: `backend/src/app.js`

- [ ] Add failing unit coverage for admin role seed data, user role assignment, password update rules, and audit logging.
- [ ] Seed `admin` role, default permissions, role-permission assignments, and the admin user role.
- [ ] Add DB helpers for permission checks, user sanitization, password hashing on save, and audit inserts.
- [ ] Enforce `view/create/update/delete/import/export` permissions for module APIs.
- [ ] Record login, logout, create, update, delete, and import operations.
- [ ] Run `node backend/core.test.js`.

### Task 3: Wire Frontend System Management

**Files:**
- Modify: `frontend/ui.test.js`
- Modify: `frontend/app.js`

- [ ] Add failing UI assertions that system management nav items are not disabled and permission-aware action hiding exists.
- [ ] Render modules based on `/api/modules`.
- [ ] Hide new/import/export/delete/save controls according to module permission metadata.
- [ ] Make audit log forms read-only and prevent destructive actions in the UI.
- [ ] Run `node frontend/ui.test.js`.

### Task 4: Full Verification

**Files:**
- All touched files.

- [ ] Run `npm run check`.
- [ ] Run `npm test`.
- [ ] Review `git diff --check`.
- [ ] Summarize changed files and verification output.
