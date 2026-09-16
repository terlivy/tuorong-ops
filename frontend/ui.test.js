const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');

assert.match(html, /拓融运营管理系统/);
assert.match(html, /class="login-shell"/);
assert.match(html, /class="login-hero"/);
assert.match(html, /Guizhou Tuorong Technology Co\., Ltd\./);
assert.match(html, /class="login-company-en"/);
assert.match(html, /Tuorong Operations Management System/);
assert.match(html, /class="brand-title-en"/);
assert.match(html, /class="login-logo"[^>]*tuorong-mark\.svg/);
assert.match(html, /class="brand-logo"[^>]*tuorong-mark\.svg/);
assert.doesNotMatch(html, /tuorong-logo-wide\.svg/);
assert.doesNotMatch(html, /资产 → 业务 → 执行 → 结算 → 供需\/供应链/);
assert.doesNotMatch(html, /class="nav-brand"/);
assert.ok(fs.existsSync(path.join(root, 'frontend/assets/tuorong-logo-wide.svg')));
assert.ok(fs.existsSync(path.join(root, 'frontend/assets/tuorong-mark.svg')));
assert.ok(fs.existsSync(path.join(root, 'frontend/assets/login-tech-bg.png')));

assert.match(app, /nav-group\$\{group\.items\.includes\(state\.currentModule\) \? ' active' : ''\}/);
assert.match(css, /\.nav-group\.active/);
assert.match(css, /\.nav-group h3 \{[^}]*font-size: 15px/);
assert.match(css, /\.nav-item \{[^}]*margin-left: 18px/);
assert.match(css, /\.nav-item \{[^}]*font-size: 13px/);
assert.match(css, /\.login-logo/);
assert.match(css, /\.login-shell/);
assert.match(css, /\.login-hero/);
assert.match(css, /\.login-company-en/);
assert.match(css, /\.brand-title-en/);
assert.match(css, /login-tech-bg\.png/);

console.log('frontend UI tests passed');
