const express = require('express');
const path = require('node:path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { modules } = require('./modules');
const { createDb, hashPassword, listRecords, getRecord, saveRecord, deleteRecord } = require('./db');

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
    if (!user || user.password_hash !== hashPassword(password)) {
      return res.status(401).json({ error: '账号或密码不正确' });
    }
    const token = jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: '12h' });
    res.cookie(TOKEN_COOKIE, token, { httpOnly: true, sameSite: 'lax' });
    res.json({ user: { id: user.id, username: user.username, displayName: user.display_name } });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie(TOKEN_COOKIE);
    res.json({ ok: true });
  });

  app.get('/api/auth/me', requireAuth, (req, res) => {
    res.json({ user: req.user });
  });

  app.get('/api/config', requireAuth, (req, res) => {
    res.json({
      amapKey: process.env.AMAP_KEY || '',
      amapSecurityCode: process.env.AMAP_SECURITY_CODE || '',
    });
  });

  app.get('/api/modules', requireAuth, (req, res) => {
    res.json({ modules });
  });

  app.get('/api/modules/:moduleKey/records', requireAuth, (req, res) => {
    res.json({ records: listRecords(db, req.params.moduleKey) });
  });

  app.get('/api/modules/:moduleKey/records/:id', requireAuth, (req, res) => {
    const record = getRecord(db, req.params.moduleKey, req.params.id);
    if (!record) return res.status(404).json({ error: '记录不存在' });
    res.json({ record });
  });

  app.post('/api/modules/:moduleKey/records', requireAuth, (req, res) => {
    res.json({ record: saveRecord(db, req.params.moduleKey, req.body || {}) });
  });

  app.put('/api/modules/:moduleKey/records/:id', requireAuth, (req, res) => {
    res.json({ record: saveRecord(db, req.params.moduleKey, { ...(req.body || {}), id: req.params.id }) });
  });

  app.delete('/api/modules/:moduleKey/records/:id', requireAuth, (req, res) => {
    deleteRecord(db, req.params.moduleKey, req.params.id);
    res.json({ ok: true });
  });

  app.post('/api/modules/:moduleKey/import', requireAuth, (req, res) => {
    const records = Array.isArray(req.body.records) ? req.body.records : [];
    const saved = records.map(record => saveRecord(db, req.params.moduleKey, record));
    res.json({ count: saved.length, records: saved });
  });

  app.get('/api/modules/:moduleKey/export', requireAuth, (req, res) => {
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

  const frontendDir = path.join(__dirname, '..', '..', 'frontend');
  app.use(express.static(frontendDir));
  app.get('*', (req, res) => res.sendFile(path.join(frontendDir, 'index.html')));

  function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = req.cookies[TOKEN_COOKIE] || header.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: '未登录' });
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch {
      res.status(401).json({ error: '登录已过期' });
    }
  }

  return app;
}

module.exports = { createApp };
