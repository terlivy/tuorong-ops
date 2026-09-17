const $ = selector => document.querySelector(selector);

const state = {
  modules: {},
  dashboard: null,
  dashboardError: '',
  config: {},
  currentModule: 'dashboard',
  expandedNavGroups: [],
  records: [],
  selectedId: '',
  filter: 'all',
  query: '',
  amapLoading: null,
  amapMap: null,
};

const loginPage = $('#loginPage');
const appShell = $('#appShell');
const workspace = $('.workspace');
const appNav = $('#appNav');
const moduleSidebar = $('.module-sidebar');
const toolbarSearch = $('.toolbar-search');
const filters = $('#filters');
const miniList = $('#miniList');
const stats = $('#stats');
const tableWrap = $('.table-wrap');
const table = $('#dataTable');
const tableHead = $('#tableHead');
const tableBody = $('#tableBody');
const mapView = $('#mapView');
const recordForm = $('#recordForm');
const editor = $('.editor');
const importFile = $('#importFile');

const DASHBOARD_MODULE = {
  title: '贵州商业版图',
  primaryField: 'title',
  filters: [['all', '全部']],
  fields: [],
  permissions: { view: true },
  dashboard: true,
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `请求失败：${response.status}`);
  }
  return response.json();
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}

function money(value) {
  return `¥ ${Math.round(Number(value || 0) * 100) / 100}`;
}

function labelFor(value) {
  const labels = {
    active: '合作中', trial: '试跑中', inactive: '已停用', pending: '待确认',
    settled: '已结算', unsettled: '未结算', paid: '已结算', receivable: '应收',
    payable: '应付', lead: '线索', contacted: '已联系', negotiating: '洽谈中',
    won: '已成交', lost: '已流失', open: '未处理', doing: '处理中', resolved: '已解决',
    done: '已完成', blocked: '受阻', shipping: '配送中', data_collection: '数据采集',
    electricity: '售电业务', supply_chain: '供应链业务', matching: '供需撮合',
    valuable: '有效资产', verify: '待核实', key: '重点资产', dormant: '沉睡资产', invalid: '无效资产',
    untouched: '未接触', interested: '意向中', paused: '暂停合作', failed: '合作失败',
    power_bank: '充电宝', memory_card: '内存卡', camera_cable: '摄像头线', waist_bag: '腰包',
    inbound: '入库', outbound: '出库', return: '归还', spare: '备用', damage: '报损',
    damaged: '损坏',
  };
  return labels[value] || value || '未设置';
}

function statusPill(value) {
  return `<span class="status ${escapeHtml(value)}">${escapeHtml(labelFor(value))}</span>`;
}

async function boot() {
  try {
    await api('/api/auth/me');
    await loadConfig();
    await loadModules();
    await showApp();
  } catch {
    showLogin();
  }
}

async function loadConfig() {
  state.config = await api('/api/config');
}

async function loadModules() {
  const result = await api('/api/modules');
  state.modules = result.modules;
  state.currentModule = state.currentModule || 'dashboard';
}

async function loadRecords() {
  if (state.currentModule === 'dashboard') {
    await loadDashboard();
    state.records = [];
    return;
  }
  const result = await api(`/api/modules/${state.currentModule}/records`);
  state.records = result.records;
  if (!state.selectedId && state.records[0]) state.selectedId = state.records[0].id;
}

async function loadDashboard() {
  try {
    state.dashboard = await api('/api/dashboard/guizhou-business-map');
    state.dashboardError = '';
  } catch (error) {
    state.dashboard = null;
    state.dashboardError = error.message || '驾驶舱数据加载失败';
  }
}

function showLogin() {
  loginPage.hidden = false;
  appShell.hidden = true;
}

async function showApp() {
  loginPage.hidden = true;
  appShell.hidden = false;
  await loadRecords();
  render();
}

function currentModule() {
  if (state.currentModule === 'dashboard') return DASHBOARD_MODULE;
  return state.modules[state.currentModule];
}

function permissionsForCurrentModule() {
  return currentModule()?.permissions || {};
}

function canCreate() {
  return Boolean(permissionsForCurrentModule().create);
}

function canUpdate() {
  return Boolean(permissionsForCurrentModule().update);
}

function canDelete() {
  return Boolean(permissionsForCurrentModule().delete);
}

