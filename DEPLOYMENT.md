# 🚀 NestAdmin 自动部署指南

## 📋 目录

1. [GitHub Actions 自动化部署（推荐）](#github-actions-自动化部署推荐)
2. [Git Hook 本地部署](#git-hook-本地部署)
3. [PM2 进程管理](#pm2-进程管理)
4. [常见问题](#常见问题)

---

## GitHub Actions 自动化部署（推荐）

### 优点
- ✅ 无需在服务器配置复杂脚本
- ✅ 自动化程度高，易于管理
- ✅ 集成 GitHub，版本控制清晰
- ✅ 支持失败回滚通知

### 配置步骤

#### 1️⃣ 在 GitHub 上添加 Secrets

进入项目 → Settings → Secrets and variables → Actions

添加以下 Secrets：

| Secret 名称 | 说明 | 示例 |
|------------|------|------|
| `SERVER_HOST` | 服务器 IP 或域名 | `118.89.79.13` |
| `SERVER_USER` | SSH 用户名 | `root` |
| `SERVER_SSH_KEY` | SSH 私钥 | `-----BEGIN PRIVATE KEY-----...` |

#### 2️⃣ 获取 SSH 私钥

```bash
# 在本地生成 SSH 密钥（如果没有）
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github_deploy

# 查看私钥内容（复制到 GitHub Secrets）
cat ~/.ssh/github_deploy

# 查看公钥内容（复制到服务器）
cat ~/.ssh/github_deploy.pub
```

#### 3️⃣ 在服务器上配置 SSH

```bash
# 登录服务器
ssh root@118.89.79.13

# 创建 .ssh 目录
mkdir -p ~/.ssh

# 将公钥内容添加到授权密钥
echo "你的_公钥_内容" >> ~/.ssh/authorized_keys

# 设置权限
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

#### 4️⃣ 在服务器上初始化项目

```bash
# 登录服务器
ssh root@118.89.79.13

# 创建项目目录
mkdir -p /home/nestadmin
cd /home/nestadmin

# 克隆项目
git clone https://github.com/chenglu1/nestAdmin.git .

# 安装 PM2（全局）
npm install -g pm2

# 设置 PM2 开机自启
pm2 startup
pm2 save
```

#### 5️⃣ 工作流程

```
本地 git push → GitHub 检测到 main 分支更新 
  ↓
触发 GitHub Actions 工作流
  ↓
构建后端和前端
  ↓
连接到生产服务器（SSH）
  ↓
拉取代码 → 安装依赖 → 编译 → 重启应用
  ↓
健康检查
  ↓
部署完成/失败通知
```

---

## Git Hook 本地部署

### 原理
在服务器创建 Git 仓库，当本地推送时自动触发脚本

### 配置步骤

#### 1️⃣ 在服务器创建 Bare 仓库

```bash
# 登录服务器
ssh root@118.89.79.13

# 创建 bare 仓库
mkdir -p /home/git/nestadmin.git
cd /home/git/nestadmin.git
git init --bare
```

#### 2️⃣ 创建 post-receive Hook

```bash
# 编辑 Hook 文件
nano /home/git/nestadmin.git/hooks/post-receive

# 粘贴以下内容（参考 post-receive-hook.sh）
# ... 脚本内容 ...

# 设置执行权限
chmod +x /home/git/nestadmin.git/hooks/post-receive
```

#### 3️⃣ 本地配置远程仓库

```bash
# 在本地项目中添加生产环境远程
git remote add production ssh://root@118.89.79.13/home/git/nestadmin.git

# 推送代码到生产环境
git push production main
```

---

## PM2 进程管理

### 安装 PM2

```bash
npm install -g pm2
```

### 启动应用

```bash
# 方式 1：使用配置文件
cd /home/nestadmin/backend
pm2 start ecosystem.config.js

# 方式 2：直接启动
pm2 start dist/main.js --name nestAdmin

# 方式 3：重启应用
pm2 restart nestAdmin
```

### 常用 PM2 命令

```bash
# 查看进程列表
pm2 list

# 查看应用日志
pm2 logs nestAdmin

# 监控应用（实时）
pm2 monit

# 关闭应用
pm2 stop nestAdmin

# 删除应用
pm2 delete nestAdmin

# 设置开机自启
pm2 startup
pm2 save

# 清除自启
pm2 unstartup
```

### 查看日志

```bash
# 查看最近 50 行日志
pm2 logs nestAdmin --lines 50

# 实时查看日志
pm2 logs nestAdmin

# 查看日志文件
tail -f /var/log/nestadmin-out.log
tail -f /var/log/nestadmin-error.log
```

---

## 常见问题

### ❓ 部署失败，如何调试？

```bash
# 查看部署日志
tail -f /var/log/nestadmin-deploy.log

# 查看应用日志
pm2 logs nestAdmin

# 手动运行部署脚本
bash /home/nestadmin/scripts/deploy.sh
```

### ❓ 如何回滚到上一个版本？

```bash
# 查看提交历史
git log --oneline

# 回滚到指定版本
git reset --hard <commit-hash>
git push -f production main

# 或使用 Git 标签版本控制
git tag v1.0.0
git push origin v1.0.0
git checkout v1.0.0
```

### ❓ 部署过程中需要数据库迁移怎么办？

在 `deploy.sh` 中添加数据库迁移脚本：

```bash
# 在 build_backend 函数后添加
run_migrations() {
    log "🗄️  执行数据库迁移..."
    cd "$BACKEND_DIR"
    npm run typeorm migration:run || warn "迁移可能失败"
    log "✅ 迁移完成"
}
```

### ❓ 部署时需要更新环境变量？

在服务器创建 `.env.production` 文件：

```bash
# 在服务器编辑
nano /home/nestadmin/backend/.env.production

# 添加生产环境配置
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_secure_password
DB_DATABASE=nest_admin
```

然后在 `deploy.sh` 中加载：

```bash
source /home/nestadmin/backend/.env.production
```

### ❓ 如何监控部署状态？

集成通知服务（钉钉、企业微信、Slack）：

```bash
# 钉钉通知示例
send_notification() {
    local message=$1
    curl -X POST $DINGTALK_WEBHOOK \
      -H 'Content-Type: application/json' \
      -d '{"msgtype":"text","text":{"content":"'"$message"'"}}'
}
```

---

## 📊 部署流程图

```
代码提交
  ↓
git push main
  ↓
GitHub Actions 触发
  ↓
┌─────────────────────────┐
│ 1. 检出代码            │
│ 2. 设置 Node.js        │
│ 3. 编译后端            │
│ 4. 编译前端            │
│ 5. SSH 连接服务器      │
│ 6. 拉取代码            │
│ 7. 安装依赖            │
│ 8. 重启应用            │
│ 9. 健康检查            │
│ 10. 发送通知          │
└─────────────────────────┘
  ↓
生产环境更新完成 ✅
```

---

## 🔒 安全建议

1. **SSH 密钥管理**
   - 使用强密码保护私钥
   - 不要在代码中提交私钥
   - 定期轮换密钥

2. **环境变量**
   - 敏感信息存储在 GitHub Secrets
   - 不要在 `.env` 文件中提交到 Git
   - 使用 `.env.example` 文件示例

3. **部署验证**
   - 部署后进行健康检查
   - 监控应用日志
   - 设置告警机制

4. **回滚机制**
   - 保存部署历史
   - 快速回滚失败版本
   - 测试环境验证

---

## 📞 支持

如有问题，请检查：
- GitHub Actions 执行日志
- 服务器部署日志：`/var/log/nestadmin-deploy.log`
- PM2 应用日志：`pm2 logs nestAdmin`
