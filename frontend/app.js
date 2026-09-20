const $ = selector => document.querySelector(selector);

const state = {
  modules: {},
  dashboard: null,
  dashboardError: '',
  atlasWorkbench: null,
  atlasWorkbenchError: '',
  atlasWorkbenchTab: 'scenes',
  config: {},
  currentModule: 'dashboard',
  currentUser: null,
  expandedNavGroups: [],
  sidebarCollapsed: false,
  records: [],
  selectedId: '',
  selectedIds: [],
  editorMode: '',
  filter: 'all',
  query: '',
  sortField: '',
  sortDirection: 'asc',
  pageSize: 20,
  currentPage: 1,
  amapLoading: null,
  amapMap: null,
};

const loginPage = $('#loginPage');
const appShell = $('#appShell');
const accountWatermark = $('#accountWatermark');
const breadcrumbTitle = $('#breadcrumbTitle');
const headerUser = $('.header-user');
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
const editorBackdrop = $('#editorBackdrop');
const importFile = $('#importFile');
const sidebarCollapseBtn = $('#sidebarCollapseBtn');
const paginationBar = $('#paginationBar');
const paginationSummary = $('#paginationSummary');
const pageSizeSelect = $('#pageSizeSelect');
const prevPageBtn = $('#prevPageBtn');
const nextPageBtn = $('#nextPageBtn');
const pageIndicator = $('#pageIndicator');
const batchDeleteBtn = $('#batchDeleteBtn');

const DASHBOARD_MODULE = {
  title: '贵州商业版图',
  primaryField: 'title',
  filters: [['all', '全部']],
  fields: [],
  permissions: { view: true },
  dashboard: true,
};

