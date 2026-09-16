const assert = require('node:assert/strict');
const {
  calculateCooperationMonths,
  calculateDurationHours,
  calculateCollectorSettlement,
  parseCsv,
  mapCsvRowsToRecords,
  clampMapPoint,
  buildStoreMapStats,
  calculatePartnerFinance,
  buildIssueStats,
  buildBusinessStats,
  buildStats,
  buildCollectionStats,
  filterStaff,
} = require('./ops-core');

const today = new Date('2026-09-16T00:00:00');

assert.equal(calculateCooperationMonths('2026-01-15', today), 8);
assert.equal(calculateCooperationMonths('', today), 0);

const staff = [
  { name: '张明', area: '城东', status: 'active', visitedStores: 18, signedStores: 6, cooperationStart: '2026-01-15' },
  { name: '李娜', area: '城西', status: 'trial', visitedStores: 10, signedStores: 2, cooperationStart: '2026-07-01' },
  { name: '王强', area: '城东', status: 'inactive', visitedStores: 8, signedStores: 1, cooperationStart: '' },
];

assert.deepEqual(buildStats(staff, today), {
  totalStaff: 3,
  activeStaff: 2,
  visitedStores: 36,
  signedStores: 9,
  averageCooperationMonths: 3,
});

assert.deepEqual(filterStaff(staff, { status: 'active', query: '城东' }).map(item => item.name), ['张明']);
assert.deepEqual(filterStaff(staff, { status: 'all', query: '李' }).map(item => item.name), ['李娜']);

assert.equal(calculateDurationHours('09:30', '17:00'), 7.5);
assert.equal(calculateDurationHours('10:00', '09:00'), 0);
assert.equal(calculateCollectorSettlement({ startTime: '09:00', endTime: '12:30', hourlyRate: 40 }), 140);

const collectors = [
  { collectorName: '赵敏', storeName: '星光门店', startTime: '09:00', endTime: '12:00', hourlyRate: 35 },
  { collectorName: '钱磊', storeName: '优选门店', startTime: '13:30', endTime: '18:00', hourlyRate: 40 },
];

assert.deepEqual(buildCollectionStats(collectors), {
  totalCollectors: 2,
  totalHours: 7.5,
  totalSettlement: 285,
});

const csvRows = parseCsv('name,phone,notes\nAlice,138,"visited, signed"\nBob,139,plain');
assert.deepEqual(csvRows, [
  { name: 'Alice', phone: '138', notes: 'visited, signed' },
  { name: 'Bob', phone: '139', notes: 'plain' },
]);

assert.deepEqual(mapCsvRowsToRecords(csvRows, [
  { name: 'name', label: 'Name', type: 'text' },
  { name: 'phone', label: 'Phone', type: 'text' },
  { name: 'visitedStores', label: 'Visited Stores', type: 'number' },
]), [
  { id: 'import-1', name: 'Alice', phone: '138', visitedStores: 0 },
  { id: 'import-2', name: 'Bob', phone: '139', visitedStores: 0 },
]);

assert.deepEqual(clampMapPoint({ x: -8, y: 120 }), { x: 0, y: 100 });
assert.deepEqual(buildStoreMapStats([
  { status: 'active', settlementStatus: 'settled' },
  { status: 'trial', settlementStatus: 'unsettled' },
  { status: 'active', settlementStatus: 'unsettled' },
]), {
  totalStores: 3,
  activeStores: 2,
  settledStores: 1,
  unsettledStores: 2,
});

assert.deepEqual(calculatePartnerFinance({
  confirmedHours: 10,
  approvedHours: 8,
  maxPrice: 40,
  partnerRate: 30,
}), {
  hours: 8,
  income: 320,
  payable: 240,
  profit: 80,
});

assert.deepEqual(buildIssueStats([
  { status: 'open', priority: 'high', dueDate: '2026-09-15' },
  { status: 'doing', priority: 'medium', dueDate: '2026-09-20' },
  { status: 'resolved', priority: 'high', dueDate: '2026-09-10' },
], new Date('2026-09-16T00:00:00')), {
  totalIssues: 3,
  unresolvedIssues: 2,
  highPriorityIssues: 2,
  overdueIssues: 1,
});

assert.deepEqual(buildBusinessStats([
  { stage: 'negotiating', expectedAmount: 10000, dealAmount: 0 },
  { stage: 'won', expectedAmount: 20000, dealAmount: 18000 },
  { stage: 'lost', expectedAmount: 5000, dealAmount: 0 },
]), {
  totalBusiness: 3,
  activeBusiness: 1,
  wonBusiness: 1,
  expectedAmount: 35000,
  dealAmount: 18000,
});

console.log('ops-core tests passed');
