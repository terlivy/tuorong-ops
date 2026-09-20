const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const XLSX = require('xlsx');
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
assert.equal(modules.atl_collection_scenarios.primaryField, 'sceneName');
assert.ok(modules.atl_collection_scenarios.fields.some(field => field.name === 'categoryName'));
assert.ok(modules.atl_collection_scenarios.fields.some(field => field.name === 'sceneName'));
assert.ok(modules.atl_collection_scenarios.fields.some(field => field.name === 'englishName'));
assert.ok(modules.atl_collection_scenarios.filters.some(([key, label]) => key === 'retail_consumer' && label === '零售与消费品'));
assert.ok(modules.atl_collection_scenarios.filters.some(([key, label]) => key === 'food_beverage' && label === '食品与饮料'));
assert.ok(modules.atl_collection_scenarios.filters.some(([key, label]) => key === 'maintenance_service' && label === '维修服务'));

const equipmentTypeField = modules.equipment_records.fields.find(field => field.name === 'equipmentType');
assert.ok(equipmentTypeField.options.some(([value]) => value === 'power_bank'));
assert.ok(equipmentTypeField.options.some(([value]) => value === 'memory_card'));
assert.ok(equipmentTypeField.options.some(([value]) => value === 'camera_cable'));
assert.ok(equipmentTypeField.options.some(([value]) => value === 'waist_bag'));
assert.ok(equipmentTypeField.options.some(([value]) => value === 'other'));

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ops-admin-'));
process.env.DB_PATH = path.join(tmpDir, 'ops-platform.db');
const atlasDataDir = path.join(tmpDir, 'atlas-data');
const atlasOutputDir = path.join(atlasDataDir, 'output');
const atlasImagesDir = path.join(atlasDataDir, 'images');
fs.mkdirSync(atlasOutputDir, { recursive: true });
fs.mkdirSync(atlasImagesDir, { recursive: true });
process.env.ATLAS_DATA_ROOT = atlasDataDir;
process.env.ATLAS_OUTPUT_DIR = atlasOutputDir;
process.env.ATLAS_IMAGES_DIR = atlasImagesDir;
process.env.ATLAS_REPORT_EXCEL = path.join(atlasDataDir, 'atlas-report.xlsx');
process.env.ATLAS_CATEGORY_EXCEL = path.join(atlasDataDir, 'atlas-categories.xlsx');
writeAtlasFixtureWorkbook(process.env.ATLAS_REPORT_EXCEL);
writeAtlasCategoryWorkbook(process.env.ATLAS_CATEGORY_EXCEL);
fs.writeFileSync(path.join(atlasImagesDir, 'front.jpg'), 'fake image');
fs.writeFileSync(path.join(atlasOutputDir, '星光门店后厨.docx'), 'fake docx');
const {
  createDb,
  hashPassword,
  listRecords,
  saveRecord,
  userHasPermission,
  writeAuditLog,
} = require('./src/db');
const {
  createAtlasWorkbench,
} = require('./src/atlas-workbench');

const db = createDb();
const workbench = createAtlasWorkbench();
const summary = workbench.getSummary();
assert.equal(summary.cards.sceneCount, 2);
assert.equal(summary.cards.recordCount, 3);
assert.equal(summary.cards.imageCount, 3);
assert.equal(summary.cards.collectorCount, 2);
assert.equal(summary.cards.unitCount, 2);
assert.equal(summary.source, 'atlas-report.xlsx');
assert.equal(workbench.getScenes().scenes[0].records.length, 2);
assert.equal(workbench.getScene('星光门店后厨').imageCount, 2);
assert.equal(workbench.getRecords().records.length, 3);
assert.equal(workbench.getUnits().units.some(unit => unit.unitName === '星光门店'), true);
assert.equal(workbench.getCategories().totalCategories, 1);
assert.equal(workbench.getCategories().totalBusinessTypes, 1);
assert.equal(workbench.getOutput().files[0].name, '星光门店后厨.docx');
workbench.setRecordEdit('BP-001', { workstation: '更新后的后厨工位' });
assert.equal(workbench.getRecords().records.find(record => record.reportId === 'BP-001').workstation, '更新后的后厨工位');
workbench.setSceneEdit('星光门店后厨', { location: '贵阳云岩区' });
assert.equal(workbench.getScene('星光门店后厨').location, '贵阳云岩区');
workbench.clearEdits();
assert.equal(workbench.getRecords().records.find(record => record.reportId === 'BP-001').workstation, '切配台');

const roles = listRecords(db, 'roles');
assert.ok(roles.some(role => role.roleCode === 'admin' && role.status === 'active'));

