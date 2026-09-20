const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const { schemaSql } = require('./schema');
const { modules } = require('./modules');
const { atlasReportFromRow, flattenAtlasSubcategories } = require('./atlas');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'ops-platform.db');

function ensureDir() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

function createDb() {
  ensureDir();
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(schemaSql);
  migrate(db);
  seedAdmin(db);
  seedSystemData(db);
  seedData(db);
  return db;
}

function migrate(db) {
  ensureColumn(db, 'users', 'role_code', "TEXT NOT NULL DEFAULT 'admin'");
  ensureColumn(db, 'users', 'status', "TEXT NOT NULL DEFAULT 'active'");
  ensureColumn(db, 'users', 'notes', 'TEXT');
  ensureColumn(db, 'users', 'updated_at', 'TEXT');
  db.prepare("UPDATE users SET role_code = COALESCE(NULLIF(role_code, ''), 'admin')").run();
  db.prepare("UPDATE users SET status = COALESCE(NULLIF(status, ''), 'active')").run();
  db.prepare('UPDATE users SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)').run();
  ensureColumn(db, 'assets', 'assetStatus', 'TEXT');
  ensureColumn(db, 'assets', 'cooperationStage', 'TEXT');
  const hasStatus = tableColumns(db, 'assets').includes('status');
  if (hasStatus) {
    db.prepare("UPDATE assets SET cooperationStage = COALESCE(NULLIF(cooperationStage, ''), status)").run();
    db.prepare("UPDATE assets SET assetStatus = COALESCE(NULLIF(assetStatus, ''), CASE WHEN status = 'inactive' THEN 'dormant' ELSE 'valuable' END)").run();
  }
}

function tableColumns(db, table) {
  return db.prepare(`PRAGMA table_info(${table})`).all().map(column => column.name);
}

function ensureColumn(db, table, column, type) {
  if (!tableColumns(db, table).includes(column)) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
  }
}

function seedAdmin(db) {
  const count = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  if (count > 0) return;
  const username = process.env.ADMIN_USER || 'admin';
  const password = process.env.ADMIN_PASSWORD || '123456';
  db.prepare('INSERT INTO users (id, username, password_hash, display_name) VALUES (?, ?, ?, ?)')
    .run(`u-${Date.now()}`, username, hashPassword(password), '系统管理员');
}

function seedSystemData(db) {
  seedTable(db, 'roles', [
    { id: 'role-admin', roleCode: 'admin', roleName: '管理员', status: 'active', description: '拥有系统全部权限' },
  ]);
  seedPermissions(db);
  db.prepare("UPDATE users SET role_code = COALESCE(NULLIF(role_code, ''), 'admin'), status = COALESCE(NULLIF(status, ''), 'active')").run();
}

function seedPermissions(db) {
  const actions = [
    ['view', '查看'],
    ['create', '新增'],
    ['update', '编辑'],
    ['delete', '删除'],
    ['import', '导入'],
    ['export', '导出'],
  ];
  const rows = [];
  Object.entries(modules).forEach(([moduleKey, mod]) => {
    actions.forEach(([action, actionName]) => {
      if (mod.readOnly && !['view', 'export'].includes(action)) return;
      rows.push({
        id: `perm-${moduleKey}-${action}`,
        permissionCode: `${moduleKey}:${action}`,
        permissionName: `${mod.title}-${actionName}`,
        moduleKey,
        action,
        roleCodes: 'admin',
        status: 'active',
        description: '系统默认权限',
      });
    });
  });
  seedTable(db, 'permissions', rows);
  const count = db.prepare('SELECT COUNT(*) AS count FROM role_permissions').get().count;
  if (count > 0) return;
  rows.forEach(row => {
    db.prepare('INSERT OR IGNORE INTO role_permissions (role_code, permission_code) VALUES (?, ?)')
      .run('admin', row.permissionCode);
  });
}