function canImport() {
  return Boolean(permissionsForCurrentModule().import);
}

function canExport() {
  return Boolean(permissionsForCurrentModule().export);
}

function filteredRecords() {
  const mod = currentModule();
  const q = state.query.trim().toLowerCase();
  return state.records.filter(record => {
    const filterOk = state.filter === 'all' || Object.values(record).includes(state.filter) || record.status === state.filter || record.assetStatus === state.filter || record.cooperationStage === state.filter || record.stage === state.filter || record.businessType === state.filter || record.role === state.filter || record.direction === state.filter || record.recordType === state.filter || record.deliveryStatus === state.filter;
    const haystack = mod.fields.map(field => String(record[field.name] || '').toLowerCase()).join(' ');
    return filterOk && (!q || haystack.includes(q));
  });
}

function render() {
  const mod = currentModule();
  renderAppNav();
  if (state.currentModule === 'dashboard') {
    renderDashboard();
    return;
  }
  workspace.classList.remove('dashboard-mode');
  workspace.classList.toggle('no-sidebar', !shouldShowModuleSidebar());
  const dashboardRoot = $('#dashboardRoot');
  if (dashboardRoot) dashboardRoot.hidden = true;
  moduleSidebar.hidden = !shouldShowModuleSidebar();
  toolbarSearch.hidden = false;
  editor.hidden = false;
  $('#moduleTitle').textContent = mod.title;
  $('#moduleDesc').textContent = mod.readOnly ? `${mod.title}为只读审计台账。` : `${mod.title}台账，支持授权范围内的增删改查、导入导出。`;
  $('#searchInput').placeholder = `搜索${mod.title}`;
  renderToolbarPermissions();
  renderFilters();
  renderStats();
  renderList();
  renderDataView();
  renderForm();
}

function renderToolbarPermissions() {
  $('#newBtn').hidden = !canCreate();
  $('#importBtn').hidden = !canImport();
  $('#exportBtn').hidden = !canExport();
}

function renderDashboard() {
  const data = state.dashboard || {};
  const errorHtml = state.dashboardError
    ? `<div class="dashboard-alert">贵州商业版图数据暂时无法加载：${escapeHtml(state.dashboardError)}。如果刚更新过系统，请重启后端服务。</div>`
    : '';
  workspace.classList.add('dashboard-mode');
  workspace.classList.add('no-sidebar');
  moduleSidebar.hidden = true;
  toolbarSearch.hidden = true;
  editor.hidden = true;
  $('#moduleTitle').textContent = '贵州商业版图';
  $('#moduleDesc').textContent = '用数采信任关系沉淀门店画像，识别供应链整合与机器人落地机会。';
  $('#newBtn').hidden = true;
  $('#importBtn').hidden = true;
  $('#exportBtn').hidden = true;
  stats.innerHTML = dashboardCards(data.cards || {});
  table.hidden = true;
  mapView.hidden = true;
  $('#emptyState').hidden = true;
  let dashboardRoot = $('#dashboardRoot');
  if (!dashboardRoot) {
    tableWrap.insertAdjacentHTML('beforeend', '<div id="dashboardRoot"></div>');
    dashboardRoot = $('#dashboardRoot');
  }
  dashboardRoot.hidden = false;
  dashboardRoot.innerHTML = `
    ${errorHtml}
    <section class="dashboard-grid">
      <div class="guizhou-map-panel">
        <div class="dashboard-section-title"><h3>贵州省商业热力</h3><span>门店资源分布</span></div>
        <div class="region-bars">${regionBars(data.regionMap || [])}</div>
      </div>
      <div class="dashboard-panel">
        <div class="dashboard-section-title"><h3>破局漏斗</h3><span>数采到供应链再到机器人</span></div>
        <div class="funnel-list">${funnelRows(data.conversionFunnel || [])}</div>
      </div>
      <div class="dashboard-panel opportunity-lane">
        <div class="dashboard-section-title"><h3>供应链机会</h3><span>把老板赚补贴变成老板省成本</span></div>
        ${opportunityList(data.supplyChainOpportunities || [], 'estimatedValue')}
      </div>
      <div class="dashboard-panel opportunity-lane">
        <div class="dashboard-section-title"><h3>机器人试点</h3><span>具身智能代理与运维候选</span></div>
        ${robotList(data.robotOpportunities || [])}
      </div>
      <div class="dashboard-panel action-panel">
        <div class="dashboard-section-title"><h3>下一步动作</h3><span>优先推进清单</span></div>
        ${actionList(data.priorityActions || [])}
      </div>
    </section>`;
}

