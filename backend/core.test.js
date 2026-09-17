const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { modules, getModule } = require('./src/modules');
const { schemaTables } = require('./src/schema');
const { ATLAS_CATEGORIES, flattenAtlasSubcategories } = require('./src/atlas');

assert.ok(getModule('assets'));
assert.ok(getModule('opportunities'));
assert.ok(getModule('atl_collection_scenarios'));
assert.ok(getModule('execution_tasks'));
assert.ok(getModule('equipment_records'));
assert.ok(getModule('settlements'));
assert.ok(getModule('supply_demand'));
assert.ok(getModule('supply_chain'));
assert.ok(getModule('issues'));
assert.ok(getModule('users'));
assert.ok(getModule('roles'));
assert.ok(getModule('permissions'));
assert.ok(getModule('audit_logs'));

assert.equal(modules.assets.title, '资产中心');
assert.ok(modules.assets.fields.some(field => field.name === 'wechat'));
assert.ok(modules.assets.fields.some(field => field.name === 'businessTags'));
assert.ok(modules.assets.fields.some(field => field.name === 'assetStatus'));
assert.ok(modules.assets.fields.some(field => field.name === 'cooperationStage'));
assert.equal(modules.assets.fields.find(field => field.name === 'longitude').label, '经度');
assert.equal(modules.assets.fields.find(field => field.name === 'latitude').label, '纬度');

assert.ok(schemaTables.includes('assets'));
assert.ok(schemaTables.includes('people'));
assert.ok(schemaTables.includes('projects'));
assert.ok(schemaTables.includes('opportunities'));
assert.ok(schemaTables.includes('atl_collection_scenarios'));
assert.ok(schemaTables.includes('execution_tasks'));
assert.ok(schemaTables.includes('equipment_records'));
assert.ok(schemaTables.includes('settlements'));
assert.ok(schemaTables.includes('supply_demand'));
assert.ok(schemaTables.includes('supply_chain_orders'));
assert.ok(schemaTables.includes('issues'));
assert.ok(schemaTables.includes('users'));
assert.ok(schemaTables.includes('roles'));
assert.ok(schemaTables.includes('permissions'));
assert.ok(schemaTables.includes('role_permissions'));
assert.ok(schemaTables.includes('audit_logs'));
assert.ok(schemaTables.includes('atlas_scene_reports'));

assert.equal(ATLAS_CATEGORIES.length, 6);
assert.equal(flattenAtlasSubcategories().length, 46);
assert.ok(ATLAS_CATEGORIES.some(category => category.name === '零售与消费品' && category.children.some(child => child.name === '便利店' && child.en === 'Convenience Store')));
assert.ok(ATLAS_CATEGORIES.some(category => category.name === '食品加工' && category.children.some(child => child.name === '农业农场' && child.en === 'Agricultural Farm')));

assert.equal(modules.users.table, 'users');
assert.equal(modules.roles.primaryField, 'roleName');
assert.equal(modules.permissions.primaryField, 'permissionName');
assert.equal(modules.audit_logs.readOnly, true);
assert.ok(modules.users.fields.some(field => field.name === 'password'));
assert.ok(modules.users.fields.some(field => field.name === 'role_code'));
assert.ok(modules.permissions.fields.some(field => field.name === 'roleCodes'));
assert.equal(modules.atl_collection_scenarios.title, '数据采集-ATL场景');
assert.ok(modules.atl_collection_scenarios.fields.some(field => field.name === 'assetName'));
assert.ok(modules.atl_collection_scenarios.fields.some(field => field.name === 'sceneCategory'));
assert.ok(modules.atl_collection_scenarios.fields.some(field => field.name === 'sceneName'));

const equipmentTypeField = modules.equipment_records.fields.find(field => field.name === 'equipmentType');
assert.ok(equipmentTypeField.options.some(([value]) => value === 'power_bank'));
assert.ok(equipmentTypeField.options.some(([value]) => value === 'memory_card'));
assert.ok(equipmentTypeField.options.some(([value]) => value === 'camera_cable'));
assert.ok(equipmentTypeField.options.some(([value]) => value === 'waist_bag'));
assert.ok(equipmentTypeField.options.some(([value]) => value === 'other'));

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ops-admin-'));
process.env.DB_PATH = path.join(tmpDir, 'ops-platform.db');
const {
  createDb,
  hashPassword,
  listRecords,
  saveRecord,
  userHasPermission,
  writeAuditLog,
} = require('./src/db');

