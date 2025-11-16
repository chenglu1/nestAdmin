# Railway 部署完整指南

本指南详细介绍如何将 NestJS + React 全栈项目部署到 Railway 平台。

## 📋 目录

- [准备工作](#准备工作)
- [Railway 账号注册](#railway-账号注册)
- [方案一:网页控制台部署(推荐新手)](#方案一网页控制台部署推荐新手)
- [方案二:CLI 命令行部署](#方案二cli-命令行部署)
- [环境变量配置](#环境变量配置)
- [数据库初始化](#数据库初始化)
- [域名访问](#域名访问)
- [常见问题](#常见问题)

---

## 准备工作

### ✅ 确认项目已推送到 GitHub

```powershell
# 检查 Git 状态
git status

# 如果有新文件,提交更改
git add .
git commit -m "Add Railway deployment configuration"
git push origin main
```

### 📦 项目结构要求

```
nestAdmin/
├── backend/              # NestJS 后端
│   ├── src/
│   ├── package.json
│   ├── railway.json      # ✅ 已创建
│   ├── nixpacks.toml     # ✅ 已创建
│   └── .env.railway      # ✅ 已创建
├── frontend/             # React 前端
│   ├── src/
│   ├── package.json
│   ├── railway.json      # ✅ 已创建
│   ├── nixpacks.toml     # ✅ 已创建
│   └── .env.production   # ✅ 已创建
└── railway.toml          # ✅ 已创建
```

---

## Railway 账号注册

### 1. 访问 Railway 官网

🔗 [https://railway.app](https://railway.app)

### 2. 使用 GitHub 账号登录

- 点击 **"Login with GitHub"**
- 授权 Railway 访问你的 GitHub 仓库
- 完成注册

### 3. 了解免费额度

| 项目 | 免费额度 |
|------|----------|
| **月度额度** | $5 免费额度 |
| **运行时间** | 约 500 小时/月 |
| **带宽** | 100GB 出站 + 100GB 入站 |
| **存储** | 根据使用量计费 |
| **数据库** | 包含在额度内 |

💡 **提示**: 对于学习和小型项目完全够用!

---

## 方案一:网页控制台部署(推荐新手)

### 🎯 第一步:创建新项目

1. **登录 Railway Dashboard**
   - 访问 [railway.app/dashboard](https://railway.app/dashboard)

2. **创建新项目**
   - 点击 **"New Project"** 按钮
   - 选择 **"Deploy from GitHub repo"**

3. **连接 GitHub 仓库**
   - 在弹出窗口中找到 `nestAdmin` 仓库
   - 点击 **"Deploy Now"**

### 🗄️ 第二步:添加数据库服务

#### 添加 MySQL

1. 在项目面板点击 **"+ New"**
2. 选择 **"Database"** → **"Add MySQL"**
3. Railway 自动创建 MySQL 8.0 实例
4. 记录连接信息(自动生成环境变量):
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`

#### 添加 Redis

1. 再次点击 **"+ New"**
2. 选择 **"Database"** → **"Add Redis"**
3. Railway 自动创建 Redis 7 实例
4. 记录连接信息:
   - `REDISHOST`
   - `REDISPORT`
   - `REDISPASSWORD`

### 🔧 第三步:部署后端服务

1. **添加后端服务**
   - 点击 **"+ New"** → **"GitHub Repo"**
   - 选择 `nestAdmin` 仓库
   - Root Directory: 输入 `backend`
   - 点击 **"Add Service"**

2. **配置构建设置**
   - Railway 会自动检测 `railway.json` 和 `nixpacks.toml`
   - 构建命令: `npm ci && npm run build`
   - 启动命令: `npm run start:prod`

3. **设置环境变量**
   
   进入 Backend 服务 → **Variables** 标签页,添加以下变量:

   ```env
   # 应用配置
   NODE_ENV=production
   PORT=3000

   # 数据库配置(引用 MySQL 服务)
   DATABASE_HOST=${{MySQL.MYSQLHOST}}
   DATABASE_PORT=${{MySQL.MYSQLPORT}}
   DATABASE_USER=${{MySQL.MYSQLUSER}}
   DATABASE_PASSWORD=${{MySQL.MYSQLPASSWORD}}
   DATABASE_NAME=${{MySQL.MYSQLDATABASE}}

   # Redis 配置(引用 Redis 服务)
   REDIS_HOST=${{Redis.REDISHOST}}
   REDIS_PORT=${{Redis.REDISPORT}}
   REDIS_PASSWORD=${{Redis.REDISPASSWORD}}

   # JWT 配置(重要:修改为你自己的密钥)
   JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
   JWT_EXPIRES_IN=7d
   ```

   💡 **生成安全的 JWT_SECRET**:
   ```powershell
   # 在本地生成随机密钥
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **启用健康检查**
   - Settings → Health Check Path: `/health`
   - Health Check Timeout: `300` 秒

5. **获取后端域名**
   - 点击 **Settings** → **Networking**
   - 点击 **"Generate Domain"**
   - 获得类似: `https://backend-production-xxxx.up.railway.app`
   - **复制此域名,后续需要用到**

### 🎨 第四步:部署前端服务

1. **添加前端服务**
   - 点击 **"+ New"** → **"GitHub Repo"**
   - 选择 `nestAdmin` 仓库
   - Root Directory: 输入 `frontend`
   - 点击 **"Add Service"**

2. **配置构建设置**
   - 构建命令: `npm ci && npm run build`
   - 启动命令: `npx serve -s dist -l $PORT`

3. **设置环境变量**

   进入 Frontend 服务 → **Variables** 标签页:

   ```env
   # API 地址 - 替换为你的后端域名
   VITE_API_URL=https://backend-production-xxxx.up.railway.app
   ```

   ⚠️ **重要**: 将 `backend-production-xxxx.up.railway.app` 替换为上一步复制的后端域名!

4. **生成前端域名**
   - Settings → Networking → **"Generate Domain"**
   - 获得类似: `https://frontend-production-yyyy.up.railway.app`

5. **更新后端 CORS 配置**
   
   回到 Backend 服务,添加环境变量:

   ```env
   # 前端域名 - 用于 CORS
   FRONTEND_URL=https://frontend-production-yyyy.up.railway.app
   CORS_ORIGINS=https://frontend-production-yyyy.up.railway.app
   ```

### 📊 第五步:初始化数据库

#### 方法一:使用 Railway 的 MySQL 客户端

1. **连接数据库**
   - 进入 MySQL 服务
   - 点击 **"Data"** 标签页
   - 点击 **"Connect"** → **"MySQL Client"**

2. **执行初始化脚本**
   
   将 `backend/sql/init_data.sql` 的内容复制粘贴执行

#### 方法二:使用本地 MySQL 客户端

1. **获取连接信息**
   - 进入 MySQL 服务 → **"Connect"** 标签页
   - 复制连接命令

2. **本地连接**
   ```powershell
   # 使用 Railway 提供的连接信息
   mysql -h containers-us-west-xxx.railway.app -P 7814 -u root -p
   
   # 输入密码后,执行初始化
   use nest_admin;
   source C:\Users\chenglu\Desktop\todo\nestAdmin\backend\sql\init_data.sql
   ```

#### 方法三:使用数据库管理工具

1. **下载 MySQL Workbench 或 DBeaver**
2. **创建新连接**:
   - Host: Railway 提供的 MYSQLHOST
   - Port: Railway 提供的 MYSQLPORT
   - User: root
   - Password: Railway 提供的密码
3. **导入 `init_data.sql` 文件**

### ✅ 第六步:验证部署

1. **检查服务状态**
   - 确保所有服务显示为绿色 ✅
   - 查看日志,确认没有错误

2. **测试后端 API**
   ```powershell
   # 测试健康检查
   curl https://backend-production-xxxx.up.railway.app/health
   
   # 测试 Swagger 文档
   # 访问: https://backend-production-xxxx.up.railway.app/api
   ```

3. **访问前端页面**
   - 打开: `https://frontend-production-yyyy.up.railway.app`
   - 尝试登录(默认账号: admin / 123456)
   - 测试各个功能模块

---

## 方案二:CLI 命令行部署

### 📦 安装 Railway CLI

```powershell
# 使用 npm 安装
npm install -g @railway/cli

# 验证安装
railway --version
```

### 🚀 使用自动部署脚本

```powershell
# 运行部署脚本
.\deploy-railway.bat

# 按照提示操作:
# 1. 登录 Railway
# 2. 创建新项目
# 3. 添加 MySQL 和 Redis
# 4. 部署后端和前端
```

### 🔧 手动 CLI 部署步骤

#### 1. 登录 Railway

```powershell
railway login
```

浏览器会自动打开,完成授权。

#### 2. 创建新项目

```powershell
# 初始化项目
railway init

# 输入项目名称
nestAdmin
```

#### 3. 添加数据库

```powershell
# 添加 MySQL
railway add --plugin mysql

# 添加 Redis
railway add --plugin redis
```

#### 4. 部署后端

```powershell
# 进入后端目录
cd backend

# 创建后端服务
railway service create backend

# 链接到后端服务
railway link

# 设置环境变量
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# 部署
railway up

# 生成域名
railway domain
```

#### 5. 部署前端

```powershell
# 返回根目录
cd ..

# 进入前端目录
cd frontend

# 创建前端服务
railway service create frontend

# 链接到前端服务
railway link

# 设置后端 API 地址(替换为实际域名)
railway variables set VITE_API_URL=https://backend-production-xxxx.up.railway.app

# 部署
railway up

# 生成域名
railway domain
```

#### 6. 查看部署状态

```powershell
# 查看所有服务
railway status

# 查看日志
railway logs

# 打开控制台
railway open
```

---

## 环境变量配置

### 📝 必需的环境变量清单

#### Backend 服务

| 变量名 | 说明 | 示例值 | 必需 |
|--------|------|--------|------|
| `NODE_ENV` | 环境模式 | `production` | ✅ |
| `PORT` | 服务端口 | `3000` | ✅ |
| `DATABASE_HOST` | MySQL 主机 | `${{MySQL.MYSQLHOST}}` | ✅ |
| `DATABASE_PORT` | MySQL 端口 | `${{MySQL.MYSQLPORT}}` | ✅ |
| `DATABASE_USER` | MySQL 用户 | `${{MySQL.MYSQLUSER}}` | ✅ |
| `DATABASE_PASSWORD` | MySQL 密码 | `${{MySQL.MYSQLPASSWORD}}` | ✅ |
| `DATABASE_NAME` | 数据库名称 | `${{MySQL.MYSQLDATABASE}}` | ✅ |
| `REDIS_HOST` | Redis 主机 | `${{Redis.REDISHOST}}` | ✅ |
| `REDIS_PORT` | Redis 端口 | `${{Redis.REDISPORT}}` | ✅ |
| `REDIS_PASSWORD` | Redis 密码 | `${{Redis.REDISPASSWORD}}` | ❌ |
| `JWT_SECRET` | JWT 密钥 | 随机 32+ 字符 | ✅ |
| `JWT_EXPIRES_IN` | Token 过期时间 | `7d` | ✅ |
| `FRONTEND_URL` | 前端域名 | `https://...` | ✅ |
| `CORS_ORIGINS` | CORS 允许域名 | 前端域名 | ✅ |

#### Frontend 服务

| 变量名 | 说明 | 示例值 | 必需 |
|--------|------|--------|------|
| `VITE_API_URL` | 后端 API 地址 | `https://backend-xxx.railway.app` | ✅ |

### 🔗 服务引用语法

Railway 支持引用其他服务的变量:

```env
# 格式: ${{ServiceName.VARIABLE_NAME}}

# 引用 MySQL 服务
DATABASE_HOST=${{MySQL.MYSQLHOST}}

# 引用 Redis 服务
REDIS_HOST=${{Redis.REDISHOST}}

# 引用后端服务(在前端使用)
VITE_API_URL=${{backend.RAILWAY_PUBLIC_DOMAIN}}
```

---

## 数据库初始化

### 方案 A:直接在 Railway 执行 SQL

1. 打开 MySQL 服务的 **Data** 标签页
2. 点击 **Query** 按钮
3. 粘贴 `backend/sql/init_data.sql` 内容
4. 点击 **Execute** 执行

### 方案 B:使用本地客户端

```powershell
# 1. 获取连接信息
railway variables --service mysql

# 2. 连接数据库
mysql -h <MYSQLHOST> -P <MYSQLPORT> -u root -p<MYSQLPASSWORD>

# 3. 选择数据库
use nest_admin;

# 4. 执行初始化脚本
source backend/sql/init_data.sql;

# 5. 验证
show tables;
select * from sys_user;
```

### 方案 C:使用 TypeORM 自动同步(不推荐生产环境)

临时修改后端配置,让 TypeORM 自动创建表结构:

```typescript
// backend/src/data-source.ts
{
  synchronize: true, // 仅用于初始化,之后要改回 false
}
```

然后使用方案 A 或 B 导入初始数据。

---

## 域名访问

### 🌐 使用 Railway 提供的域名

**优点**: 免费,自动 HTTPS,开箱即用

**缺点**: 域名较长,不易记忆

```
前端: https://frontend-production-yyyy.up.railway.app
后端: https://backend-production-xxxx.up.railway.app
```

### 🔗 绑定自定义域名

如果你有自己的域名:

#### 1. 添加自定义域名

1. 进入服务 → **Settings** → **Networking**
2. 点击 **"Custom Domain"**
3. 输入你的域名,如: `www.yourdomain.com`

#### 2. 配置 DNS 记录

在你的域名提供商(如阿里云、腾讯云)添加 CNAME 记录:

| 类型 | 主机记录 | 记录值 |
|------|----------|--------|
| CNAME | www | Railway 提供的域名 |
| CNAME | api | Railway 提供的域名 |

示例:
```
www.yourdomain.com  → CNAME → frontend-production-yyyy.up.railway.app
api.yourdomain.com  → CNAME → backend-production-xxxx.up.railway.app
```

#### 3. 等待 DNS 生效

通常需要 10-30 分钟,可以通过以下命令检查:

```powershell
nslookup www.yourdomain.com
```

#### 4. Railway 自动配置 SSL

DNS 生效后,Railway 会自动申请并配置 Let's Encrypt 免费 SSL 证书。

---

## 常见问题

### ❓ 部署失败怎么办?

#### 1. 查看构建日志

```powershell
railway logs --service backend
```

#### 2. 常见错误及解决方案

**错误**: `Module not found`
```bash
# 解决: 确保 package.json 中有所有依赖
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

**错误**: `Port already in use`
```bash
# 解决: 使用 Railway 提供的 $PORT 变量
# backend/src/main.ts
const port = process.env.PORT || 3000;
```

**错误**: `Database connection failed`
```bash
# 解决: 检查环境变量是否正确引用
# 确保使用 ${{MySQL.MYSQLHOST}} 语法
```

### ❓ 如何查看实时日志?

```powershell
# CLI 方式
railway logs --follow

# 或在网页控制台
# 进入服务 → Deployments → 点击最新部署 → View Logs
```

### ❓ 如何重新部署?

```powershell
# 方法 1: 推送代码触发自动部署
git push origin main

# 方法 2: CLI 手动部署
cd backend
railway up

# 方法 3: 网页控制台
# 进入服务 → Deployments → Redeploy
```

### ❓ 数据库如何备份?

```powershell
# 导出数据库
railway run mysqldump -u root -p nest_admin > backup.sql

# 或使用本地工具
mysqldump -h <MYSQLHOST> -P <MYSQLPORT> -u root -p<PASSWORD> nest_admin > backup.sql
```

### ❓ 如何扩展资源?

Railway 会根据你的使用情况自动扩展,但免费额度有限。

如需更多资源:
1. 升级到 **Hobby Plan** ($5/月,更高配额)
2. 进入 **Project Settings** → **Usage** 查看当前使用情况

### ❓ 前端请求后端 404?

**原因**: CORS 配置或 API 地址错误

**解决**:
1. 检查前端环境变量 `VITE_API_URL` 是否正确
2. 确保后端 `FRONTEND_URL` 和 `CORS_ORIGINS` 已设置
3. 检查后端 CORS 中间件配置

### ❓ 如何启用日志查询功能?

确保后端日志服务正常工作:

```typescript
// backend/src/modules/system/log/log.service.ts
// 确保日志写入数据库
```

前端访问: `/system/logs`

### ❓ Redis 连接失败?

Railway 的 Redis 可能需要密码,确保环境变量正确:

```env
REDIS_HOST=${{Redis.REDISHOST}}
REDIS_PORT=${{Redis.REDISPORT}}
REDIS_PASSWORD=${{Redis.REDISPASSWORD}}
```

---

## 🎉 部署完成

恭喜!你的全栈应用已成功部署到 Railway!

### 📊 下一步

1. **监控应用**: 在 Railway 控制台查看 Metrics
2. **设置告警**: Settings → Notifications
3. **优化性能**: 查看日志,优化慢查询
4. **配置 CI/CD**: 推送代码自动部署已启用
5. **绑定域名**: 如有自定义域名,按上述步骤配置

### 🔗 有用的链接

- Railway 文档: https://docs.railway.app
- Railway 社区: https://railway.app/discord
- Railway 状态: https://status.railway.app

### 💬 需要帮助?

如遇到问题,可以:
1. 查看 Railway 文档
2. 访问 Railway Discord 社区
3. 查看项目日志定位问题

---

**祝部署顺利!** 🚀