function dashboardCards(cards) {
  return [
    ['资产池', cards.assetCount || 0],
    ['高价值门店', cards.keyAssetCount || 0],
    ['稳定关系', cards.activeRelationshipCount || 0],
    ['数采触点', cards.dataCollectionTouchpointCount || 0],
    ['供应链机会', cards.supplyChainOpportunityCount || 0],
    ['机器人候选', cards.robotOpportunityCount || 0],
  ].map(([label, value]) => `<div class="stat"><span>${label}</span><b>${value}</b></div>`).join('');
}

function regionBars(regions) {
  const max = Math.max(1, ...regions.map(region => region.count || 0));
  return regions.map(region => {
    const width = Math.max(8, Math.round(((region.count || 0) / max) * 100));
    return `<div class="region-row"><span>${escapeHtml(region.name)}</span><div><i style="width:${width}%"></i></div><b>${region.count || 0}</b></div>`;
  }).join('');
}

function funnelRows(rows) {
  const max = Math.max(1, ...rows.map(row => row.count || 0));
  return rows.map(row => {
    const width = Math.max(10, Math.round(((row.count || 0) / max) * 100));
    return `<div class="funnel-row"><div><b>${escapeHtml(row.label)}</b><span>${escapeHtml(row.key)}</span></div><strong>${row.count || 0}</strong><i style="width:${width}%"></i></div>`;
  }).join('');
}

function opportunityList(items, amountKey) {
  if (!items.length) return '<p class="dashboard-empty">暂无待聚合需求</p>';
  return `<div class="dashboard-list">${items.map(item => `<article><b>${escapeHtml(item.title)}</b><span>${escapeHtml(item.assetName || '')}</span><p>${escapeHtml(item.category || '')} · ${money(item[amountKey] || 0)}</p><em>${escapeHtml(item.action || '')}</em></article>`).join('')}</div>`;
}

function robotList(items) {
  if (!items.length) return '<p class="dashboard-empty">暂无机器人候选门店</p>';
  return `<div class="dashboard-list">${items.map(item => `<article><b>${escapeHtml(item.assetName)}</b><span>${escapeHtml(item.region)}</span><p>${escapeHtml(item.scene)}</p><em>${escapeHtml(item.reason)}</em></article>`).join('')}</div>`;
}

function actionList(items) {
  if (!items.length) return '<p class="dashboard-empty">暂无优先动作</p>';
  return `<ol class="action-list">${items.map(item => `<li><b>${escapeHtml(item.title)}</b><span>${escapeHtml(item.target || '')}</span><p>${escapeHtml(item.detail || '')}</p></li>`).join('')}</ol>`;
}

const MENU_GROUPS = [
  { title: '首页', items: ['dashboard', 'assets'] },
  { title: '系统管理', items: ['users', 'roles', 'permissions', 'audit_logs'] },
  { title: '产品中心', items: ['projects'] },
  { title: '人员管理', items: ['people'] },
  { title: '业务运营', items: ['opportunities', 'atl_collection_scenarios', 'execution_tasks', 'equipment_records'] },
  { title: '财务结算', items: ['settlements'] },
  { title: '供应链', items: ['supply_demand', 'supply_chain'] },
  { title: '问题管理', items: ['issues'] },
];

const DEFAULT_EXPANDED_GROUPS = [
  MENU_GROUPS[0].title,
  MENU_GROUPS[4].title,
  MENU_GROUPS[6].title,
];

const SYSTEM_MODULES = ['users', 'roles', 'permissions', 'audit_logs'];

function shouldShowModuleSidebar() {
  return state.currentModule !== 'dashboard' && !SYSTEM_MODULES.includes(state.currentModule);
}