const db = createDb();
const roles = listRecords(db, 'roles');
assert.ok(roles.some(role => role.roleCode === 'admin' && role.status === 'active'));

const atlScenes = listRecords(db, 'atl_collection_scenarios');
assert.ok(atlScenes.length >= 50);
assert.ok(atlScenes.some(scene => scene.sceneCategory === 'retail_consumer' && scene.sceneName === '便利店'));
assert.ok(atlScenes.some(scene => scene.sceneCategory === 'food_processing' && scene.sceneName === '干果厂'));
const linkedScene = saveRecord(db, 'atl_collection_scenarios', {
  sceneCategory: 'retail_consumer',
  sceneName: '便利店',
  assetName: '优选便利',
  assetId: 'a-002',
  collectionScope: '全量采集',
  atlPlatform: 'ATL',
  readiness: 'ready',
  status: 'active',
  notes: '绑定测试',
});
assert.equal(linkedScene.assetName, '优选便利');
assert.equal(linkedScene.collectionScope, '全量采集');

const admin = db.prepare('SELECT * FROM users WHERE username = ?').get(process.env.ADMIN_USER || 'admin');
assert.equal(admin.role_code, 'admin');
assert.equal(admin.status, 'active');
assert.equal(userHasPermission(db, admin, 'users', 'view'), true);
assert.equal(userHasPermission(db, admin, 'assets', 'delete'), true);

const operator = saveRecord(db, 'users', {
  username: 'operator',
  password: 'abc123',
  display_name: 'Operator',
  role_code: 'admin',
  status: 'active',
  notes: 'created in test',
});
assert.equal(operator.username, 'operator');
assert.equal(operator.password, undefined);
assert.equal(operator.password_hash, undefined);

const operatorRaw = db.prepare('SELECT * FROM users WHERE id = ?').get(operator.id);
assert.equal(operatorRaw.password_hash, hashPassword('abc123'));

saveRecord(db, 'users', {
  id: operator.id,
  username: 'operator',
  password: '',
  display_name: 'Operator Renamed',
  role_code: 'admin',
  status: 'active',
  notes: 'password unchanged',
});
const operatorUpdated = db.prepare('SELECT * FROM users WHERE id = ?').get(operator.id);
assert.equal(operatorUpdated.display_name, 'Operator Renamed');
assert.equal(operatorUpdated.password_hash, operatorRaw.password_hash);

writeAuditLog(db, {
  actorId: admin.id,
  actorName: admin.username,
  moduleKey: 'users',
  action: 'create',
  targetId: operator.id,
  detail: 'created operator',
  ip: '127.0.0.1',
  userAgent: 'node-test',
});
const logs = listRecords(db, 'audit_logs');
assert.equal(logs[0].actor_name, admin.username);
assert.equal(logs[0].module_key, 'users');
assert.equal(logs[0].action, 'create');
assert.equal(logs[0].target_id, operator.id);

