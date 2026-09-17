# Atlas 场景报备采集 H5 Design

## Scope

Build option B: a usable mobile-first H5 MVP integrated into the existing operations system. The H5 lives inside the current Express/static frontend app and persists report data to the existing SQLite database.

## User Flow

Collectors open `/h5/atlas-report`, log in with the existing account session, and complete a four-step report:

1. Category: choose one of 6 top-level Atlas categories and one of 46 subcategories with Chinese and English names.
2. Scene: enter scene name, address, GPS longitude/latitude, positioning accuracy, and storefront photo references.
3. Merchant: enter required contact name and mobile phone.
4. Device: bind device type, scanned device barcode, generated SD card number, and generated person-device-scene tuple.

## Validation

The backend enforces the core rules from the Word proposal:

- contact name is required, 2-20 characters.
- phone is required and must match mainland China mobile format: 11 digits, starts with `1`.
- longitude and latitude are required numeric values.
- category and subcategory must match the Atlas category library.
- scene Chinese name is required, 2-30 characters, not pure digits.
- device barcode is required and treated as scanner-supplied by the H5.

## Architecture

Add focused Atlas helpers beside the current backend modules rather than replacing the generic module system. The H5 uses a standalone static page to avoid disturbing the desktop admin UI. Backend APIs are small and explicit:

- `GET /api/atlas/categories`
- `GET /api/atlas/reports`
- `POST /api/atlas/reports`

## Data Model

Add `atlas_scene_reports` to SQLite with report fields, generated tuple, status, submitter, and timestamps. Store photo names as JSON text for the MVP. Existing auth middleware protects the APIs.

## Testing

Extend the existing Node test files:

- backend tests validate category count, API validation failures, successful report creation, tuple generation, and persistence.
- frontend tests validate the standalone H5 assets contain the required steps, mandatory fields, category labels, geolocation, file upload, and scanner interaction hooks.