function renderAppNav() {
  if (!state.expandedNavGroups.length) state.expandedNavGroups = [...DEFAULT_EXPANDED_GROUPS];
  appNav.innerHTML = MENU_GROUPS.map(group => {
    const isExpanded = state.expandedNavGroups.includes(group.title) || group.items.includes(state.currentModule);
    const visibleItems = isExpanded ? group.items.filter(key => key === 'dashboard' || state.modules[key]) : [];
    const items = visibleItems.map(key => {
      const mod = key === 'dashboard' ? DASHBOARD_MODULE : state.modules[key];
      return `<button class="nav-item${key === state.currentModule ? ' active' : ''}" data-module="${key}" type="button">${mod.title}</button>`;
    }).join('');
    return `<section class="nav-group${isExpanded ? ' active' : ''}"><button class="nav-group-toggle" type="button" data-group="${group.title}">${group.title}</button>${items}</section>`;
  }).join('');

  appNav.querySelectorAll('.nav-group-toggle').forEach(button => button.addEventListener('click', () => {
    if (state.expandedNavGroups.includes(button.dataset.group)) {
      state.expandedNavGroups = state.expandedNavGroups.filter(group => group !== button.dataset.group);
    } else {
      state.expandedNavGroups = [...state.expandedNavGroups, button.dataset.group];
    }
    renderAppNav();
  }));

  appNav.querySelectorAll('.nav-item:not(:disabled)').forEach(button => button.addEventListener('click', async () => {
    state.currentModule = button.dataset.module;
    const group = MENU_GROUPS.find(item => item.items.includes(state.currentModule));
    if (group && !state.expandedNavGroups.includes(group.title)) {
      state.expandedNavGroups = [...state.expandedNavGroups, group.title];
    }
    state.selectedId = '';
    state.filter = 'all';
    state.query = '';
    $('#searchInput').value = '';
    await loadRecords();
    render();
  }));
}

function renderFilters() {
  const mod = currentModule();
  filters.innerHTML = mod.filters.map(([key, label]) => `<button class="filter${state.filter === key ? ' active' : ''}" type="button" data-filter="${key}"><span>${label}</span><span>${countForFilter(key)}</span></button>`).join('');
  filters.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
    state.filter = button.dataset.filter;
    render();
  }));
}

function countForFilter(key) {
  if (key === 'all') return state.records.length;
  return state.records.filter(record => Object.values(record).includes(key)).length;
}

function renderStats() {
  const records = state.records;
  const amount = records.reduce((sum, record) => sum + Number(record.dealAmount || record.amount || record.totalAmount || record.profit || 0), 0);
  const pending = records.filter(record => ['pending', 'open', 'doing', 'unsettled'].some(value => Object.values(record).includes(value))).length;
  stats.innerHTML = [
    ['记录数', records.length],
    ['待处理', pending],
    ['金额汇总', money(amount)],
    ['当前筛选', filteredRecords().length],
  ].map(([label, value]) => `<div class="stat"><span>${label}</span><b>${value}</b></div>`).join('');
}

function renderList() {
  const mod = currentModule();
  miniList.innerHTML = filteredRecords().map(record => `<button class="person-card${record.id === state.selectedId ? ' active' : ''}" type="button" data-id="${record.id}"><b>${escapeHtml(record[mod.primaryField])}</b><p class="subtle">${escapeHtml(record.businessType || record.status || record.stage || record.role || '')}</p></button>`).join('');
  miniList.querySelectorAll('.person-card').forEach(button => button.addEventListener('click', () => {
    state.selectedId = button.dataset.id;
    render();
  }));
}

function renderDataView() {
  if (state.currentModule === 'assets') {
    table.hidden = true;
    mapView.hidden = false;
    renderMap();
    return;
  }
  table.hidden = false;
  mapView.hidden = true;
  const mod = currentModule();
  tableHead.innerHTML = `<tr>${mod.fields.slice(0, 8).map(field => `<th>${field.label}</th>`).join('')}</tr>`;
  tableBody.innerHTML = filteredRecords().map(record => `<tr class="${record.id === state.selectedId ? 'selected' : ''}" data-id="${record.id}">${mod.fields.slice(0, 8).map(field => `<td>${renderCell(record, field)}</td>`).join('')}</tr>`).join('');
  tableBody.querySelectorAll('tr').forEach(row => row.addEventListener('click', () => {
    state.selectedId = row.dataset.id;
    render();
  }));
  $('#emptyState').hidden = filteredRecords().length > 0;
}

