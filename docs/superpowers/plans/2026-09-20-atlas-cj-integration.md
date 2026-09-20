# Atlas CJ Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `terlivy/atlas-cj` scene collection workbench features into the existing operations platform.

**Architecture:** Keep one Express server and one vanilla admin frontend. Add a focused `atlas-workbench` backend service and render it as a special admin module instead of importing the Vue app.

**Tech Stack:** Node.js, Express, SQLite, vanilla JS frontend, `xlsx` for workbook parsing, optional Python generator invocation.

---

### Task 1: Backend Workbench Service

**Files:**
- Create: `backend/src/atlas-workbench.js`
- Modify: `backend/core.test.js`
- Modify: `package.json`

- [ ] Add tests that create temporary Atlas Excel/category workbooks with `xlsx`, assert summary/scenes/records/units and edit overlays.
- [ ] Run `node backend/core.test.js` and confirm failure because `atlas-workbench` does not exist.
- [ ] Implement `backend/src/atlas-workbench.js` with configurable paths, workbook parsing, grouping, edits, output listing, and generation adapter.
- [ ] Add `xlsx` and `multer` dependencies if missing.
- [ ] Run `node backend/core.test.js` and confirm pass.

### Task 2: Backend API Routes

**Files:**
- Modify: `backend/src/app.js`
- Modify: `backend/core.test.js`

- [ ] Add API tests for authenticated `/api/atlas/workbench/*` endpoints and unauthenticated 401 behavior.
- [ ] Run `node backend/core.test.js` and confirm failure because routes are missing.
- [ ] Mount workbench routes in `app.js` behind existing auth.
- [ ] Run `node backend/core.test.js` and confirm pass.

### Task 3: Frontend Admin Workbench

**Files:**
- Modify: `frontend/app.js`
- Modify: `frontend/styles.css`
- Modify: `frontend/ui.test.js`

- [ ] Add frontend static tests for `atlas_workbench`, workbench API calls, tabs, scene detail, generate action, and CSS hooks.
- [ ] Run `node frontend/ui.test.js` and confirm failure.
- [ ] Implement the special module and renderer in the existing admin shell.
- [ ] Run `node frontend/ui.test.js` and confirm pass.

### Task 4: Verification

**Files:**
- Modify as needed only for syntax/test failures.

- [ ] Run `npm run check`.
- [ ] Run `npm test`.
- [ ] Summarize changed files and any environment variables needed.

## Self-Review

The plan covers backend service, routes, frontend integration, dependencies, and verification. It avoids adding a second runtime and uses focused tests before implementation.
