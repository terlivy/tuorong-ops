const schemaTables = [
  'users',
  'roles',
  'permissions',
  'role_permissions',
  'audit_logs',
  'assets',
  'people',
  'projects',
  'opportunities',
  'atl_collection_scenarios',
  'execution_tasks',
  'equipment_records',
  'settlements',
  'supply_demand',
  'supply_chain_orders',
  'issues',
  'atlas_scene_reports',
];

const commonColumns = `
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
`;

const schemaSql = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role_code TEXT NOT NULL DEFAULT 'admin',
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
  ${commonColumns},
  roleCode TEXT NOT NULL UNIQUE,
  roleName TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  description TEXT
);

CREATE TABLE IF NOT EXISTS permissions (
  ${commonColumns},
  permissionCode TEXT NOT NULL UNIQUE,
  permissionName TEXT NOT NULL,
  moduleKey TEXT NOT NULL,
  action TEXT NOT NULL,
  roleCodes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_code TEXT NOT NULL,
  permission_code TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_code, permission_code)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actor_id TEXT,
  actor_name TEXT,
  module_key TEXT,
  action TEXT NOT NULL,
  target_id TEXT,
  detail TEXT,
  ip TEXT,
  user_agent TEXT
);

CREATE TABLE IF NOT EXISTS assets (
  ${commonColumns},
  name TEXT NOT NULL,
  assetType TEXT,
  contactName TEXT,
  phone TEXT,
  wechat TEXT,
  address TEXT,
  longitude REAL DEFAULT 50,
  latitude REAL DEFAULT 50,
  businessTags TEXT,
  assetStatus TEXT,
  cooperationStage TEXT,
  settlementStatus TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS people (
  ${commonColumns},
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT,
  area TEXT,
  relatedAsset TEXT,
  status TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS projects (
  ${commonColumns},
  projectCode TEXT NOT NULL,
  projectName TEXT NOT NULL,
  businessType TEXT,
  upstream TEXT,
  pricingRule TEXT,
  minPrice REAL DEFAULT 0,
  maxPrice REAL DEFAULT 0,
  status TEXT
);

CREATE TABLE IF NOT EXISTS opportunities (
  ${commonColumns},
  businessName TEXT NOT NULL,
  assetName TEXT,
  businessType TEXT,
  owner TEXT,
  stage TEXT,
  expectedAmount REAL DEFAULT 0,
  dealAmount REAL DEFAULT 0,
  nextFollowDate TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS atl_collection_scenarios (
  ${commonColumns},
  sceneCategory TEXT NOT NULL,
  categoryName TEXT,
  sceneName TEXT NOT NULL,
  englishName TEXT,
  assetName TEXT,
  assetId TEXT,
  collectionScope TEXT,
  atlPlatform TEXT,
  readiness TEXT,
  status TEXT,
  workstation TEXT,
  workDetail TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS execution_tasks (
  ${commonColumns},
  taskName TEXT NOT NULL,
  businessType TEXT,
  assetName TEXT,
  projectName TEXT,
  executor TEXT,
  taskDate TEXT,
  reportedHours REAL DEFAULT 0,
  approvedHours REAL DEFAULT 0,
  status TEXT,
  result TEXT
);

CREATE TABLE IF NOT EXISTS equipment_records (
  ${commonColumns},
  recordTitle TEXT NOT NULL,
  equipmentType TEXT,
  flowType TEXT,
  quantity REAL DEFAULT 0,
  assetName TEXT,
  handler TEXT,
  recordDate TEXT,
  status TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS settlements (
  ${commonColumns},
  settlementName TEXT NOT NULL,
  businessType TEXT,
  relatedObject TEXT,
  direction TEXT,
  amount REAL DEFAULT 0,
  cost REAL DEFAULT 0,
  profit REAL DEFAULT 0,
  status TEXT,
  invoiceStatus TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS supply_demand (
  ${commonColumns},
  demandTitle TEXT NOT NULL,
  recordType TEXT,
  assetName TEXT,
  category TEXT,
  quantity TEXT,
  budget REAL DEFAULT 0,
  matchStatus TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS supply_chain_orders (
  ${commonColumns},
  orderName TEXT NOT NULL,
  supplier TEXT,
  assetName TEXT,
  productName TEXT,
  quantity REAL DEFAULT 0,
  unitPrice REAL DEFAULT 0,
  totalAmount REAL DEFAULT 0,
  deliveryStatus TEXT,
  paymentStatus TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS issues (
  ${commonColumns},
  title TEXT NOT NULL,
  sourceModule TEXT,
  relatedObject TEXT,
  owner TEXT,
  priority TEXT,
  status TEXT,
  dueDate TEXT,
  description TEXT,
  result TEXT
);

CREATE TABLE IF NOT EXISTS atlas_scene_reports (
  ${commonColumns},
  submitter_id TEXT NOT NULL,
  submitter_name TEXT NOT NULL,
  category_key TEXT NOT NULL,
  category_name TEXT NOT NULL,
  subcategory_key TEXT NOT NULL,
  subcategory_name TEXT NOT NULL,
  subcategory_en TEXT NOT NULL,
  scene_name TEXT NOT NULL,
  address TEXT,
  longitude REAL NOT NULL,
  latitude REAL NOT NULL,
  location_accuracy REAL DEFAULT 0,
  contact_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  device_type TEXT NOT NULL,
  device_barcode TEXT NOT NULL,
  sd_card_code TEXT NOT NULL,
  binding_tuple TEXT NOT NULL UNIQUE,
  photos_json TEXT,
  status TEXT NOT NULL DEFAULT 'pending_review',
  notes TEXT
);
`;

module.exports = { schemaTables, schemaSql };
