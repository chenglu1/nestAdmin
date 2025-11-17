# Railway 部署检查清单

## ✅ 部署前检查

- [ ] **代码已推送到GitHub**
  ```powershell
  git status
  git push origin main
  ```

- [ ] **Railway CLI已安装** (可选,网页部署不需要)
  ```powershell
  npm install -g @railway/cli
  railway --version
  ```

- [ ] **配置文件已就绪**
  - [ ] `backend/railway.json` ✅
  - [ ] `backend/nixpacks.toml` ✅
  - [ ] `frontend/railway.json` ✅
  - [ ] `frontend/nixpacks.toml` ✅
  - [ ] `backend/.env.railway.template` ✅
  - [ ] `frontend/.env.railway.template` ✅

---

## 🚀 快速部署流程(网页版)

### Step 1: 注册并登录Railway
- [ ] 访问 https://railway.app
- [ ] 使用GitHub账号登录
- [ ] 授权访问仓库

### Step 2: 创建项目并部署MySQL
- [ ] 点击 "New Project"
- [ ] 选择 "Deploy from GitHub repo"
- [ ] 选择 `chenglu1/nestAdmin` 仓库
- [ ] 点击 "+ New" → "Database" → "Add MySQL"
- [ ] 等待MySQL部署完成(约1分钟)

### Step 3: 部署后端
- [ ] 点击 "+ New" → "GitHub Repo" → 选择 `backend` 目录
- [ ] 进入 Settings → Variables,添加环境变量:
  
  **复制以下配置(根据实际情况修改):**
  ```env
  DB_HOST=${{MySQL.MYSQLHOST}}
  DB_PORT=${{MySQL.MYSQLPORT}}
  DB_USERNAME=${{MySQL.MYSQLUSER}}
  DB_PASSWORD=${{MySQL.MYSQL_ROOT_PASSWORD}}
  DB_DATABASE=${{MySQL.MYSQLDATABASE}}
  JWT_SECRET=your-super-secret-jwt-key-2024
  JWT_EXPIRES_IN=7d
  PORT=3001
  NODE_ENV=production
  CORS_ORIGIN=*
  ```

- [ ] 点击 "Deploy" 开始构建
- [ ] 等待构建完成(约3-5分钟)
- [ ] 构建成功后,点击 Settings → Networking → "Generate Domain"
- [ ] **记录后端域名**: `______________________________`

### Step 4: 初始化数据库
- [ ] 点击MySQL服务
- [ ] 点击 "Data" 标签
- [ ] 点击 "Query" 打开SQL编辑器
- [ ] 复制 `backend/sql/init_data.sql` 内容
- [ ] 执行SQL初始化数据
- [ ] 验证数据是否导入成功

### Step 5: 部署前端
- [ ] 点击 "+ New" → "GitHub Repo" → 选择 `frontend` 目录
- [ ] 进入 Settings → Variables,添加环境变量:
  
  **将Step 3记录的后端域名填入:**
  ```env
  VITE_API_URL=https://your-backend-domain.railway.app
  PORT=3000
  NODE_ENV=production
  ```

- [ ] 点击 "Deploy" 开始构建
- [ ] 等待构建完成(约2-3分钟)
- [ ] 构建成功后,点击 Settings → Networking → "Generate Domain"
- [ ] **记录前端域名**: `______________________________`

### Step 6: 更新CORS配置
- [ ] 回到后端服务
- [ ] 进入 Settings → Variables
- [ ] 修改 `CORS_ORIGIN` 为前端域名:
  ```env
  CORS_ORIGIN=https://your-frontend-domain.railway.app
  ```
- [ ] 保存后自动重新部署

---

## 🧪 验证部署

- [ ] **访问前端地址**: https://_______________
- [ ] **测试登录功能**
  - 用户名: `admin`
  - 密码: `admin123`
- [ ] **测试功能模块**
  - [ ] 用户管理
  - [ ] 角色管理
  - [ ] 菜单管理
  - [ ] 操作日志
  - [ ] 性能监控
- [ ] **检查后端API**: https://_____________/health
  - 应返回 `{"status":"ok"}`

---

## 📝 部署后记录

| 服务 | 域名 | 状态 |
|------|------|------|
| 前端 | `https://________________` | ⬜️ |
| 后端 | `https://________________` | ⬜️ |
| MySQL | Railway内网 | ⬜️ |

**部署时间**: _______年___月___日  
**Railway项目ID**: ________________  
**总耗时**: ____分钟

---

## 🐛 常见问题排查

### 问题1: 构建失败
- [ ] 检查 `package.json` 中的 `build` 脚本
- [ ] 查看Railway构建日志 (Deployments → 点击失败的部署)
- [ ] 确认 Node.js 版本兼容(项目使用 Node 18)

### 问题2: 数据库连接失败
- [ ] 确认MySQL服务状态(Settings → Status)
- [ ] 检查环境变量是否正确引用 `${{MySQL.MYSQLHOST}}`
- [ ] 查看后端日志: railway logs (或网页 View Logs)

### 问题3: CORS跨域错误
- [ ] 确认后端 `CORS_ORIGIN` 包含前端域名
- [ ] 检查前端 `VITE_API_URL` 是否正确
- [ ] 清除浏览器缓存后重试

### 问题4: 前端显示 "Cannot connect to backend"
- [ ] 确认后端服务正在运行(绿色状态)
- [ ] 测试后端健康检查: `https://your-backend/health`
- [ ] 检查前端环境变量 `VITE_API_URL`
- [ ] 查看浏览器控制台网络请求

---

## 💰 费用监控

Railway免费额度:
- ✅ $5/月
- ✅ 500小时运行时间
- ✅ 100GB流量

**当前项目预估消耗**: ~$3-4/月(在免费额度内)

查看实时费用: https://railway.app/account/usage

---

## 🎯 下一步优化

- [ ] 配置自定义域名
- [ ] 添加Redis缓存服务
- [ ] 配置自动备份策略
- [ ] 设置监控告警
- [ ] 配置CI/CD自动测试

---

## 📚 参考资源

- [完整部署指南](./RAILWAY_DEPLOY_GUIDE.md)
- [Railway官方文档](https://docs.railway.app)
- [交互式部署脚本](./deploy-railway-interactive.ps1)

---

**✅ 完成所有检查项后,你的应用就成功部署了!**