function seedData(db) {
  seedTable(db, 'assets', [
    { id: 'a-001', name: '星光门店', assetType: 'store', contactName: '周经理', phone: '13800008888', wechat: 'zg-13800008888', address: '中山路 88 号', longitude: 116.397428, latitude: 39.90923, businessTags: '数据采集,售电,供应链', assetStatus: 'key', cooperationStage: 'active', settlementStatus: 'unsettled', notes: '核心合作门店' },
    { id: 'a-002', name: '优选便利', assetType: 'store', contactName: '刘店长', phone: '13900009999', wechat: 'youxuan-store', address: '建设路 204 号', longitude: 116.407526, latitude: 39.90403, businessTags: '数据采集,供需撮合', assetStatus: 'valuable', cooperationStage: 'trial', settlementStatus: 'pending', notes: '试跑门店' },
  ]);
  seedTable(db, 'people', [
    { id: 'pe-001', name: '张明', phone: '13800001234', role: 'business', area: '城东片区', relatedAsset: '', status: 'active', notes: '业务负责人' },
    { id: 'pe-002', name: '赵敏', phone: '13600001234', role: 'collector', area: '城东片区', relatedAsset: '星光门店', status: 'active', notes: '采集执行人' },
  ]);
  seedTable(db, 'projects', [
    { id: 'pr-001', projectCode: 'TR-001', projectName: '蚂蚁数据采集', businessType: 'data_collection', upstream: '世纪恒通科技股份有限公司', pricingRule: '500H 以上 35 元/H；500H 以下 40 元/H', minPrice: 35, maxPrice: 40, status: 'active' },
    { id: 'pr-002', projectCode: 'EL-001', projectName: '门店售电业务', businessType: 'electricity', upstream: '售电服务商', pricingRule: '按度电返佣和服务费结算', minPrice: 0, maxPrice: 0, status: 'pending' },
  ]);
  seedTable(db, 'opportunities', [
    { id: 'o-001', businessName: '星光门店采集扩量', assetName: '星光门店', businessType: 'data_collection', owner: '张明', stage: 'negotiating', expectedAmount: 12000, dealAmount: 0, nextFollowDate: '2026-09-25', notes: '增加晚间采集场次' },
  ]);
  seedAtlCollectionScenarios(db);
  seedTable(db, 'execution_tasks', [
    { id: 't-001', taskName: '星光门店上午采集', businessType: 'data_collection', assetName: '星光门店', projectName: '蚂蚁数据采集', executor: '赵敏', taskDate: '2026-09-15', reportedHours: 4.5, approvedHours: 4.5, status: 'done', result: '已提交日报' },
  ]);
  seedTable(db, 'equipment_records', [
    { id: 'eq-001', recordTitle: '星光门店采集设备出库', equipmentType: 'power_bank', flowType: 'outbound', quantity: 2, assetName: '星光门店上午采集', handler: '赵敏', recordDate: '2026-09-15', status: 'normal', notes: '含备用充电宝 1 个' },
    { id: 'eq-002', recordTitle: '内存卡备用入库', equipmentType: 'memory_card', flowType: 'spare', quantity: 5, assetName: '仓库备用', handler: '张明', recordDate: '2026-09-15', status: 'normal', notes: '采集业务备用' },
  ]);
  seedTable(db, 'settlements', [
    { id: 'se-001', settlementName: '星光门店采集结算', businessType: 'data_collection', relatedObject: '星光门店', direction: 'payable', amount: 157.5, cost: 157.5, profit: 22.5, status: 'pending', invoiceStatus: '无需发票', notes: '待下游结算' },
  ]);
  seedTable(db, 'supply_demand', [
    { id: 'sd-001', demandTitle: '星光门店需要低价纸巾供应', recordType: 'demand', assetName: '星光门店', category: '日耗品', quantity: '20 箱/月', budget: 1500, matchStatus: 'pending', notes: '可供应链撮合' },
  ]);
  seedTable(db, 'supply_chain_orders', [
    { id: 'sc-001', orderName: '星光门店纸巾试单', supplier: '本地日耗品供应商', assetName: '星光门店', productName: '纸巾', quantity: 20, unitPrice: 68, totalAmount: 1360, deliveryStatus: 'pending', paymentStatus: '未回款', notes: '待确认配送时间' },
  ]);
  seedTable(db, 'issues', [
    { id: 'i-001', title: '优选便利审批工时未确认', sourceModule: '执行任务管理', relatedObject: '优选便利', owner: '李娜', priority: 'high', status: 'doing', dueDate: '2026-09-17', description: '日报和甲方确认存在差异', result: '已联系上游核对' },
  ]);
}

function seedAtlCollectionScenarios(db) {
  const subcats = flattenAtlasSubcategories();
  const rows = subcats.map((sub, index) => ({
    id: `atl-${sub.categoryKey}-${index + 1}`,
    sceneCategory: sub.categoryKey,
    categoryName: sub.categoryName,
    sceneName: sub.name,
    englishName: sub.en,
    assetName: '',
    assetId: '',
    collectionScope: 'full',
    atlPlatform: 'ATL',
    readiness: 'candidate',
    status: 'candidate',
    notes: '默认全量采集场景库，可绑定到具体门店/资产',
  }));
  seedTable(db, 'atl_collection_scenarios', rows);
}

function seedTable(db, table, rows) {
  const count = db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
  if (count > 0) return;
  rows.forEach(row => insertRecord(db, table, row));
}

function insertRecord(db, table, record) {
  const keys = Object.keys(record);
  const placeholders = keys.map(() => '?').join(', ');
  db.prepare(`INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`)
    .run(...keys.map(key => record[key]));
}

function listRecords(db, moduleKey) {
  const mod = modules[moduleKey];
  if (!mod) throw new Error('Unknown module');
  return db.prepare(`SELECT * FROM ${mod.table} ORDER BY created_at DESC`).all().map(record => sanitizeRecord(mod, record));
}

function getRecord(db, moduleKey, id) {
  const mod = modules[moduleKey];
  if (!mod) throw new Error('Unknown module');
  return sanitizeRecord(mod, db.prepare(`SELECT * FROM ${mod.table} WHERE id = ?`).get(id));
}