const atlScenes = listRecords(db, 'atl_collection_scenarios');
assert.equal(atlScenes.length, 46);
assert.ok(atlScenes.some(scene => scene.sceneCategory === 'retail_consumer' && scene.categoryName === '零售与消费品' && scene.sceneName === '便利店' && scene.englishName === 'Convenience Store'));
assert.ok(atlScenes.some(scene => scene.sceneCategory === 'food_processing' && scene.categoryName === '食品加工' && scene.sceneName === '食品饮料与农产品加工' && scene.englishName === 'Food, Beverage and Agricultural Processing'));
const linkedScene = saveRecord(db, 'atl_collection_scenarios', {
  sceneCategory: 'retail_consumer',
  categoryName: '零售与消费品',
  sceneName: '便利店',
  englishName: 'Convenience Store',
  status: 'active',
  notes: '绑定测试',
});
assert.equal(linkedScene.sceneName, '便利店');
assert.equal(linkedScene.englishName, 'Convenience Store');

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

    const unauthWorkbenchResponse = await fetch(`${baseUrl}/api/atlas/workbench/summary`);
    assert.equal(unauthWorkbenchResponse.status, 401);

    const workbenchSummaryResponse = await fetch(`${baseUrl}/api/atlas/workbench/summary`, { headers: { cookie } });
    assert.equal(workbenchSummaryResponse.status, 200);
    const workbenchSummary = await workbenchSummaryResponse.json();
    assert.equal(workbenchSummary.cards.sceneCount, 2);
    assert.equal(workbenchSummary.cards.recordCount, 3);
    assert.equal(workbenchSummary.cards.imageCount, 3);

    const workbenchScenesResponse = await fetch(`${baseUrl}/api/atlas/workbench/scenes`, { headers: { cookie } });
    assert.equal(workbenchScenesResponse.status, 200);
    const workbenchScenes = await workbenchScenesResponse.json();
    assert.equal(workbenchScenes.scenes.some(scene => scene.name === '星光门店后厨' && scene.recordCount === 2), true);

    const workbenchSceneResponse = await fetch(`${baseUrl}/api/atlas/workbench/scenes/${encodeURIComponent('星光门店后厨')}`, { headers: { cookie } });
    assert.equal(workbenchSceneResponse.status, 200);
    const workbenchScene = await workbenchSceneResponse.json();
    assert.equal(workbenchScene.name, '星光门店后厨');
    assert.equal(workbenchScene.records.length, 2);

    const workbenchGenerateResponse = await fetch(`${baseUrl}/api/atlas/workbench/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie },
      body: JSON.stringify({ scenes: ['星光门店后厨'] }),
    });
    assert.equal(workbenchGenerateResponse.status, 200);
    const workbenchGenerate = await workbenchGenerateResponse.json();
    assert.equal(workbenchGenerate.ok, false);
    assert.equal(workbenchGenerate.reason, 'generator_not_configured');

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

function writeAtlasFixtureWorkbook(filePath) {
  const rows = [
    ['报备编号', '一级分类', '细分业态', '场景名称', '采集内容概述', '工位清单', '工作内容明细', '工位数量', '图片数量', '报备状态', '采集人', '报备日期', '审批意见', '备注', '工位图片', '采集位置'],
    ['BP-001', '餐饮', '后厨', '星光门店后厨', '后厨动线采集', '切配台', '拍摄切配台', 1, 2, '已报备', '赵敏', '2026-09-19', '', '', 'front.jpg,side.jpg', '贵阳观山湖区星光路'],
    ['BP-002', '餐饮', '后厨', '星光门店后厨', '后厨动线采集', '洗碗区', '拍摄洗碗区', 1, 0, '已报备', '赵敏', '2026-09-19', '', '', '', '贵阳观山湖区星光路'],
    ['BP-003', '零售', '便利店', '优选便利店前厅', '前厅货架采集', '货架', '拍摄货架', 1, 1, '待审批', '钱磊', '2026-09-20', '', '', 'shelf.jpg', '贵阳云岩区优选路'],
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), '报备');
  XLSX.writeFile(workbook, filePath);
}

function writeAtlasCategoryWorkbook(filePath) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
    ['序号', '一级分类', '细分业态'],
    [1, '餐饮', '后厨、前厅'],
  ]), '业态分类');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
    ['说明'],
    ['业态分类（细分）', '一级分类（中英文）', '采集内容'],
    ['后厨', 'Food Service', '后厨动线'],
  ]), '业务采集表');
  XLSX.writeFile(workbook, filePath);
}