function renderCell(record, field) {
  const value = record[field.name];
  if (['status', 'assetStatus', 'cooperationStage', 'stage', 'businessType', 'role', 'direction', 'deliveryStatus', 'recordType', 'equipmentType', 'flowType'].includes(field.name)) return statusPill(value);
  if (field.type === 'number' && /amount|price|cost|profit|budget/i.test(field.name)) return money(value);
  return escapeHtml(value);
}

function renderMap() {
  if (state.config.amapKey) {
    renderAmap();
    return;
  }
  renderFallbackMap();
}

function renderFallbackMap() {
  const records = filteredRecords();
  const selected = records.find(record => record.id === state.selectedId) || records[0];
  const nodes = records.map(record => {
    const x = pseudoMapX(record.longitude);
    const y = pseudoMapY(record.latitude);
    const icon = assetTypeIcon(record);
    return `<button class="map-node${record.id === state.selectedId ? ' active' : ''}" style="left:${x}%;top:${y}%;--pin:${icon.color}" data-id="${record.id}" type="button"><span class="map-pin">${icon.symbol}</span><span class="map-label">${escapeHtml(record.name)} · ${icon.label}</span></button>`;
  }).join('');
  mapView.innerHTML = `<svg class="map-bg" viewBox="0 0 100 100" preserveAspectRatio="none">${buildMapBlocks()}<path d="M-5,74 L105,28" stroke="#eef1f7" stroke-width="17" fill="none"/><path d="M-5,74 L105,28" stroke="#d6deeb" stroke-width="1.2" stroke-dasharray="7 9" fill="none"/></svg>${nodes}${selected ? mapCard(selected) : ''}`;
  mapView.querySelectorAll('.map-node').forEach(node => node.addEventListener('click', () => {
    state.selectedId = node.dataset.id;
    render();
  }));
}

async function renderAmap() {
  mapView.innerHTML = '<div id="amapContainer" class="amap-container"></div>';
  try {
    await loadAmapScript();
    const records = filteredRecords();
    const validRecords = records.filter(hasLngLat);
    const center = validRecords.length
      ? [Number(validRecords[0].longitude), Number(validRecords[0].latitude)]
      : [116.397428, 39.90923];

    state.amapMap = new AMap.Map('amapContainer', {
      zoom: validRecords.length ? 13 : 5,
      center,
      resizeEnable: true,
    });
    locateCurrentPosition(state.amapMap);

    validRecords.forEach(record => {
      const markerContent = amapMarkerContent(record);
      const marker = new AMap.Marker({
        position: [Number(record.longitude), Number(record.latitude)],
        title: record.name,
        content: markerContent,
      });
      marker.on('click', () => {
        selectMapRecord(record.id);
      });
      markerContent.addEventListener('click', event => {
        event.stopPropagation();
        selectMapRecord(record.id);
      });
      state.amapMap.add(marker);
    });

    if (validRecords.length > 1) state.amapMap.setFitView();
    const selected = records.find(record => record.id === state.selectedId) || records[0];
    if (selected) mapView.insertAdjacentHTML('beforeend', mapCard(selected));
  } catch (error) {
    mapView.innerHTML = `<div class="empty">高德地图加载失败，已切换为简易地图。${escapeHtml(error.message || '')}</div>`;
    setTimeout(renderFallbackMap, 0);
  }
}

