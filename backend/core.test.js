const assert = require('node:assert/strict');
const { modules, getModule } = require('./src/modules');
const { schemaTables } = require('./src/schema');

assert.ok(getModule('assets'));
assert.ok(getModule('opportunities'));
assert.ok(getModule('execution_tasks'));
assert.ok(getModule('equipment_records'));
assert.ok(getModule('settlements'));
assert.ok(getModule('supply_demand'));
assert.ok(getModule('supply_chain'));
assert.ok(getModule('issues'));

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
assert.ok(schemaTables.includes('execution_tasks'));
assert.ok(schemaTables.includes('equipment_records'));
assert.ok(schemaTables.includes('settlements'));
assert.ok(schemaTables.includes('supply_demand'));
assert.ok(schemaTables.includes('supply_chain_orders'));
assert.ok(schemaTables.includes('issues'));

const equipmentTypeField = modules.equipment_records.fields.find(field => field.name === 'equipmentType');
assert.ok(equipmentTypeField.options.some(([value]) => value === 'power_bank'));
assert.ok(equipmentTypeField.options.some(([value]) => value === 'memory_card'));
assert.ok(equipmentTypeField.options.some(([value]) => value === 'camera_cable'));
assert.ok(equipmentTypeField.options.some(([value]) => value === 'waist_bag'));
assert.ok(equipmentTypeField.options.some(([value]) => value === 'other'));

console.log('backend core tests passed');
