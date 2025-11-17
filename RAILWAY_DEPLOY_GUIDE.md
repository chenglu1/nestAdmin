# Railway 部署实战指南

## 🎯 部署目标
将 NestJS + React + MySQL 全栈项目部署到Railway,获得可访问的域名。

---

## 📋 准备清单

✅ GitHub仓库已推送  
✅ Railway配置文件已就绪:
- `backend/railway.json` ✅
- `backend/nixpacks.toml` ✅  
- `frontend/railway.json` ✅
- `frontend/nixpacks.toml` ✅

---

## 🚀 方案A: 网页部署(推荐)

### **Step 1: 注册Railway账号**

1. 访问 https://railway.app
2. 点击 **"Login"** → 选择 **"Login with GitHub"**
3. 授权Railway访问你的GitHub仓库

💡 **新用户福利**: 注册即送 $5 免费额度 + 500小时运行时间

---

### **Step 2: 创建新项目**

1. 进入Dashboard后,点击 **"New Project"**
2. 选择 **"Deploy from GitHub repo"**
3. 找到并选择 `chenglu1/nestAdmin` 仓库
4. Railway会自动检测到项目结构

---

### **Step 3: 部署MySQL数据库**

1. 在项目中点击 **"+ New"** → **"Database"** → **"Add MySQL"**
2. Railway自动创建MySQL实例
3. 记录数据库连接信息(会自动注入环境变量):
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`

---

### **Step 4: 部署后端服务(Backend)**

1. 点击 **"+ New"** → **"GitHub Repo"** → 选择 `nestAdmin`
2. Railway检测到monorepo结构,选择 **`backend`** 目录
3. 配置环境变量(点击 Settings → Variables):

```env
# 数据库配置(使用Railway MySQL变量)
DB_HOST=${{MySQL.MYSQL_HOST}}
DB_PORT=${{MySQL.MYSQL_PORT}}
DB_USERNAME=${{MySQL.MYSQL_USER}}
DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
DB_DATABASE=${{MySQL.MYSQL_DATABASE}}

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production-2024
JWT_EXPIRES_IN=7d

# 应用配置
PORT=3001
NODE_ENV=production

# CORS配置(后面填前端域名)
CORS_ORIGIN=https://your-frontend-domain.railway.app
```

4. 点击 **"Deploy"** 开始构建
5. 等待3-5分钟,部署成功后会显示绿色状态
6. 点击 **"Settings"** → **"Generate Domain"** 获取后端域名
   - 例如: `nestadmin-backend-production.up.railway.app`

---

### **Step 5: 初始化数据库**

**方法1: 通过Railway Shell执行SQL**

1. 点击MySQL服务 → **"Connect"** → **"MySQL Client"**
2. 复制连接命令(类似):
   ```bash
   mysql -h containers-us-west-xxx.railway.app -u root -p
   ```
3. 在本地终端执行并输入密码
4. 导入初始化SQL:
   ```sql
   USE nestadmin;
   SOURCE backend/sql/init_data.sql;
   ```

**方法2: 使用Railway Data Tab**

1. 点击MySQL服务 → **"Data"** 标签
2. 点击 **"Query"** 执行SQL
3. 粘贴 `backend/sql/init_data.sql` 内容并执行

---

### **Step 6: 部署前端服务(Frontend)**

1. 点击 **"+ New"** → **"GitHub Repo"** → 选择 `nestAdmin`
2. 选择 **`frontend`** 目录
3. 配置环境变量:

```env
# 后端API地址(填入Step 4获取的后端域名)
VITE_API_URL=https://nestadmin-backend-production.up.railway.app

# 端口配置
PORT=3000
```

4. 修改前端代码,使用环境变量:

**编辑 `frontend/src/utils/request.ts`:**
```typescript
// 使用Railway环境变量
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});
```

5. 推送代码更改:
```bash
git add .
git commit -m "feat: add Railway environment config"
git push
```

6. Railway自动触发重新部署
7. 部署成功后,点击 **"Generate Domain"** 获取前端域名
   - 例如: `nestadmin-frontend-production.up.railway.app`

---

### **Step 7: 更新CORS配置**

回到后端服务,更新环境变量:

```env
# 将前端域名填入
CORS_ORIGIN=https://nestadmin-frontend-production.up.railway.app
```

点击 **"Redeploy"** 重启后端服务。

---

### **Step 8: 验证部署**

1. 访问前端域名: `https://nestadmin-frontend-production.up.railway.app`
2. 使用默认账号登录:
   - 用户名: `admin`
   - 密码: `admin123`
3. 测试功能:
   - ✅ 用户管理
   - ✅ 角色管理
   - ✅ 菜单管理
   - ✅ 操作日志
   - ✅ 性能监控

---

## 🚀 方案B: CLI命令行部署(高级)

### **前置要求**
```powershell
# 1. 安装Railway CLI
npm install -g @railway/cli

# 2. 登录Railway
railway login

# 3. 初始化项目
railway init

# 4. 链接到GitHub仓库
railway link
```

### **部署步骤**

```powershell
# 1. 部署MySQL
railway add --database mysql

# 2. 部署后端
cd backend
railway up

# 3. 部署前端
cd ../frontend
railway up

# 4. 查看服务状态
railway status

# 5. 查看日志
railway logs
```

---

## 🔧 高级配置

### **自定义域名**

1. 在Railway项目中点击服务 → **"Settings"** → **"Domains"**
2. 点击 **"Custom Domain"**
3. 添加你的域名(需要配置DNS CNAME记录)

### **自动部署**

Railway已自动配置GitHub Webhook:
- 每次推送到 `main` 分支自动触发部署
- 可在 Settings → Deployments 中配置

### **环境分离**

```bash
# 创建开发环境
railway environment create dev

# 切换环境
railway environment use dev
```

---

## 📊 费用说明

### **免费额度**
- $5 免费额度/月
- 500小时运行时间
- 100GB出站流量
- 100GB入站流量

### **预估消耗(你的项目)**
- **后端**: ~0.5GB RAM → $0.002/小时
- **前端**: ~0.25GB RAM → $0.001/小时
- **MySQL**: ~0.5GB RAM → $0.002/小时
- **合计**: ~$3.6/月(720小时)

💡 **结论**: 免费额度足够支撑开发/测试环境

---

## ❓ 常见问题

### **Q1: 构建失败**
**A**: 检查 `package.json` 中的 `build` 脚本是否正确:
```json
{
  "scripts": {
    "build": "nest build"  // 后端
    "build": "vite build"  // 前端
  }
}
```

### **Q2: 数据库连接失败**
**A**: 确认环境变量格式:
```env
DB_HOST=${{MySQL.MYSQL_HOST}}  # 注意使用Railway变量引用
```

### **Q3: CORS错误**
**A**: 检查后端 `main.ts` 中的CORS配置:
```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
});
```

### **Q4: 端口冲突**
**A**: Railway自动分配端口,代码必须使用 `process.env.PORT`:
```typescript
await app.listen(process.env.PORT || 3001);
```

---

## 🎉 部署成功!

你的应用现在可以通过以下地址访问:
- 🌐 **前端**: https://your-frontend.railway.app
- 🔌 **后端**: https://your-backend.railway.app
- 🗄️ **数据库**: Railway内网访问

---

## 📚 参考资源

- Railway官方文档: https://docs.railway.app
- Nixpacks构建器: https://nixpacks.com
- Railway模板库: https://railway.app/templates
