# Atlas CJ Integration Design

## Scope

Integrate the useful capabilities from `terlivy/atlas-cj` into the existing operations system without adding a second Vue/Vite application. The current Express app, SQLite login, admin shell, and H5 report form remain the product shell.

## Selected Approach

Use a native integration:

- Add backend Atlas workbench services for Excel parsing, scene grouping, unit grouping, edit overlays, image/output file access, and optional Word generation.
- Expose those services under `/api/atlas/workbench/*`.
- Add an admin workbench view inside the existing vanilla JS frontend.
- Keep the existing `/api/atlas/categories` and `/api/atlas/reports` H5 APIs intact.

This avoids running two frontends and two Express servers, preserves the current deployment model, and lets collected H5 reports continue flowing into the same system.

## Configuration

The integration uses environment variables instead of the hard-coded macOS paths from `atlas-cj`:

- `ATLAS_DATA_ROOT`: directory containing Excel files, category workbook, images, and generated output.
- `ATLAS_REPORT_EXCEL`: optional explicit report Excel path.
- `ATLAS_CATEGORY_EXCEL`: optional explicit category workbook path.
- `ATLAS_IMAGES_DIR`: optional image directory.
- `ATLAS_OUTPUT_DIR`: optional generated Word output directory.
- `ATLAS_GENERATOR_SCRIPT`: optional Python Word generator script.
- `ATLAS_PYTHON_BIN`: optional Python binary.

If files are missing, the API returns empty/error states that the admin UI can display.

## Backend API

- `GET /api/atlas/workbench/summary`
- `GET /api/atlas/workbench/scenes`
- `GET /api/atlas/workbench/scenes/:name`
- `GET /api/atlas/workbench/records`
- `GET /api/atlas/workbench/units`
- `GET /api/atlas/workbench/categories`
- `GET /api/atlas/workbench/output`
- `POST /api/atlas/workbench/generate`
- `PUT /api/atlas/workbench/edits/record/:id`
- `PUT /api/atlas/workbench/edits/scene/:name`
- `DELETE /api/atlas/workbench/edits`

Admin login is required for all workbench endpoints.

## Frontend

Add a special admin module named `atlas_workbench` under the business operations menu. It shows:

- Summary cards for scenes, workstations, images, collectors, units.
- Tabs for scenes, records, categories, generated output.
- A selected scene detail panel with workstations and image names.
- Buttons for refreshing, generating selected scenes, and clearing edit overlays.

## Testing

Backend tests cover parsing a fixture workbook, grouping scenes and units, edit overlays, categories fallback, and protected API behavior. Frontend tests cover the new menu entry and workbench rendering hooks.
