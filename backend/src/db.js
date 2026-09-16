const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const { schemaSql } = require('./schema');
const { modules } = require('./modules');

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
  seedData(db);
  return db;
}

function migrate(db) {
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
  return db.prepare(`SELECT * FROM ${mod.table} ORDER BY created_at DESC`).all();
}

function getRecord(db, moduleKey, id) {
  const mod = modules[moduleKey];
  if (!mod) throw new Error('Unknown module');
  return db.prepare(`SELECT * FROM ${mod.table} WHERE id = ?`).get(id);
}

function saveRecord(db, moduleKey, record) {
  const mod = modules[moduleKey];
  if (!mod) throw new Error('Unknown module');
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

function deleteRecord(db, moduleKey, id) {
  const mod = modules[moduleKey];
  if (!mod) throw new Error('Unknown module');
  return db.prepare(`DELETE FROM ${mod.table} WHERE id = ?`).run(id);
}

module.exports = {
  DB_PATH,
  createDb,
  hashPassword,
  listRecords,
  getRecord,
  saveRecord,
  deleteRecord,
};
