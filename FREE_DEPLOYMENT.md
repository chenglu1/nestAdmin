# 免费部署方案指南

本文档提供多种免费部署方案,让你的 NestJS + React 全栈应用可以通过域名访问。

## 📋 目录

- [方案对比](#方案对比)
- [方案一:Railway 一键部署(推荐)](#方案一railway-一键部署推荐)
- [方案二:Vercel + Render 组合](#方案二vercel--render-组合)
- [方案三:国内云服务器免费试用](#方案三国内云服务器免费试用)
- [数据库选择](#数据库选择)
- [域名配置](#域名配置)

---

## 方案对比

| 方案 | 前端 | 后端 | 数据库 | 优势 | 限制 |
|------|------|------|--------|------|------|
| **Railway** | ✅ | ✅ | ✅ | 一站式,配置简单 | 每月$5额度(约500小时) |
| **Vercel + Render** | ✅ | ✅ | 需第三方 | 稳定性好,国内访问快 | 后端冷启动较慢 |
| **阿里云/腾讯云** | ✅ | ✅ | ✅ | 完全控制,性能好 | 3个月后收费 |
| **Netlify + Supabase** | ✅ | ❌ | ✅(PostgreSQL) | 前端完美,需改造后端 | 不支持 NestJS 原生部署 |

---

## 方案一:Railway 一键部署(推荐)

### 🎯 适用场景
- 快速上线验证想法
- 学习/演示项目
- 中小流量应用

### 💰 免费额度
- 每月 $5 免费额度
- 500 小时运行时间
- 100GB 出站流量
- 100GB 入站流量

### 📝 部署步骤

#### 1. 准备 Railway 配置文件

创建 `railway.toml`:

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm run start:prod"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "on-failure"
restartPolicyMaxRetries = 10
```

#### 2. 修改项目结构

**backend/package.json** - 添加生产启动脚本:

```json
{
  "scripts": {
    "build": "nest build",
    "start:prod": "node dist/main"
  }
}
```

**frontend/.env.production**:

```env
VITE_API_URL=https://your-backend.railway.app
```

#### 3. Railway 部署流程

1. **注册 Railway**
   - 访问 [railway.app](https://railway.app/)
   - 使用 GitHub 账号登录

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择你的 `nestAdmin` 仓库

3. **配置后端服务**
   - Railway 会自动检测 NestJS 项目
   - 设置环境变量:
     ```
     NODE_ENV=production
     PORT=3000
     DATABASE_HOST=mysql-service
     DATABASE_PORT=3306
     DATABASE_USER=root
     DATABASE_PASSWORD=your-password
     DATABASE_NAME=nest_admin
     JWT_SECRET=your-jwt-secret
     REDIS_HOST=redis-service
     REDIS_PORT=6379
     ```

4. **添加 MySQL 数据库**
   - 点击 "New Service" → "Database" → "MySQL"
   - Railway 会自动提供连接信息
   - 复制 `DATABASE_URL` 到后端环境变量

5. **添加 Redis**
   - 点击 "New Service" → "Database" → "Redis"
   - 复制 `REDIS_URL` 到后端环境变量

6. **配置前端服务**
   - 点击 "New Service" → "GitHub Repo"
   - 选择 `nestAdmin` 仓库
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Start Command: `npx serve -s dist -l $PORT`
   - 环境变量:
     ```
     VITE_API_URL=https://your-backend.railway.app
     ```

7. **获取域名**
   - 每个服务会自动获得 `xxx.railway.app` 域名
   - 可在设置中绑定自定义域名

#### 4. 数据库初始化

部署完成后,需要初始化数据库:

```bash
# 连接到 Railway MySQL
mysql -h your-mysql-host -u root -p

# 导入初始化脚本
source backend/sql/init_data.sql
```

或使用 Railway 的 Web Shell 功能。

---

## 方案二:Vercel + Render 组合

### 🎯 适用场景
- 前端需要极致性能
- 国内用户访问
- 后端逻辑不复杂

### 📝 部署步骤

#### 1. 前端部署到 Vercel

**创建 `vercel.json`**:

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "devCommand": "cd frontend && npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend.onrender.com/:path*"
    }
  ]
}
```

**部署步骤**:

1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 登录
3. Import `nestAdmin` 仓库
4. 配置:
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. 环境变量:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```
6. 点击 Deploy

#### 2. 后端部署到 Render

**创建 `render.yaml`**:

```yaml
services:
  - type: web
    name: nestadmin-backend
    env: node
    region: oregon
    plan: free
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && node dist/main
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: DATABASE_URL
        fromDatabase:
          name: nestadmin-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: REDIS_URL
        fromService:
          name: nestadmin-redis
          type: redis
          property: connectionString

databases:
  - name: nestadmin-db
    region: oregon
    plan: free
    databaseName: nest_admin
    user: admin

  - name: nestadmin-redis
    region: oregon
    plan: free
```

**部署步骤**:

1. 访问 [render.com](https://render.com)
2. 使用 GitHub 登录
3. New → Blueprint → 选择 `nestAdmin` 仓库
4. Render 会自动读取 `render.yaml` 配置
5. 点击 Apply,等待部署完成

#### 3. 优势
- ✅ 前端在 Vercel CDN,全球加速
- ✅ 后端在 Render,自动 HTTPS
- ✅ 完全免费(有一定限制)

#### 4. 限制
- ⚠️ Render 免费版有冷启动(15分钟无请求会休眠)
- ⚠️ 数据库存储限制 1GB

---

## 方案三:国内云服务器免费试用

### 🎯 适用场景
- 需要完全控制
- 学习 Linux 运维
- 有长期运营计划

### 💰 免费额度对比

| 云服务商 | 免费时长 | 配置 | 备注 |
|----------|----------|------|------|
| 阿里云 | 3个月 | 1核2G | 新用户,需实名 |
| 腾讯云 | 3个月 | 1核2G | 新用户,需实名 |
| 华为云 | 3个月 | 1核2G | 新用户,需实名 |
| Oracle Cloud | 永久免费 | 1核1G×2 | 国外服务器,网络较慢 |

### 📝 部署步骤(以阿里云为例)

#### 1. 领取免费服务器

1. 访问 [阿里云免费试用](https://free.aliyun.com/)
2. 注册并完成实名认证
3. 领取"云服务器ECS 3个月免费试用"
4. 选择配置:
   - 地域:选择离你近的(如华东)
   - 操作系统:Ubuntu 22.04 LTS
   - 公网IP:分配
5. 设置密码并启动

#### 2. 连接服务器

```bash
# Windows 使用 PowerShell
ssh root@your-server-ip

# 输入密码
```

#### 3. 服务器环境配置

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com | sh
systemctl start docker
systemctl enable docker

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 安装 Git
apt install git -y

# 克隆项目
git clone https://github.com/your-username/nestAdmin.git
cd nestAdmin
```

#### 4. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

修改为生产配置:

```env
NODE_ENV=production
PORT=3000

# 数据库配置
DATABASE_HOST=mysql
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=your-strong-password
DATABASE_NAME=nest_admin

# Redis 配置
REDIS_HOST=redis
REDIS_PORT=6379

# JWT 配置
JWT_SECRET=your-very-long-random-secret-key
JWT_EXPIRES_IN=7d

# 前端 URL
FRONTEND_URL=http://your-server-ip
```

#### 5. 使用 Docker 部署

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 等待所有服务启动(约2-3分钟)
```

#### 6. 配置防火墙

在阿里云控制台:

1. 进入 ECS 实例管理
2. 点击"安全组" → "配置规则"
3. 添加入方向规则:
   - 端口: 80/TCP (HTTP)
   - 端口: 443/TCP (HTTPS)
   - 源地址: 0.0.0.0/0

#### 7. 访问应用

- 前端: `http://your-server-ip`
- 后端 API: `http://your-server-ip:3000`
- Swagger 文档: `http://your-server-ip:3000/api`

#### 8. 配置域名(可选)

如果有域名:

```bash
# 安装 Nginx
apt install nginx -y

# 配置反向代理
nano /etc/nginx/sites-available/nestadmin
```

Nginx 配置:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 启用配置
ln -s /etc/nginx/sites-available/nestadmin /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# 配置 SSL(免费)
apt install certbot python3-certbot-nginx -y
certbot --nginx -d your-domain.com
```

---

## 数据库选择

### 免费数据库服务对比

| 服务 | 类型 | 免费额度 | 优势 | 限制 |
|------|------|----------|------|------|
| **PlanetScale** | MySQL | 5GB 存储,10亿行读 | 自动扩展,无需运维 | 每月1亿行写 |
| **Supabase** | PostgreSQL | 500MB 存储,2GB 传输 | 实时数据库,自带 API | 需改造 TypeORM 配置 |
| **Railway MySQL** | MySQL | 包含在$5额度内 | 与应用同平台 | 共享额度 |
| **Render PostgreSQL** | PostgreSQL | 1GB 存储 | 自动备份 | 90天数据保留 |

### 推荐组合

1. **Railway 一体化**: Railway MySQL(最简单)
2. **性能优先**: PlanetScale + Vercel + Render
3. **国内项目**: 云服务器自建 MySQL(完全控制)

---

## 域名配置

### 免费域名服务

1. **Freenom** - 提供免费 .tk/.ml/.ga 域名
2. **eu.org** - 免费二级域名(需审核)
3. **js.org** - 适合项目展示(需 GitHub Pages)

### 购买域名(推荐)

- **阿里云万网**: .com 首年 55元
- **腾讯云**: .com 首年 55元
- **Cloudflare**: .com 年付 $10,带免费 CDN

### DNS 配置

以阿里云域名为例:

1. 登录阿里云域名控制台
2. 点击域名 → 解析设置
3. 添加记录:

| 记录类型 | 主机记录 | 记录值 | 说明 |
|----------|----------|--------|------|
| A | @ | your-server-ip | 根域名 |
| A | www | your-server-ip | www子域名 |
| CNAME | api | your-backend.railway.app | API子域名 |

4. 等待解析生效(约10分钟)

---

## 成本估算

### 完全免费方案(适合学习/演示)

| 项目 | 服务 | 成本 |
|------|------|------|
| 前端 | Vercel | $0 |
| 后端 | Render/Railway | $0 |
| 数据库 | PlanetScale/Railway | $0 |
| 域名 | Freenom | $0 |
| **总计** | | **$0/月** |

### 低成本方案(适合小项目)

| 项目 | 服务 | 成本 |
|------|------|------|
| 前端 | Vercel | $0 |
| 后端 | Railway Pro | $5/月 |
| 数据库 | PlanetScale | $0 |
| 域名 | 阿里云 .com | 约 5元/月 |
| **总计** | | **约 40元/月** |

### 生产级方案(适合正式上线)

| 项目 | 服务 | 成本 |
|------|------|------|
| 服务器 | 阿里云轻量服务器 2核4G | 60元/月 |
| 域名 | 阿里云 .com | 5元/月 |
| CDN | 阿里云 CDN | 10元/月 |
| 备案 | 免费 | $0 |
| **总计** | | **约 75元/月** |

---

## 下一步操作

根据你的需求选择合适的方案:

### 🚀 快速验证(推荐新手)
→ 使用 **Railway 一键部署**,10分钟上线

### 💪 稳定运行
→ 使用 **Vercel + Render 组合**,前后端分离

### 🎓 学习运维
→ 申请 **阿里云免费试用**,完整体验

### 需要帮助?

选择好方案后告诉我,我会为你准备详细的部署脚本和配置文件!

---

## 常见问题

### Q: Railway 免费额度用完后怎么办?
A: 可以升级到 $5/月的 Hobby Plan,或迁移到其他平台。

### Q: 国内访问 Vercel/Render 会慢吗?
A: Vercel 在国内有 CDN 节点,前端速度很快。Render 可能稍慢,可配合 Cloudflare CDN 使用。

### Q: 免费数据库会丢数据吗?
A: Railway/PlanetScale 都有自动备份,但建议定期导出数据。

### Q: 可以使用免费域名吗?
A: 可以,但免费域名不稳定,建议购买正规域名(年付约60元)。

### Q: 需要备案吗?
A: 如果使用国外服务器(Vercel/Railway/Render),不需要备案。使用国内服务器(阿里云/腾讯云)需要备案。
