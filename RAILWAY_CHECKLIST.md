# Railway 快速部署检查清单

## ✅ 部署前检查

### 1. GitHub 仓库准备
- [ ] 代码已提交到 GitHub
- [ ] 分支为 `main` 或 `master`
- [ ] 所有配置文件已推送

### 2. 配置文件检查
- [ ] `backend/railway.json` 存在
- [ ] `backend/nixpacks.toml` 存在
- [ ] `backend/.env.railway` 存在(参考用)
- [ ] `frontend/railway.json` 存在
- [ ] `frontend/nixpacks.toml` 存在
- [ ] `frontend/.env.production` 存在

### 3. 依赖检查
- [ ] `backend/package.json` 中有 `build` 和 `start:prod` 脚本
- [ ] `frontend/package.json` 中有 `build` 脚本
- [ ] 所有依赖都在 `package.json` 中

---

## 🚀 Railway 部署步骤(网页版)

### 第一步:创建项目
1. 访问 https://railway.app
2. 点击 "New Project"
3. 选择 "Deploy from GitHub repo"
4. 选择 `nestAdmin` 仓库

### 第二步:添加数据库
1. 点击 "+ New" → "Database" → "Add MySQL"
2. 点击 "+ New" → "Database" → "Add Redis"

### 第三步:部署后端
1. 点击 "+ New" → "GitHub Repo" → 选择 `nestAdmin`
2. Root Directory: `backend`
3. 添加环境变量(Variables 标签页):

```env
NODE_ENV=production
PORT=3000
DATABASE_HOST=${{MySQL.MYSQLHOST}}
DATABASE_PORT=${{MySQL.MYSQLPORT}}
DATABASE_USER=${{MySQL.MYSQLUSER}}
DATABASE_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DATABASE_NAME=${{MySQL.MYSQLDATABASE}}
REDIS_HOST=${{Redis.REDISHOST}}
REDIS_PORT=${{Redis.REDISPORT}}
REDIS_PASSWORD=${{Redis.REDISPASSWORD}}
JWT_SECRET=<生成一个随机32位字符串>
JWT_EXPIRES_IN=7d
```

4. Settings → Networking → "Generate Domain"
5. **复制后端域名备用**

### 第四步:部署前端
1. 点击 "+ New" → "GitHub Repo" → 选择 `nestAdmin`
2. Root Directory: `frontend`
3. 添加环境变量:

```env
VITE_API_URL=<粘贴后端域名>
```

4. Settings → Networking → "Generate Domain"

### 第五步:更新后端 CORS
回到后端服务,添加环境变量:

```env
FRONTEND_URL=<前端域名>
CORS_ORIGINS=<前端域名>
```

### 第六步:初始化数据库
1. 进入 MySQL 服务 → Data 标签页
2. 执行 `backend/sql/init_data.sql` 脚本

### 第七步:验证
- [ ] 访问后端域名 `/health` 返回 OK
- [ ] 访问后端域名 `/api` 查看 Swagger
- [ ] 访问前端域名,能正常显示登录页
- [ ] 使用 admin/123456 登录成功

---

## 📝 环境变量快速复制

### 后端 Backend

```env
NODE_ENV=production
PORT=3000
DATABASE_HOST=${{MySQL.MYSQLHOST}}
DATABASE_PORT=${{MySQL.MYSQLPORT}}
DATABASE_USER=${{MySQL.MYSQLUSER}}
DATABASE_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DATABASE_NAME=${{MySQL.MYSQLDATABASE}}
REDIS_HOST=${{Redis.REDISHOST}}
REDIS_PORT=${{Redis.REDISPORT}}
REDIS_PASSWORD=${{Redis.REDISPASSWORD}}
JWT_SECRET=请替换为随机32位字符串
JWT_EXPIRES_IN=7d
FRONTEND_URL=请替换为前端域名
CORS_ORIGINS=请替换为前端域名
```

### 前端 Frontend

```env
VITE_API_URL=请替换为后端域名
```

---

## 🔑 生成 JWT_SECRET

在本地终端运行:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

复制输出的字符串作为 `JWT_SECRET`

---

## ⚡ CLI 快速部署(可选)

```powershell
# 1. 安装 Railway CLI
npm install -g @railway/cli

# 2. 登录
railway login

# 3. 运行部署脚本
.\deploy-railway.bat
```

---

## 🐛 常见问题快速修复

### 问题 1: 构建失败
**解决**: 检查 `package.json` 的 scripts,确保有 `build` 命令

### 问题 2: 数据库连接失败
**解决**: 检查环境变量,确保使用 `${{MySQL.MYSQLHOST}}` 语法

### 问题 3: 前端无法请求后端
**解决**: 
1. 检查 `VITE_API_URL` 是否正确
2. 检查后端 `CORS_ORIGINS` 是否包含前端域名

### 问题 4: 健康检查失败
**解决**: 确保后端有 `/health` 路由且正常返回

### 问题 5: 登录失败
**解决**: 
1. 检查数据库是否已初始化
2. 查看后端日志排查错误

---

## 📊 部署时间估算

| 步骤 | 预计时间 |
|------|----------|
| 创建项目 + 添加数据库 | 2 分钟 |
| 部署后端 | 3-5 分钟 |
| 部署前端 | 2-3 分钟 |
| 配置环境变量 | 3 分钟 |
| 初始化数据库 | 2 分钟 |
| **总计** | **12-15 分钟** |

---

## 🎯 下一步

部署完成后:

1. **测试所有功能**
   - [ ] 登录/登出
   - [ ] 用户管理
   - [ ] 角色权限
   - [ ] 日志查询
   - [ ] 性能监控

2. **优化建议**
   - [ ] 配置自定义域名
   - [ ] 设置定时备份
   - [ ] 配置监控告警
   - [ ] 启用 CDN 加速

3. **安全加固**
   - [ ] 修改默认管理员密码
   - [ ] 限制管理后台 IP 访问
   - [ ] 启用日志审计
   - [ ] 定期更新依赖

---

**准备好了吗?开始部署吧!** 🚀