function loadAmapScript() {
  if (window.AMap) return Promise.resolve();
  if (state.amapLoading) return state.amapLoading;
  if (state.config.amapSecurityCode) {
    window._AMapSecurityConfig = { securityJsCode: state.config.amapSecurityCode };
  }
  state.amapLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(state.config.amapKey)}`;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('请检查 AMAP_KEY 是否正确，或当前网络是否能访问高德地图 API'));
    document.head.appendChild(script);
  });
  return state.amapLoading;
}

function hasLngLat(record) {
  return Number.isFinite(Number(record.longitude)) && Number.isFinite(Number(record.latitude));
}

function assetTypeIcon(record) {
  const tags = String(record.businessTags || '');
  if (tags.includes('售电')) return { symbol: '电', label: '售电', color: '#2563eb' };
  if (tags.includes('数据采集')) return { symbol: '采', label: '采集', color: '#0f9f6e' };
  return { symbol: '需', label: '供需', color: '#d97706' };
}

function amapMarkerContent(record) {
  const icon = assetTypeIcon(record);
  const el = document.createElement('div');
  el.className = 'amap-marker';
  el.dataset.id = record.id;
  el.style.background = icon.color;
  el.title = record.name || '';
  el.textContent = icon.symbol;
  return el;
}

function selectMapRecord(id) {
  state.selectedId = id;
  mapView.querySelectorAll('.amap-marker').forEach(marker => {
    marker.classList.toggle('selected', marker.dataset.id === id);
  });
  miniList.querySelectorAll('.person-card').forEach(button => {
    button.classList.toggle('active', button.dataset.id === id);
  });
  const selected = state.records.find(record => record.id === id);
  const oldCard = mapView.querySelector('.map-card');
  if (oldCard) oldCard.remove();
  if (selected) mapView.insertAdjacentHTML('beforeend', mapCard(selected));
  renderForm();
}

function locateCurrentPosition(map) {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(position => {
    const current = [position.coords.longitude, position.coords.latitude];
    const marker = new AMap.Marker({
      position: current,
      title: '当前位置',
      content: '<div class="amap-current">我</div>',
    });
    map.add(marker);
    map.setCenter(current);
    map.setZoom(Math.max(map.getZoom(), 14));
  }, () => {}, { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 });
}

function pseudoMapX(longitude) {
  const value = Number(longitude);
  if (!Number.isFinite(value)) return 50;
  if (value >= 70 && value <= 140) return ((value - 70) / 70) * 100;
  return Math.max(0, Math.min(100, value));
}

function pseudoMapY(latitude) {
  const value = Number(latitude);
  if (!Number.isFinite(value)) return 50;
  if (value >= 0 && value <= 60) return 100 - (value / 60) * 100;
  return Math.max(0, Math.min(100, value));
}

function buildMapBlocks() {
  const blocks = [];
  const xEdges = [0, 14, 28, 43, 57, 72, 86, 100];
  const yEdges = [0, 15, 31, 47, 63, 79, 100];
  for (let i = 0; i < xEdges.length - 1; i++) for (let j = 0; j < yEdges.length - 1; j++) blocks.push(`<rect x="${xEdges[i] + 1.3}" y="${yEdges[j] + 1.3}" width="${xEdges[i + 1] - xEdges[i] - 2.6}" height="${yEdges[j + 1] - yEdges[j] - 2.6}" rx="1.1" fill="#e3e8f1"/>`);
  return blocks.join('');
}

function mapCard(record) {
  return `<aside class="map-card"><h3>${escapeHtml(record.name)}</h3><p class="subtle">${escapeHtml(record.businessTags || '')}</p><dl><dt>联系人</dt><dd>${escapeHtml(record.contactName)}</dd><dt>电话</dt><dd>${escapeHtml(record.phone)}</dd><dt>微信</dt><dd>${escapeHtml(record.wechat)}</dd><dt>地址</dt><dd>${escapeHtml(record.address)}</dd><dt>资产状态</dt><dd>${statusPill(record.assetStatus)}</dd><dt>合作阶段</dt><dd>${statusPill(record.cooperationStage)}</dd><dt>业务类型</dt><dd>${escapeHtml(record.businessTags)}</dd></dl></aside>`;
}

function renderForm() {
  const mod = currentModule();
  const selected = state.records.find(record => record.id === state.selectedId) || {};
  const readOnly = mod.readOnly || (selected.id ? !canUpdate() : !canCreate());
  const deleteDisabled = !selected.id || !canDelete();
  $('#formTitle').textContent = selected.id ? `编辑：${selected[mod.primaryField]}` : `新增${mod.title}`;
  $('#formSubtitle').textContent = selected.id ? selected.id : (readOnly ? '当前模块不可新增' : '填写后保存到服务器数据库');
  recordForm.innerHTML = `<input type="hidden" name="id" value="${escapeHtml(selected.id || '')}">${renderFields(mod.fields, selected, readOnly)}<div class="hint">${mod.readOnly ? '日志模块为只读审计记录。' : '数据会保存到服务器 SQLite 数据库。'}</div><div class="actions"><button class="btn primary" type="submit" ${readOnly ? 'disabled' : ''}>保存记录</button><button class="btn" id="clearBtn" type="button" ${canCreate() ? '' : 'disabled'}>清空</button><button class="btn" id="deleteBtn" type="button" ${deleteDisabled ? 'disabled' : ''}>删除</button></div>`;
  $('#clearBtn').addEventListener('click', () => {
    state.selectedId = '';
    render();
  });
  $('#deleteBtn').addEventListener('click', deleteSelected);
}

function renderFields(fields, selected, disabled = false) {
  const parts = [];
  let pair = [];
  fields.forEach(field => {
    const html = `<label>${field.label}${inputFor(field, selected[field.name], disabled)}</label>`;
    if (field.type === 'textarea') {
      if (pair.length) parts.push(`<div class="two">${pair.join('')}</div>`);
      pair = [];
      parts.push(html);
    } else {
      pair.push(html);
      if (pair.length === 2) {
        parts.push(`<div class="two">${pair.join('')}</div>`);
        pair = [];
      }
    }
  });
  if (pair.length) parts.push(`<div class="two">${pair.join('')}</div>`);
  return parts.join('');
}

function inputFor(field, value = '', disabled = false) {
  const disabledAttr = disabled ? ' disabled' : '';
  if (field.type === 'select') return `<select name="${field.name}"${disabledAttr}>${field.options.map(([key, label]) => `<option value="${key}"${value === key ? ' selected' : ''}>${label}</option>`).join('')}</select>`;
  if (field.type === 'textarea') return `<textarea name="${field.name}"${disabledAttr}>${escapeHtml(value)}</textarea>`;
  return `<input name="${field.name}" type="${field.type || 'text'}" value="${escapeHtml(value)}"${disabledAttr}>`;
}

recordForm.addEventListener('submit', async event => {
  event.preventDefault();
  const selected = state.records.find(record => record.id === state.selectedId);
  if (currentModule().readOnly || (selected ? !canUpdate() : !canCreate())) return;
  const payload = Object.fromEntries(new FormData(recordForm).entries());
  const mod = currentModule();
  mod.fields.forEach(field => {
    if (field.type === 'number') payload[field.name] = Number(payload[field.name] || 0);
  });
  const id = payload.id;
  await api(`/api/modules/${state.currentModule}/records${id ? `/${id}` : ''}`, { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
  await loadRecords();
  state.selectedId = id || state.records[0]?.id || '';
  render();
});

async function deleteSelected() {
  if (!state.selectedId || !canDelete()) return;
  await api(`/api/modules/${state.currentModule}/records/${state.selectedId}`, { method: 'DELETE' });
  state.selectedId = '';
  await loadRecords();
  render();
}

$('#loginForm').addEventListener('submit', async event => {
  event.preventDefault();
  try {
    await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ username: $('#loginUser').value.trim(), password: $('#loginPass').value }) });
    $('#loginError').textContent = '';
    await loadConfig();
    await loadModules();
    await showApp();
  } catch (error) {
    $('#loginError').textContent = error.message;
  }
});

$('#logoutBtn').addEventListener('click', async () => {
  await api('/api/auth/logout', { method: 'POST' });
  showLogin();
});

$('#searchInput').addEventListener('input', event => {
  state.query = event.target.value;
  render();
});
$('#newBtn').addEventListener('click', () => {
  if (!canCreate()) return;
  state.selectedId = '';
  render();
});
$('#exportBtn').addEventListener('click', () => {
  if (!canExport()) return;
  window.location.href = `/api/modules/${state.currentModule}/export`;
});
$('#importBtn').addEventListener('click', () => {
  if (canImport()) importFile.click();
});
importFile.addEventListener('change', async event => {
  if (!canImport()) return;
  const file = event.target.files[0];
  if (!file) return;
  const text = await file.text();
  const rows = parseCsv(text);
  const mod = currentModule();
  const records = rows.map(row => {
    const record = {};
    mod.fields.forEach(field => {
      record[field.name] = field.type === 'number' ? Number(row[field.label] || row[field.name] || 0) : String(row[field.label] || row[field.name] || '');
    });
    return record;
  });
  await api(`/api/modules/${state.currentModule}/import`, { method: 'POST', body: JSON.stringify({ records }) });
  await loadRecords();
  importFile.value = '';
  render();
});

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(',').map(value => value.replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const values = line.match(/("([^"]|"")*"|[^,]+)/g) || [];
    return Object.fromEntries(headers.map((header, index) => [header, String(values[index] || '').replace(/^"|"$/g, '').replace(/""/g, '"')]));
  });
}

boot();
