# 运营业务管理系统

一个可部署到云服务器的运营管理平台，覆盖资产、人员、项目、业务机会、执行任务、结算、供需、供应链和问题管理。

## 本地运行

```bash
npm install
cp .env.example .env
npm start
```

浏览器访问 `http://localhost:3000`。

默认账号来自 `.env`：

- `ADMIN_USER=admin`
- `ADMIN_PASSWORD=123456`

## 高德地图

资产中心支持高德地图。上线前在 `.env` 中配置：

```bash
AMAP_KEY=你的高德Web端JS API Key
AMAP_SECURITY_CODE=你的高德安全密钥
```

如果不配置 Key，系统会自动回退到内置简易地图。

## Docker 部署

```bash
cp .env.example .env
docker compose up -d --build
```

数据库文件会持久化到 `./data/ops-platform.db`。

## 常用命令

```bash
npm test
npm run check
```
