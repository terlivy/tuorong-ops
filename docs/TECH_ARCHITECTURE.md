# 技术架构文档

## 1. 总体架构

系统采用单体 Web 应用架构：

```text
Browser
  -> Express API
  -> SQLite
```

前端由 Express 静态托管，后端提供登录、模块元数据、CRUD、导入导出接口。

## 2. 技术栈

- 前端：HTML、CSS、Vanilla JavaScript
- 后端：Node.js、Express
- 数据库：SQLite、better-sqlite3
- 认证：JWT + HttpOnly Cookie
- 地图：高德地图 Web 端 JS API，未配置 Key 时回退到内置简易地图
- 部署：Docker、docker-compose

## 3. 后端结构

```text
backend/src/app.js       Express 应用和路由
backend/src/server.js    服务启动入口
backend/src/db.js        SQLite 初始化、种子数据、CRUD
backend/src/schema.js    数据库表结构
backend/src/modules.js   模块配置和字段定义
```

## 4. 前端结构

```text
frontend/index.html      页面结构
frontend/styles.css      页面样式
frontend/app.js          登录、模块渲染、CRUD、导入导出
```

## 5. API 设计

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/modules`
- `GET /api/modules/:moduleKey/records`
- `POST /api/modules/:moduleKey/records`
- `PUT /api/modules/:moduleKey/records/:id`
- `DELETE /api/modules/:moduleKey/records/:id`
- `POST /api/modules/:moduleKey/import`
- `GET /api/modules/:moduleKey/export`

## 6. 扩展策略

新增模块优先在 `backend/src/modules.js` 中定义字段，再在 `backend/src/schema.js` 中新增表。前端会根据模块配置自动生成列表、表单、筛选和导入导出。