async function runApiTests() {
  const { createApp } = require('./src/app');
  const app = createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    const publicCategoriesResponse = await fetch(`${baseUrl}/api/atlas/categories`);
    assert.equal(publicCategoriesResponse.status, 200);
    const publicCategoriesBody = await publicCategoriesResponse.json();
    assert.equal(publicCategoriesBody.categories.length, 6);
    assert.equal(publicCategoriesBody.subcategoryCount, 46);

    const login = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: process.env.ADMIN_USER || 'admin', password: process.env.ADMIN_PASSWORD || '123456' }),
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get('set-cookie').split(';')[0];

    const modulesResponse = await fetch(`${baseUrl}/api/modules`, { headers: { cookie } });
    assert.equal(modulesResponse.status, 200);
    const moduleBody = await modulesResponse.json();
    assert.equal(moduleBody.modules.users.permissions.create, true);
    assert.equal(moduleBody.modules.audit_logs.readOnly, true);

    const readOnlyResponse = await fetch(`${baseUrl}/api/modules/audit_logs/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie },
      body: JSON.stringify({ action: 'manual' }),
    });
    assert.equal(readOnlyResponse.status, 403);

    const createUserResponse = await fetch(`${baseUrl}/api/modules/users/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie },
      body: JSON.stringify({ username: 'api-user', password: 'abc123', display_name: 'API User', role_code: 'admin', status: 'active' }),
    });
    assert.equal(createUserResponse.status, 200);
    const createUserBody = await createUserResponse.json();
    assert.equal(createUserBody.record.password_hash, undefined);

    const logsResponse = await fetch(`${baseUrl}/api/modules/audit_logs/records`, { headers: { cookie } });
    assert.equal(logsResponse.status, 200);
    const logsBody = await logsResponse.json();
    assert.ok(logsBody.records.some(log => log.module_key === 'users' && log.action === 'create' && log.target_id === createUserBody.record.id));

    const dashboardResponse = await fetch(`${baseUrl}/api/dashboard/guizhou-business-map`, { headers: { cookie } });
    assert.equal(dashboardResponse.status, 200);
    const dashboard = await dashboardResponse.json();
    assert.ok(dashboard.cards.assetCount >= 2);
    assert.ok(dashboard.cards.supplyChainOpportunityCount >= 1);
    assert.ok(Array.isArray(dashboard.regionMap));
    assert.ok(dashboard.regionMap.some(region => region.name === '贵阳'));
    assert.ok(Array.isArray(dashboard.conversionFunnel));
    assert.ok(dashboard.conversionFunnel.some(item => item.key === 'dataCollection'));
    assert.ok(Array.isArray(dashboard.supplyChainOpportunities));
    assert.ok(Array.isArray(dashboard.robotOpportunities));
    assert.ok(Array.isArray(dashboard.priorityActions));

    const categoriesResponse = await fetch(`${baseUrl}/api/atlas/categories`, { headers: { cookie } });
    assert.equal(categoriesResponse.status, 200);
    const categoriesBody = await categoriesResponse.json();
    assert.equal(categoriesBody.categories.length, 6);
    assert.equal(categoriesBody.subcategoryCount, 46);

    const invalidReportResponse = await fetch(`${baseUrl}/api/atlas/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie },
      body: JSON.stringify({ sceneName: '123', contactName: 'A', phone: '10086' }),
    });
    assert.equal(invalidReportResponse.status, 400);
    const invalidReportBody = await invalidReportResponse.json();
    assert.ok(invalidReportBody.errors.includes('sceneName'));
    assert.ok(invalidReportBody.errors.includes('contactName'));
    assert.ok(invalidReportBody.errors.includes('phone'));
    assert.ok(invalidReportBody.errors.includes('location'));

    const validReportResponse = await fetch(`${baseUrl}/api/atlas/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie },
      body: JSON.stringify({
        categoryKey: 'retail_consumer',
        subcategoryKey: 'convenience_store',
        sceneName: '优选便利店',
        address: '贵阳市观山湖区测试路 18 号',
        longitude: 106.630153,
        latitude: 26.647661,
        locationAccuracy: 35,
        contactName: '张店长',
        phone: '13800008888',
        deviceType: 'multicam',
        deviceBarcode: '48291',
        photos: ['front-door.jpg'],
      }),
    });
    assert.equal(validReportResponse.status, 200);
    const validReportBody = await validReportResponse.json();
    assert.equal(validReportBody.report.sceneName, '优选便利店');
    assert.equal(validReportBody.report.categoryName, '零售与消费品');
    assert.equal(validReportBody.report.subcategoryName, '便利店');
    assert.match(validReportBody.report.sdCardCode, /^SD-\d{8}-ATL-\d{3}$/);
    assert.match(validReportBody.report.bindingTuple, /^admin-48291-优选便利店-/);
    assert.equal(validReportBody.report.status, 'pending_review');

    const reportListResponse = await fetch(`${baseUrl}/api/atlas/reports`, { headers: { cookie } });
    assert.equal(reportListResponse.status, 200);
    const reportListBody = await reportListResponse.json();
    assert.ok(reportListBody.reports.some(report => report.id === validReportBody.report.id && report.contactName === '张店长'));

    const adminPageResponse = await fetch(`${baseUrl}/admin`, { headers: { cookie } });
    assert.equal(adminPageResponse.status, 200);
    assert.match(await adminPageResponse.text(), /Tuorong Operations Management System|拓融运营管理系统/);

    const h5PageResponse = await fetch(`${baseUrl}/h5`, { headers: { cookie } });
    assert.equal(h5PageResponse.status, 200);
    assert.match(await h5PageResponse.text(), /Atlas 场景报备/);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

runApiTests()
  .then(() => console.log('backend core tests passed'))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