function saveRecord(db, moduleKey, record) {
  const mod = modules[moduleKey];
  if (!mod) throw new Error('Unknown module');
  if (mod.readOnly) throw new Error('Read-only module');
  if (moduleKey === 'users') return saveUserRecord(db, record);
  const existing = record.id ? getRecord(db, moduleKey, record.id) : null;
  const id = record.id || `${moduleKey}-${Date.now()}`;
  const payload = { ...record, id, updated_at: new Date().toISOString() };
  delete payload.created_at;
  if (existing) {
    const keys = Object.keys(payload).filter(key => key !== 'id');
    db.prepare(`UPDATE ${mod.table} SET ${keys.map(key => `${key} = ?`).join(', ')} WHERE id = ?`)
      .run(...keys.map(key => payload[key]), id);
  } else {
    insertRecord(db, mod.table, payload);
  }
  return getRecord(db, moduleKey, id);
}

function saveUserRecord(db, record) {
  const existing = record.id ? db.prepare('SELECT * FROM users WHERE id = ?').get(record.id) : null;
  const id = record.id || `users-${Date.now()}`;
  const passwordHash = record.password
    ? hashPassword(record.password)
    : existing?.password_hash || hashPassword(process.env.ADMIN_PASSWORD || '123456');
  const payload = {
    id,
    username: record.username,
    password_hash: passwordHash,
    display_name: record.display_name || record.displayName || record.username,
    role_code: record.role_code || 'admin',
    status: record.status || 'active',
    notes: record.notes || '',
    updated_at: new Date().toISOString(),
  };
  if (existing) {
    db.prepare('UPDATE users SET username = ?, password_hash = ?, display_name = ?, role_code = ?, status = ?, notes = ?, updated_at = ? WHERE id = ?')
      .run(payload.username, payload.password_hash, payload.display_name, payload.role_code, payload.status, payload.notes, payload.updated_at, id);
  } else {
    db.prepare('INSERT INTO users (id, username, password_hash, display_name, role_code, status, notes, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(payload.id, payload.username, payload.password_hash, payload.display_name, payload.role_code, payload.status, payload.notes, payload.updated_at);
  }
  return getRecord(db, 'users', id);
}

function sanitizeRecord(mod, record) {
  if (!record) return record;
  const sanitized = { ...record };
  (mod.protectedFields || []).forEach(key => delete sanitized[key]);
  delete sanitized.password;
  return sanitized;
}

function deleteRecord(db, moduleKey, id) {
  const mod = modules[moduleKey];
  if (!mod) throw new Error('Unknown module');
  if (mod.readOnly) throw new Error('Read-only module');
  return db.prepare(`DELETE FROM ${mod.table} WHERE id = ?`).run(id);
}

function userHasPermission(db, user, moduleKey, action) {
  if (!user || user.status === 'inactive') return false;
  if (user.role_code === 'admin') return true;
  const permission = db.prepare(`
    SELECT p.permissionCode
    FROM permissions p
    LEFT JOIN role_permissions rp ON rp.permission_code = p.permissionCode
    WHERE p.moduleKey = ?
      AND p.action = ?
      AND p.status = 'active'
      AND (rp.role_code = ? OR instr(',' || COALESCE(p.roleCodes, '') || ',', ',' || ? || ',') > 0)
    LIMIT 1
  `).get(moduleKey, action, user.role_code, user.role_code);
  return Boolean(permission);
}

function writeAuditLog(db, entry) {
  const id = entry.id || `log-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  db.prepare(`
    INSERT INTO audit_logs (id, actor_id, actor_name, module_key, action, target_id, detail, ip, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    entry.actorId || '',
    entry.actorName || '',
    entry.moduleKey || '',
    entry.action,
    entry.targetId || '',
    entry.detail || '',
    entry.ip || '',
    entry.userAgent || '',
  );
  return getRecord(db, 'audit_logs', id);
}

function createAtlasSceneReport(db, report) {
  const keys = Object.keys(report);
  const placeholders = keys.map(() => '?').join(', ');
  db.prepare(`INSERT INTO atlas_scene_reports (${keys.join(', ')}) VALUES (${placeholders})`)
    .run(...keys.map(key => report[key]));
  return getAtlasSceneReport(db, report.id);
}

function getAtlasSceneReport(db, id) {
  const row = db.prepare('SELECT * FROM atlas_scene_reports WHERE id = ?').get(id);
  return row ? atlasReportFromRow(row) : null;
}

function listAtlasSceneReports(db, submitterId) {
  const rows = submitterId
    ? db.prepare('SELECT * FROM atlas_scene_reports WHERE submitter_id = ? ORDER BY created_at DESC').all(submitterId)
    : db.prepare('SELECT * FROM atlas_scene_reports ORDER BY created_at DESC').all();
  return rows.map(atlasReportFromRow);
}

module.exports = {
  DB_PATH,
  createDb,
  hashPassword,
  listRecords,
  getRecord,
  saveRecord,
  deleteRecord,
  userHasPermission,
  writeAuditLog,
  createAtlasSceneReport,
  getAtlasSceneReport,
  listAtlasSceneReports,
};
