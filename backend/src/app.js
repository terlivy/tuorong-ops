const express = require('express');
const path = require('node:path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { modules } = require('./modules');
const { createDb, hashPassword, listRecords, getRecord, saveRecord, deleteRecord, userHasPermission, writeAuditLog, createAtlasSceneReport, listAtlasSceneReports } = require('./db');
const { ATLAS_CATEGORIES, flattenAtlasSubcategories, validateAtlasReportPayload, normalizeAtlasReportPayload } = require('./atlas');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const TOKEN_COOKIE = 'ops_token';

function createApp() {
  const app = express();
  const db = createDb();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '5mb' }));
  app.use(cookieParser());

  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body || {};
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || user.status !== 'active' || user.password_hash !== hashPassword(password)) {
      return res.status(401).json({ error: '账号或密码不正确' });
    }
    const token = jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: '12h' });
    res.cookie(TOKEN_COOKIE, token, { httpOnly: true, sameSite: 'lax' });
    writeAuditLog(db, auditEntry(req, user, 'auth', 'login', user.id, 'login'));
    res.json({ user: currentUserPayload(user) });
  });

  app.post('/api/auth/logout', requireAuth, (req, res) => {
    writeAuditLog(db, auditEntry(req, req.user, 'auth', 'logout', req.user.id, 'logout'));
    res.clearCookie(TOKEN_COOKIE);
    res.json({ ok: true });
  });

  app.get('/api/auth/me', requireAuth, (req, res) => {
    res.json({ user: currentUserPayload(req.user) });
  });

  app.get('/api/config', requireAuth, (req, res) => {
    res.json({
      amapKey: process.env.AMAP_KEY || '',
      amapSecurityCode: process.env.AMAP_SECURITY_CODE || '',
    });
  });

  app.get('/api/modules', requireAuth, (req, res) => {
    res.json({ modules: modulesForUser(req.user) });
  });

  app.get('/api/modules/:moduleKey/records', requireAuth, (req, res) => {
    if (!can(req.user, req.params.moduleKey, 'view')) return forbidden(res);
    res.json({ records: listRecords(db, req.params.moduleKey) });
  });

  app.get('/api/modules/:moduleKey/records/:id', requireAuth, (req, res) => {
    if (!can(req.user, req.params.moduleKey, 'view')) return forbidden(res);
    const record = getRecord(db, req.params.moduleKey, req.params.id);
    if (!record) return res.status(404).json({ error: '记录不存在' });
    res.json({ record });
  });

  app.post('/api/modules/:moduleKey/records', requireAuth, (req, res) => {
    const mod = modules[req.params.moduleKey];
    if (!mod || mod.readOnly || !can(req.user, req.params.moduleKey, 'create')) return forbidden(res);
    const record = saveRecord(db, req.params.moduleKey, req.body || {});
    writeAuditLog(db, auditEntry(req, req.user, req.params.moduleKey, 'create', record.id, record[mod.primaryField] || record.id));
    res.json({ record });
  });

  app.put('/api/modules/:moduleKey/records/:id', requireAuth, (req, res) => {
    const mod = modules[req.params.moduleKey];
    if (!mod || mod.readOnly || !can(req.user, req.params.moduleKey, 'update')) return forbidden(res);
    const record = saveRecord(db, req.params.moduleKey, { ...(req.body || {}), id: req.params.id });
    writeAuditLog(db, auditEntry(req, req.user, req.params.moduleKey, 'update', record.id, record[mod.primaryField] || record.id));
    res.json({ record });
  });

  app.delete('/api/modules/:moduleKey/records/:id', requireAuth, (req, res) => {
    const mod = modules[req.params.moduleKey];
    if (!mod || mod.readOnly || !can(req.user, req.params.moduleKey, 'delete')) return forbidden(res);
    deleteRecord(db, req.params.moduleKey, req.params.id);
    writeAuditLog(db, auditEntry(req, req.user, req.params.moduleKey, 'delete', req.params.id, req.params.id));
    res.json({ ok: true });
  });

  app.post('/api/modules/:moduleKey/import', requireAuth, (req, res) => {
    if (!can(req.user, req.params.moduleKey, 'import')) return forbidden(res);
    const records = Array.isArray(req.body.records) ? req.body.records : [];
    const saved = records.map(record => saveRecord(db, req.params.moduleKey, record));
    writeAuditLog(db, auditEntry(req, req.user, req.params.moduleKey, 'import', '', `${saved.length}`));
    res.json({ count: saved.length, records: saved });
  });

  app.get('/api/modules/:moduleKey/export', requireAuth, (req, res) => {
    if (!can(req.user, req.params.moduleKey, 'export')) return forbidden(res);
    const mod = modules[req.params.moduleKey];
    if (!mod) return res.status(404).send('Unknown module');
    const rows = listRecords(db, req.params.moduleKey);
    const headers = mod.fields.map(field => field.label);
    const keys = mod.fields.map(field => field.name);
    const csv = [headers, ...rows.map(row => keys.map(key => row[key] || ''))]
      .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(mod.title)}.csv"`);
    res.send('\ufeff' + csv);
  });

  app.get('/api/dashboard/guizhou-business-map', requireAuth, (req, res) => {
    if (!can(req.user, 'assets', 'view')) return forbidden(res);
    res.json(buildGuizhouBusinessMap());
  });

  app.get('/api/atlas/categories', requireAuth, (req, res) => {
    res.json({
      categories: ATLAS_CATEGORIES,
      subcategoryCount: flattenAtlasSubcategories().length,
    });
  });

  app.get('/api/atlas/reports', requireAuth, (req, res) => {
    res.json({ reports: listAtlasSceneReports(db, req.user.id) });
  });

  app.post('/api/atlas/reports', requireAuth, (req, res) => {
    const errors = validateAtlasReportPayload(req.body || {});
    if (errors.length) return res.status(400).json({ error: 'invalid_atlas_report', errors });
    const report = createAtlasSceneReport(db, normalizeAtlasReportPayload(req.body || {}, req.user));
    writeAuditLog(db, auditEntry(req, req.user, 'atlas_scene_reports', 'create', report.id, report.sceneName));
    res.json({ report });
  });

  const frontendDir = path.join(__dirname, '..', '..', 'frontend');
  app.get('/admin', (req, res) => res.sendFile(path.join(frontendDir, 'index.html')));
  app.get('/admin/', (req, res) => res.redirect(301, '/admin'));
  app.get('/h5', (req, res) => res.sendFile(path.join(frontendDir, 'atlas-h5.html')));
  app.get('/h5/', (req, res) => res.redirect(301, '/h5'));
  app.get('/h5/atlas-report', (req, res) => res.sendFile(path.join(frontendDir, 'atlas-h5.html')));
  app.use(express.static(frontendDir));
  app.get('*', (req, res) => res.sendFile(path.join(frontendDir, 'index.html')));

  function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = req.cookies[TOKEN_COOKIE] || header.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: '未登录' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.sub);
      if (!user || user.status !== 'active') return res.status(401).json({ error: '未登录' });
      req.user = user;
      next();
    } catch {
      res.status(401).json({ error: '登录已过期' });
    }
  }

  function modulesForUser(user) {
    return Object.fromEntries(Object.entries(modules).map(([key, mod]) => {
      const permissions = {
        view: can(user, key, 'view'),
        create: !mod.readOnly && can(user, key, 'create'),
        update: !mod.readOnly && can(user, key, 'update'),
        delete: !mod.readOnly && can(user, key, 'delete'),
        import: !mod.readOnly && can(user, key, 'import'),
        export: can(user, key, 'export'),
      };
      return [key, { ...mod, permissions }];
    }));
  }

  function can(user, moduleKey, action) {
    return userHasPermission(db, user, moduleKey, action);
  }

  function forbidden(res) {
    return res.status(403).json({ error: '没有操作权限' });
  }

  function currentUserPayload(user) {
    return {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      roleCode: user.role_code,
      status: user.status,
    };
  }

  function auditEntry(req, user, moduleKey, action, targetId, detail) {
    return {
      actorId: user.id,
      actorName: user.username,
      moduleKey,
      action,
      targetId,
      detail,
      ip: req.ip || req.socket?.remoteAddress || '',
      userAgent: req.get('user-agent') || '',
    };
  }

  function buildGuizhouBusinessMap() {
    const assets = listRecords(db, 'assets');
    const opportunities = listRecords(db, 'opportunities');
    const supplyDemand = listRecords(db, 'supply_demand');
    const supplyChain = listRecords(db, 'supply_chain');
    const executionTasks = listRecords(db, 'execution_tasks');
    const activeAssets = assets.filter(asset => ['active', 'trial', 'interested'].includes(asset.cooperationStage));
    const collectionAssets = assets.filter(asset => textIncludes(asset.businessTags, ['数据采集', '采集']));
    const pendingSupplyDemand = supplyDemand.filter(item => ['pending', 'demand'].some(value => Object.values(item).includes(value)));
    const pendingSupplyOrders = supplyChain.filter(item => ['pending', 'shipping'].includes(item.deliveryStatus));
    const robotCandidates = assets.filter(asset => {
      const hasCollectionHabit = textIncludes(asset.businessTags, ['数据采集', '采集']) || ['active', 'trial'].includes(asset.cooperationStage);
      return hasCollectionHabit && asset.assetStatus !== 'invalid';
    });

    return {
      cards: {
        assetCount: assets.length,
        keyAssetCount: assets.filter(asset => ['key', 'valuable'].includes(asset.assetStatus)).length,
        activeRelationshipCount: activeAssets.length,
        dataCollectionTouchpointCount: Math.max(collectionAssets.length, executionTasks.filter(task => task.businessType === 'data_collection').length),
        supplyChainOpportunityCount: pendingSupplyDemand.length + pendingSupplyOrders.length,
        robotOpportunityCount: robotCandidates.length,
      },
      regionMap: summarizeByRegion(assets),
      industryMap: summarizeByIndustry(assets),
      conversionFunnel: [
        { key: 'dataCollection', label: '数采信任入口', count: Math.max(collectionAssets.length, executionTasks.filter(task => task.businessType === 'data_collection').length) },
        { key: 'relationship', label: '稳定合作关系', count: activeAssets.length },
        { key: 'supplyChain', label: '供应链整合机会', count: pendingSupplyDemand.length + pendingSupplyOrders.length },
        { key: 'robot', label: '机器人落地候选', count: robotCandidates.length },
      ],
      supplyChainOpportunities: pendingSupplyDemand.slice(0, 6).map(item => ({
        title: item.demandTitle,
        assetName: item.assetName,
        category: item.category || '常规补货',
        estimatedValue: Number(item.budget || 0),
        action: '聚合周边门店需求，形成工厂直采清单',
      })),
      robotOpportunities: robotCandidates.slice(0, 6).map(asset => ({
        assetName: asset.name,
        region: regionFor(asset),
        scene: robotSceneFor(asset),
        reason: '已有数采触点或合作习惯，可承接机器人租赁与运维',
      })),
      priorityActions: buildPriorityActions(assets, opportunities, pendingSupplyDemand, robotCandidates),
    };
  }

  function summarizeByRegion(assets) {
    const regions = ['贵阳', '遵义', '六盘水', '安顺', '毕节', '铜仁', '黔东南', '黔南', '黔西南'];
    const counts = Object.fromEntries(regions.map(region => [region, 0]));
    assets.forEach(asset => {
      counts[regionFor(asset)] += 1;
    });
    return regions.map(name => ({ name, count: counts[name] })).filter(region => region.count > 0 || region.name === '贵阳');
  }

  function summarizeByIndustry(assets) {
    const buckets = [
      ['convenience', '便利零售', ['便利', '门店', '超市']],
      ['food', '餐饮生鲜', ['水果', '餐饮', '切配', '食材']],
      ['collection', '数采触点', ['数据采集', '采集']],
      ['supply', '供应链客户', ['供应链', '供需']],
    ];
    return buckets.map(([key, label, words]) => ({
      key,
      label,
      count: assets.filter(asset => textIncludes(`${asset.name} ${asset.assetType} ${asset.businessTags} ${asset.notes}`, words)).length,
    }));
  }

  function buildPriorityActions(assets, opportunities, pendingSupplyDemand, robotCandidates) {
    const actions = [];
    const activeAssets = assets.filter(asset => ['active', 'trial', 'interested'].includes(asset.cooperationStage));
    if (activeAssets[0]) {
      actions.push({
        title: '提前锁定数采后续合作',
        target: activeAssets[0].name,
        detail: '把合作主体锁定为本公司，准备跨平台任务切换和类目调整。',
      });
    }
    if (pendingSupplyDemand[0]) {
      actions.push({
        title: '启动街区采购聚合',
        target: pendingSupplyDemand[0].assetName || pendingSupplyDemand[0].demandTitle,
        detail: '按品类汇总周边 50 家店需求，用省钱逻辑切入供应链。',
      });
    }
    if (robotCandidates[0]) {
      actions.push({
        title: '筛选机器人试点门店',
        target: robotCandidates[0].name,
        detail: '优先选择已有设备与人员习惯的门店，包装租赁和运维方案。',
      });
    }
    const wonOpportunity = opportunities.find(item => item.stage === 'won' || Number(item.dealAmount || 0) > 0);
    if (wonOpportunity) {
      actions.push({
        title: '复盘成交门店画像',
        target: wonOpportunity.businessName,
        detail: '提炼可复制行业画像，用于贵州其他城市拓展。',
      });
    }
    return actions;
  }

  function regionFor(asset) {
    const text = `${asset.address || ''} ${asset.notes || ''}`;
    const regions = ['贵阳', '遵义', '六盘水', '安顺', '毕节', '铜仁', '黔东南', '黔南', '黔西南'];
    return regions.find(region => text.includes(region)) || '贵阳';
  }

  function robotSceneFor(asset) {
    const text = `${asset.name || ''} ${asset.businessTags || ''} ${asset.notes || ''}`;
    if (textIncludes(text, ['水果', '切配'])) return '水果切配与后厨协作';
    if (textIncludes(text, ['便利', '理货', '门店'])) return '便利店理货与巡检';
    if (textIncludes(text, ['餐饮', '食材'])) return '餐饮备货与清洁';
    return '门店运营辅助';
  }

  function textIncludes(text, words) {
    return words.some(word => String(text || '').includes(word));
  }

  return app;
}

module.exports = { createApp };
