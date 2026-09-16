const schemaTables = [
  'assets',
  'people',
  'projects',
  'opportunities',
  'execution_tasks',
  'equipment_records',
  'settlements',
  'supply_demand',
  'supply_chain_orders',
  'issues',
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
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
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
`;

module.exports = { schemaTables, schemaSql };