const ATLAS_WORKBENCH_MODULE = {
  title: 'Atlas 采集工作台',
  primaryField: 'name',
  filters: [['all', '全部']],
  fields: [],
  permissions: { view: true, create: false, update: false, delete: false, import: false, export: false },
  workbench: true,
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
    const result = await api('/api/auth/me');
    state.currentUser = result.user;
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
  if (state.currentModule === 'atlas_workbench') {
    await loadAtlasWorkbench();
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
  clearAccountWatermark();
}

async function loadAtlasWorkbench() {
  try {
    const [summary, scenes, records, categories, output] = await Promise.all([
      api('/api/atlas/workbench/summary'),
      api('/api/atlas/workbench/scenes'),
      api('/api/atlas/workbench/records'),
      api('/api/atlas/workbench/categories'),
      api('/api/atlas/workbench/output'),
    ]);
    state.atlasWorkbench = { summary, scenes, records, categories, output };
    state.atlasWorkbenchError = summary.error || '';
    if (!state.selectedId && scenes.scenes?.[0]) state.selectedId = scenes.scenes[0].name;
  } catch (error) {
    state.atlasWorkbench = null;
    state.atlasWorkbenchError = error.message || 'Atlas 工作台加载失败';
  }
}

async function showApp() {
  loginPage.hidden = true;
  appShell.hidden = false;
  setAccountWatermark(state.currentUser);
  await loadRecords();
  render();
}

function watermarkTextForUser(user) {
  if (!user) return '';
  return `${user.username || ''}${user.displayName ? ` ${user.displayName}` : ''}`.trim();
}

function setAccountWatermark(user) {
  const text = watermarkTextForUser(user);
  if (headerUser) headerUser.textContent = text || 'admin';
  if (!text) {
    clearAccountWatermark();
    return;
  }
  const safeText = escapeHtml(text);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="160" viewBox="0 0 280 160"><text x="24" y="86" fill="rgba(23,32,51,.075)" font-family="Arial, Microsoft YaHei, sans-serif" font-size="16" font-weight="700" transform="rotate(-24 140 80)">${safeText}</text></svg>`;
  accountWatermark.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function clearAccountWatermark() {
  accountWatermark.style.backgroundImage = '';
}

function currentModule() {
  if (state.currentModule === 'dashboard') return DASHBOARD_MODULE;
  if (state.currentModule === 'atlas_workbench') return ATLAS_WORKBENCH_MODULE;
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

function sortedRecords() {
  const records = [...filteredRecords()];
  const fieldName = state.sortField;
  if (!fieldName) return records;
  const direction = state.sortDirection === 'desc' ? -1 : 1;
  return records.sort((left, right) => compareValues(left[fieldName], right[fieldName]) * direction);
}

function compareValues(left, right) {
  const leftEmpty = left === null || left === undefined || left === '';
  const rightEmpty = right === null || right === undefined || right === '';
  if (leftEmpty && rightEmpty) return 0;
  if (leftEmpty) return 1;
  if (rightEmpty) return -1;
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) return leftNumber - rightNumber;
  const leftTime = Date.parse(left);
  const rightTime = Date.parse(right);
  if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) return leftTime - rightTime;
  return String(left).localeCompare(String(right), 'zh-Hans-CN', { numeric: true, sensitivity: 'base' });
}

function selectedIdSet() {
  return new Set(state.selectedIds);
}

function currentPageRecordIds() {
  return paginatedRecords().map(record => record.id);
}

function pruneSelectedIds() {
  const existingIds = new Set(state.records.map(record => record.id));
  state.selectedIds = state.selectedIds.filter(id => existingIds.has(id));
}

function paginatedRecords() {
  const records = sortedRecords();
  const totalPages = Math.max(1, Math.ceil(records.length / state.pageSize));
  state.currentPage = Math.min(Math.max(1, state.currentPage), totalPages);
  const start = (state.currentPage - 1) * state.pageSize;
  return records.slice(start, start + state.pageSize);
}

function renderPagination() {
  if (!paginationBar) return;
  const isListPage = !['dashboard', 'atlas_workbench'].includes(state.currentModule) && state.currentModule !== 'assets';
  paginationBar.hidden = !isListPage;
  if (!isListPage) return;
  const total = filteredRecords().length;
  const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
  state.currentPage = Math.min(Math.max(1, state.currentPage), totalPages);
  paginationSummary.textContent = `共 ${total} 条`;
  pageSizeSelect.value = String(state.pageSize);
  pageIndicator.textContent = `${state.currentPage} / ${totalPages}`;
  prevPageBtn.disabled = state.currentPage <= 1;
  nextPageBtn.disabled = state.currentPage >= totalPages;
}

function toggleSidebar() {
  state.sidebarCollapsed = !state.sidebarCollapsed;
  appShell.classList.toggle('sidebar-collapsed', state.sidebarCollapsed);
  sidebarCollapseBtn.setAttribute('aria-label', state.sidebarCollapsed ? '展开侧边栏' : '收起侧边栏');
}

function render() {
  const mod = currentModule();
  if (breadcrumbTitle) breadcrumbTitle.textContent = mod.title || '工作台';
  renderAppNav();
  if (state.currentModule === 'dashboard') {
    renderDashboard();
    renderPagination();
    return;
  }
  if (state.currentModule === 'atlas_workbench') {
    renderAtlasWorkbench();
    renderPagination();
    return;
  }
  workspace.classList.remove('dashboard-mode');
  workspace.classList.add('no-sidebar');
  const dashboardRoot = $('#dashboardRoot');
  if (dashboardRoot) dashboardRoot.hidden = true;
  if (moduleSidebar) moduleSidebar.hidden = true;
  toolbarSearch.hidden = false;
  closeEditor();
  $('#moduleTitle').textContent = mod.title;
  $('#moduleDesc').textContent = '';
  $('#searchInput').placeholder = `搜索${mod.title}关键字`;
  renderToolbarPermissions();
  renderFilters();
  if (shouldShowStats()) {
    stats.hidden = false;
    renderStats();
  } else {
    stats.hidden = true;
    stats.innerHTML = '';
  }
  renderDataView();
  renderPagination();
}

function renderToolbarPermissions() {
  $('#newBtn').hidden = !canCreate();
  $('#importBtn').hidden = !canImport();
  $('#exportBtn').hidden = !canExport();
  if (batchDeleteBtn) {
    batchDeleteBtn.hidden = !canDelete();
    batchDeleteBtn.disabled = !canDelete() || state.selectedIds.length === 0;
    batchDeleteBtn.textContent = state.selectedIds.length ? `批量删除 (${state.selectedIds.length})` : '批量删除';
  }
}

function renderDashboard() {
  const data = state.dashboard || {};
  const errorHtml = state.dashboardError
    ? `<div class="dashboard-alert">贵州商业版图数据暂时无法加载：${escapeHtml(state.dashboardError)}。如果刚更新过系统，请重启后端服务。</div>`
    : '';
  workspace.classList.add('dashboard-mode');
  workspace.classList.add('no-sidebar');
  if (moduleSidebar) moduleSidebar.hidden = true;
  toolbarSearch.hidden = true;
  closeEditor();
  $('#moduleTitle').textContent = '贵州商业版图';
  $('#moduleDesc').textContent = '用数采信任关系沉淀门店画像，识别供应链整合与机器人落地机会。';
  $('#newBtn').hidden = true;
  $('#importBtn').hidden = true;
  $('#exportBtn').hidden = true;
  if (batchDeleteBtn) batchDeleteBtn.hidden = true;
  stats.hidden = false;
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

function renderAtlasWorkbench() {
  const data = state.atlasWorkbench || {};
  const summary = data.summary || {};
  const cards = summary.cards || {};
  workspace.classList.remove('dashboard-mode');
  workspace.classList.add('no-sidebar');
  if (moduleSidebar) moduleSidebar.hidden = true;
  toolbarSearch.hidden = true;
  closeEditor();
  $('#moduleTitle').textContent = 'Atlas 采集工作台';
  $('#moduleDesc').textContent = '承接 atlas-cj 的场景报备、工位明细、业态字典和 Word 生成流程。';
  $('#newBtn').hidden = true;
  $('#importBtn').hidden = true;
  $('#exportBtn').hidden = true;
  if (batchDeleteBtn) batchDeleteBtn.hidden = true;
  stats.hidden = false;
  stats.innerHTML = [
    ['场景数', cards.sceneCount || 0],
    ['工位数', cards.recordCount || 0],
    ['图片数', cards.imageCount || 0],
    ['采集人', cards.collectorCount || 0],
    ['单位数', cards.unitCount || 0],
  ].map(([label, value]) => `<div class="stat"><span>${label}</span><b>${value}</b></div>`).join('');
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
    <section class="atlas-workbench">
      ${state.atlasWorkbenchError ? `<div class="dashboard-alert">Atlas 数据暂时不可用：${escapeHtml(state.atlasWorkbenchError)}</div>` : ''}
      <div class="atlas-toolbar">
        <div class="atlas-tabs">${renderAtlasWorkbenchTabs()}</div>
        <div class="atlas-actions">
          <button class="btn" id="atlasRefresh" type="button">刷新</button>
          <button class="btn primary" id="atlasGenerateSelected" type="button">生成选中场景</button>
          <button class="btn" id="atlasClearEdits" type="button">清空编辑覆盖</button>
        </div>
      </div>
      ${renderAtlasWorkbenchBody(data)}
    </section>`;
  dashboardRoot.querySelectorAll('.atlas-tab').forEach(button => button.addEventListener('click', () => {
    state.atlasWorkbenchTab = button.dataset.tab;
    renderAtlasWorkbench();
  }));
  dashboardRoot.querySelectorAll('.atlas-scene-card').forEach(button => button.addEventListener('click', () => selectAtlasScene(button.dataset.scene)));
  $('#atlasRefresh').addEventListener('click', async () => {
    await loadAtlasWorkbench();
    renderAtlasWorkbench();
  });
  $('#atlasGenerateSelected').addEventListener('click', atlasGenerateSelected);
  $('#atlasClearEdits').addEventListener('click', atlasClearEdits);
}

function renderAtlasWorkbenchTabs() {
  return [
    ['scenes', '场景'],
    ['review', '场景审核'],
    ['records', '工位明细'],
    ['categories', '业态字典'],
    ['output', '生成文件'],
  ].map(([key, label]) => `<button class="atlas-tab${state.atlasWorkbenchTab === key ? ' active' : ''}" data-tab="${key}" type="button">${label}</button>`).join('');
}

function renderAtlasWorkbenchBody(data) {
  if (state.atlasWorkbenchTab === 'review') return renderAtlasReview(data);
  if (state.atlasWorkbenchTab === 'records') return renderAtlasRecords(data.records?.records || []);
  if (state.atlasWorkbenchTab === 'categories') return renderAtlasCategories(data.categories || {});
  if (state.atlasWorkbenchTab === 'output') return renderAtlasOutput(data.output || {});
  return renderAtlasScenes(data.scenes?.scenes || []);
}

function renderAtlasReview(data) {
  const records = (data.records?.records || []).filter(r => (r.status || '').includes('审') || (r.status || '').toLowerCase().includes('pending'));
  const byStatus = (data.summary?.byStatus || {});
  const pendingCount = Object.entries(byStatus).filter(([k]) => k.includes('审') || k.toLowerCase().includes('pending')).reduce((s, [, v]) => s + v, 0);
  if (records.length === 0) {
    return `<div class="atlas-review"><h3>场景审核列表</h3><p class="dashboard-empty">当前无待审核场景（${pendingCount} 条待审记录）</p></div>`;
  }
  // 按场景聚合
  const buckets = new Map();
  records.forEach(r => {
    if (!buckets.has(r.sceneName)) buckets.set(r.sceneName, r);
  });
  const scenes = Array.from(buckets.values()).map(r => {
    const sceneImages = (data.scenes?.scenes || []).find(s => s.name === r.sceneName) || {};
    return { ...sceneImages, ...r, _allRecords: records.filter(x => x.sceneName === r.sceneName) };
  });
  return `<div class="atlas-review">
    <h3>场景审核列表（${pendingCount} 条待审 / 共 ${scenes.length} 个场景）</h3>
    <div class="atlas-review-list">
      ${scenes.map(scene => `<article class="atlas-review-card" data-scene="${escapeHtml(scene.name)}">
        <header>
          <h4>${escapeHtml(scene.name)}</h4>
          <span class="atlas-status-badge">${escapeHtml(scene.status || '-')}</span>
        </header>
        <dl>
          <dt>编号</dt><dd>${escapeHtml((scene._allRecords || []).map(r => r.reportId).filter(Boolean).join('、') || '-')}</dd>
          <dt>业态</dt><dd>${escapeHtml(scene.category || '-')} / ${escapeHtml(scene.subcategory || '-')}</dd>
          <dt>位置</dt><dd>${escapeHtml(scene.location || '-')}</dd>
          <dt>采集人</dt><dd>${escapeHtml(scene.collector || scene.collectors?.join('、') || '-')}</dd>
          <dt>报备日期</dt><dd>${escapeHtml(scene.reportDate || '-')}</dd>
          <dt>图片</dt><dd>${scene.imageCount || 0} 张</dd>
        </dl>
        <p>${escapeHtml(scene.summary || '暂无概述')}</p>
        <div class="atlas-review-actions">
          <button class="btn" data-action="view-scene" data-scene="${escapeHtml(scene.name)}" type="button">查看详情</button>
        </div>
      </article>`).join('')}
    </div>
  </div>`;
}

function renderAtlasScenes(scenes) {
  const selected = scenes.find(scene => scene.name === state.selectedId) || scenes[0];
  return `<div class="atlas-scene-grid">
    <div class="atlas-scene-list">${scenes.map(scene => `<button class="atlas-scene-card${scene.name === selected?.name ? ' active' : ''}" data-scene="${escapeHtml(scene.name)}" type="button"><b>${escapeHtml(scene.name)}</b><span>${escapeHtml(scene.category || '')} / ${escapeHtml(scene.subcategory || '')}</span><p>${scene.recordCount || 0} 工位 · ${scene.imageCount || 0} 图片</p></button>`).join('') || '<p class="dashboard-empty">暂无场景数据</p>'}</div>
    <aside class="atlas-detail-panel">${selected ? renderAtlasSceneDetail(selected) : '<p class="dashboard-empty">请选择场景</p>'}</aside>
  </div>`;
}

function renderAtlasSceneDetail(scene) {
  const imagesHtml = (scene.records || []).flatMap(record => {
    const dir = record.imageDir || scene.imageDir || '';
    const encodedDir = dir.split('/').map(encodeURIComponent).join('/');
    return (record.imageList || []).map(file => {
      const url = encodedDir + '/' + encodeURIComponent(file);
      return `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer" class="atlas-thumb"><img src="${escapeHtml(url)}" alt="${escapeHtml(file)}" loading="lazy"></a>`;
    });
  }).join('');
  return `<h3>${escapeHtml(scene.name)}</h3>
    <p>${escapeHtml(scene.summary || '暂无采集概述')}</p>
    <dl class="atlas-meta-grid"><dt>编号</dt><dd>${escapeHtml((scene.records || []).map(r => r.reportId).filter(Boolean).join('、') || '-')}</dd><dt>业态</dt><dd>${escapeHtml(scene.category || '-')} / ${escapeHtml(scene.subcategory || '-')}</dd><dt>位置</dt><dd>${escapeHtml(scene.location || '-')}</dd><dt>采集人</dt><dd>${escapeHtml((scene.collectors || []).join('、') || '-')}</dd><dt>报备日期</dt><dd>${escapeHtml(scene.reportDate || '-')}</dd><dt>状态</dt><dd>${escapeHtml(scene.status || '-')}</dd></dl>
    <h4>场景图片（${scene.imageCount || 0} 张）</h4>
    <div class="atlas-thumb-grid">${imagesHtml || '<p class="dashboard-empty">暂无图片</p>'}</div>
    <h4>工位记录</h4>
    <table class="atlas-record-table"><thead><tr><th>编号</th><th>工位</th><th>工作内容</th></tr></thead><tbody>${(scene.records || []).map(record => `<tr><td>${escapeHtml(record.reportId)}</td><td>${escapeHtml(record.workstation || '-')}</td><td>${escapeHtml(record.workDetail || '-')}</td></tr>`).join('')}</tbody></table>`;
}

function renderAtlasRecords(records) {
  return `<table class="atlas-record-table"><thead><tr><th>编号</th><th>场景</th><th>分类</th><th>工位</th><th>采集人</th><th>状态</th></tr></thead><tbody>${records.map(record => `<tr><td>${escapeHtml(record.reportId)}</td><td>${escapeHtml(record.sceneName)}</td><td>${escapeHtml(record.category)} / ${escapeHtml(record.subcategory)}</td><td>${escapeHtml(record.workstation)}</td><td>${escapeHtml(record.collector)}</td><td>${escapeHtml(record.status)}</td></tr>`).join('')}</tbody></table>`;
}

function renderAtlasCategories(categories) {
  const rows = categories.categories || [];
  const business = categories.businessTypes || [];
  return `<div class="atlas-dictionary"><h3>业态分类</h3>${rows.map(item => `<article><b>${escapeHtml(item.category)}</b><span>${escapeHtml((item.subcategories || []).join('、'))}</span></article>`).join('') || '<p class="dashboard-empty">暂无业态分类</p>'}<h3>业务采集表</h3><p>${business.length} 条采集模板</p></div>`;
}

function renderAtlasOutput(output) {
  const files = output.files || [];
  return `<div class="atlas-output-list">${files.map(file => `<a href="${escapeHtml(file.downloadUrl)}" target="_blank" rel="noreferrer"><b>${escapeHtml(file.name)}</b><span>${Math.ceil((file.size || 0) / 1024)} KB</span></a>`).join('') || '<p class="dashboard-empty">暂无生成文件</p>'}</div>`;
}

function selectAtlasScene(name) {
  state.selectedId = name;
  renderAtlasWorkbench();
}

async function atlasGenerateSelected() {
  const scene = state.selectedId;
  if (!scene) return;
  await api('/api/atlas/workbench/generate', { method: 'POST', body: JSON.stringify({ scenes: [scene] }) });
  await loadAtlasWorkbench();
  state.atlasWorkbenchTab = 'output';
  renderAtlasWorkbench();
}

async function atlasClearEdits() {
  await api('/api/atlas/workbench/edits', { method: 'DELETE' });
  await loadAtlasWorkbench();
  renderAtlasWorkbench();
}

const MENU_GROUPS = [
  { title: '首页', icon: '⌂', items: ['dashboard', 'assets'] },
  { title: '系统管理', icon: '⚙', items: ['users', 'roles', 'permissions', 'audit_logs'] },
  { title: '产品中心', icon: '▣', items: ['projects'] },
  { title: '人员管理', icon: '♙', items: ['people'] },
  { title: '业务运营', icon: '✦', items: ['opportunities', 'atlas_workbench', 'atl_collection_scenarios', 'execution_tasks', 'equipment_records'] },
  { title: '财务结算', icon: '¥', items: ['settlements'] },
  { title: '供应链', icon: '⇄', items: ['supply_demand', 'supply_chain'] },
  { title: '问题管理', icon: '!', items: ['issues'] },
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

function shouldShowStats() {
  return false;
}

function renderAppNav() {
  if (!state.expandedNavGroups.length) state.expandedNavGroups = [...DEFAULT_EXPANDED_GROUPS];
  appNav.innerHTML = MENU_GROUPS.map(group => {
    const isExpanded = state.expandedNavGroups.includes(group.title) || group.items.includes(state.currentModule);
    const visibleItems = isExpanded ? group.items.filter(key => key === 'dashboard' || key === 'atlas_workbench' || state.modules[key]) : [];
    const items = visibleItems.map(key => {
      const mod = key === 'dashboard' ? DASHBOARD_MODULE : (key === 'atlas_workbench' ? ATLAS_WORKBENCH_MODULE : state.modules[key]);
      return `<button class="el-menu-item nav-item${key === state.currentModule ? ' is-active active' : ''}" data-module="${key}" type="button"><span>${mod.title}</span></button>`;
    }).join('');
    return `<section class="el-sub-menu nav-group${isExpanded ? ' is-opened active' : ''}"><button class="el-sub-menu__title nav-group-toggle" type="button" data-group="${group.title}"><span class="nav-group-icon">${group.icon}</span><span>${group.title}</span><span class="nav-group-arrow"></span></button><div class="el-menu nav-submenu">${items}</div></section>`;
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
    state.selectedIds = [];
    state.sortField = '';
    state.sortDirection = 'asc';
    state.filter = 'all';
    state.query = '';
    state.currentPage = 1;
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
    state.currentPage = 1;
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
  pruneSelectedIds();
  if (state.currentModule === 'assets') {
    table.hidden = true;
    mapView.hidden = false;
    renderMap();
    return;
  }
  table.hidden = false;
  mapView.hidden = true;
  const mod = currentModule();
  const visibleFields = mod.fields.slice(0, 8);
  const pageRecords = paginatedRecords();
  const selectedIds = selectedIdSet();
  tableHead.innerHTML = `<tr><th class="selection-col"><input id="selectAllRows" type="checkbox" aria-label="选择当前页" ${canDelete() ? '' : 'disabled'}></th>${visibleFields.map(field => renderSortableHeader(field)).join('')}<th class="action-col">操作</th></tr>`;
  tableBody.innerHTML = pageRecords.map(record => `<tr class="${record.id === state.selectedId ? 'selected' : ''}" data-id="${record.id}"><td class="selection-col"><input class="row-select" type="checkbox" data-id="${record.id}" aria-label="选择${escapeHtml(record[mod.primaryField] || record.id)}" ${selectedIds.has(record.id) ? 'checked' : ''} ${canDelete() ? '' : 'disabled'}></td>${visibleFields.map(field => `<td>${renderCell(record, field)}</td>`).join('')}<td>${renderRowActions(record)}</td></tr>`).join('');
  tableHead.querySelectorAll('.sortable-header').forEach(button => button.addEventListener('click', () => toggleSort(button.dataset.field)));
  const selectAllRows = $('#selectAllRows');
  if (selectAllRows) {
    const pageIds = pageRecords.map(record => record.id);
    const selectedOnPage = pageIds.filter(id => selectedIds.has(id)).length;
    selectAllRows.checked = pageIds.length > 0 && selectedOnPage === pageIds.length;
    selectAllRows.indeterminate = selectedOnPage > 0 && selectedOnPage < pageIds.length;
    selectAllRows.addEventListener('change', event => toggleSelectAll(event.target.checked));
  }
  tableBody.querySelectorAll('.row-select').forEach(input => input.addEventListener('click', event => event.stopPropagation()));
  tableBody.querySelectorAll('.row-select').forEach(input => input.addEventListener('change', event => toggleRecordSelection(event.target.dataset.id, event.target.checked)));
  tableBody.querySelectorAll('.row-detail').forEach(button => button.addEventListener('click', event => {
    event.stopPropagation();
    openEditor('detail', button.dataset.id);
  }));
  tableBody.querySelectorAll('.row-edit').forEach(button => button.addEventListener('click', event => {
    event.stopPropagation();
    openEditor('edit', button.dataset.id);
  }));
  tableBody.querySelectorAll('.row-delete').forEach(button => button.addEventListener('click', async event => {
    event.stopPropagation();
    state.selectedId = button.dataset.id;
    await deleteSelected();
  }));
  $('#emptyState').hidden = filteredRecords().length > 0;
  renderToolbarPermissions();
}

function renderSortableHeader(field) {
  const active = state.sortField === field.name;
  const indicator = active ? (state.sortDirection === 'asc' ? '↑' : '↓') : '↕';
  const ariaSort = active ? (state.sortDirection === 'asc' ? 'ascending' : 'descending') : 'none';
  return `<th aria-sort="${ariaSort}"><button class="sortable-header${active ? ' active' : ''}" type="button" data-field="${field.name}"><span>${escapeHtml(field.label)}</span><span class="sort-indicator">${indicator}</span></button></th>`;
}

function toggleSort(fieldName) {
  if (state.sortField === fieldName) {
    state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    state.sortField = fieldName;
    state.sortDirection = 'asc';
  }
  state.currentPage = 1;
  render();
}

function renderRowActions(record) {
  return `<div class="table-actions"><button class="link-btn row-detail" data-id="${record.id}" type="button">详情</button><button class="link-btn row-edit" data-id="${record.id}" type="button" ${canUpdate() ? '' : 'disabled'}>编辑</button><button class="link-btn danger row-delete" data-id="${record.id}" type="button" ${canDelete() ? '' : 'disabled'}>删除</button></div>`;
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

async function openEditor(mode, id = '') {
  state.editorMode = mode;
  state.selectedId = id;
  editor.hidden = false;
  if (editorBackdrop) editorBackdrop.hidden = false;
  await renderForm();
}

function closeEditor() {
  state.editorMode = '';
  if (editor) editor.hidden = true;
  if (editorBackdrop) editorBackdrop.hidden = true;
}

async function renderForm() {
  const mod = currentModule();
  const selected = state.records.find(record => record.id === state.selectedId) || {};
  const isDetail = state.editorMode === 'detail';
  const readOnly = isDetail || mod.readOnly || (selected.id ? !canUpdate() : !canCreate());
  const deleteDisabled = !selected.id || !canDelete();
  await preloadLookups(mod);
  $('#formTitle').textContent = isDetail ? `详情：${selected[mod.primaryField] || ''}` : (selected.id ? `编辑：${selected[mod.primaryField] || ''}` : `新增${mod.title}`);
  $('#formSubtitle').textContent = selected.id ? selected.id : (readOnly ? '当前模块不可新增' : '填写后保存到服务器数据库');
  recordForm.innerHTML = `<input type="hidden" name="id" value="${escapeHtml(selected.id || '')}">${renderFields(mod.fields, selected, readOnly)}<div class="hint">${isDetail ? '当前为详情查看，可从列表点击编辑进入修改。' : (mod.readOnly ? '日志模块为只读审计记录。' : '数据会保存到服务器 SQLite 数据库。')}</div><div class="actions"><button class="btn primary" type="submit" ${readOnly ? 'disabled' : ''}>保存记录</button><button class="btn" id="clearBtn" type="button" ${canCreate() && !isDetail ? '' : 'disabled'}>清空</button><button class="btn" id="deleteBtn" type="button" ${deleteDisabled || isDetail ? 'disabled' : ''}>删除</button></div>`;
  $('#clearBtn').addEventListener('click', () => {
    openEditor('create', '');
  });
  $('#deleteBtn').addEventListener('click', deleteSelected);
}

async function preloadLookups(mod) {
  const lookups = new Set();
  (mod.fields || []).forEach(field => {
    if (field.lookup) {
      const dataModule = LOOKUP_MODULES[field.lookup.module] || field.lookup.module;
      const display = LOOKUP_DISPLAY[field.lookup.module] || field.lookup.display;
      lookups.add(dataModule + ':' + display);
    }
  });
  await Promise.all([...lookups].map(key => {
    const [moduleKey, display] = key.split(':');
    return loadLookupOptions(moduleKey, display);
  }));
}

function renderFields(fields, selected, disabled = false) {
  const parts = [];
  let pair = [];
  fields.forEach(field => {
    const html = `<label>${field.label}${inputFor(field, selected[field.name], disabled, selected)}</label>`;
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

const LOOKUP_CACHE = new Map();
const LOOKUP_MODULES = { 'settlements-source': 'assets', 'issues-source': 'assets' };
const LOOKUP_DISPLAY = { 'settlements-source': 'name', 'issues-source': 'name' };

async function loadLookupOptions(moduleKey, display) {
  const key = moduleKey + ':' + display;
  if (LOOKUP_CACHE.has(key)) return LOOKUP_CACHE.get(key);
  try {
    const data = await api(`/api/modules/${moduleKey}/records?pageSize=200`);
    const items = (data.records || []).map(r => ({ id: r.id, label: r[display] || r.id, record: r }));
    LOOKUP_CACHE.set(key, items);
    return items;
  } catch (e) {
    return [];
  }
}

function inputFor(field, value = '', disabled = false, recordContext = {}) {
  const disabledAttr = disabled ? ' disabled' : '';
  const lookup = field.lookup;
  if (lookup) {
    const dataModule = LOOKUP_MODULES[lookup.module] || lookup.module;
    const display = LOOKUP_DISPLAY[lookup.module] || lookup.display;
    const items = (LOOKUP_CACHE.get(dataModule + ':' + display) || []);
    const placeholder = lookup.placeholder || `选择 ${field.label}`;
    return `<select name="${field.name}" data-lookup="${dataModule}:${display}"${disabledAttr}><option value="">${escapeHtml(placeholder)}</option>${items.map(item => `<option value="${escapeHtml(item.label)}"${value === item.label ? ' selected' : ''}>${escapeHtml(item.label)}</option>`).join('')}</select>`;
  }
  if (field.type === 'select' && field.workflow) {
    const currentStage = recordContext.stage || value;
    const rule = field.workflow[currentStage];
    let availableOptions = field.options;
    if (rule && Array.isArray(rule.next)) {
      const nextSet = new Set([currentStage, ...rule.next]);
      availableOptions = field.options.filter(([key]) => nextSet.has(key));
    }
    return `<select name="${field.name}" data-workflow="true"${disabledAttr}>${availableOptions.map(([key, label]) => `<option value="${key}"${value === key ? ' selected' : ''}>${label}</option>`).join('')}</select>`;
  }
  if (field.type === 'select') return `<select name="${field.name}"${disabledAttr}>${field.options.map(([key, label]) => `<option value="${key}"${value === key ? ' selected' : ''}>${label}</option>`).join('')}</select>`;
  if (field.type === 'textarea') return `<textarea name="${field.name}"${disabledAttr}>${escapeHtml(value)}</textarea>`;
  return `<input name="${field.name}" type="${field.type || 'text'}" value="${escapeHtml(value)}"${disabledAttr}>`;
}

recordForm.addEventListener('change', event => {
  const target = event.target;
  if (target.matches('select[data-workflow="true"]')) {
    const stageField = currentModule().fields.find(field => field.name === target.name);
    const rule = stageField?.workflow?.[target.value];
    const dateField = recordForm.querySelector('input[name="nextFollowDate"]');
    if (dateField && rule) {
      if (rule.followUpDays == null) {
        dateField.value = '';
      } else {
        const future = new Date();
        future.setDate(future.getDate() + Number(rule.followUpDays));
        dateField.value = future.toISOString().slice(0, 10);
      }
    }
  }
});

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
  closeEditor();
  render();
});

async function deleteSelected() {
  if (!state.selectedId || !canDelete()) return;
  const deletedId = state.selectedId;
  await api(`/api/modules/${state.currentModule}/records/${deletedId}`, { method: 'DELETE' });
  state.selectedId = '';
  state.selectedIds = state.selectedIds.filter(id => id !== deletedId);
  closeEditor();
  await loadRecords();
  render();
}

function toggleRecordSelection(id, checked) {
  const ids = new Set(state.selectedIds);
  if (checked) ids.add(id);
  else ids.delete(id);
  state.selectedIds = [...ids];
  renderDataView();
  renderToolbarPermissions();
}

function toggleSelectAll(checked) {
  const ids = new Set(state.selectedIds);
  currentPageRecordIds().forEach(id => {
    if (checked) ids.add(id);
    else ids.delete(id);
  });
  state.selectedIds = [...ids];
  renderDataView();
  renderToolbarPermissions();
}

async function batchDeleteSelected() {
  if (!canDelete() || state.selectedIds.length === 0) return;
  const ids = [...state.selectedIds];
  await Promise.all(ids.map(id => api(`/api/modules/${state.currentModule}/records/${id}`, { method: 'DELETE' })));
  state.selectedIds = [];
  state.selectedId = '';
  closeEditor();
  await loadRecords();
  render();
}

async function submitLogin() {
  try {
    const result = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ username: $('#loginUser').value.trim(), password: $('#loginPass').value }) });
    state.currentUser = result.user;
    $('#loginError').textContent = '';
    await loadConfig();
    await loadModules();
    await showApp();
  } catch (error) {
    $('#loginError').textContent = error.message;
  }
}

$('#loginForm').addEventListener('submit', async event => {
  event.preventDefault();
  await submitLogin();
});

$('#loginSubmitBtn').addEventListener('click', async event => {
  event.preventDefault();
  await submitLogin();
});

$('#logoutBtn').addEventListener('click', async () => {
  await api('/api/auth/logout', { method: 'POST' });
  state.currentUser = null;
  showLogin();
});

$('#closeEditorBtn').addEventListener('click', closeEditor);
if (editorBackdrop) editorBackdrop.addEventListener('click', closeEditor);

$('#searchInput').addEventListener('input', event => {
  state.query = event.target.value;
  state.currentPage = 1;
  render();
});
sidebarCollapseBtn.addEventListener('click', toggleSidebar);
pageSizeSelect.addEventListener('change', event => {
  state.pageSize = Number(event.target.value || 20);
  state.currentPage = 1;
  render();
});
prevPageBtn.addEventListener('click', () => {
  state.currentPage -= 1;
  render();
});
nextPageBtn.addEventListener('click', () => {
  state.currentPage += 1;
  render();
});
$('#newBtn').addEventListener('click', () => {
  if (!canCreate()) return;
  openEditor('create', '');
});
$('#exportBtn').addEventListener('click', () => {
  if (!canExport()) return;
  window.location.href = `/api/modules/${state.currentModule}/export`;
});
$('#importBtn').addEventListener('click', () => {
  if (canImport()) importFile.click();
});
if (batchDeleteBtn) batchDeleteBtn.addEventListener('click', batchDeleteSelected);
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
