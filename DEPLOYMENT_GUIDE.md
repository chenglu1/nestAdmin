# 🚀 NestAdmin 自动化部署指南

本文档介绍如何配置 GitHub Actions 实现代码推送到 `main` 分支时自动部署到宝塔服务器。

## 📋 目录

- [前置要求](#前置要求)
- [配置步骤](#配置步骤)
- [部署模式](#部署模式)
- [GitHub Secrets 配置](#github-secrets-配置)
- [服务器配置](#服务器配置)
- [测试部署](#测试部署)
- [故障排查](#故障排查)

## 🔧 前置要求

### 服务器要求

1. **宝塔面板**已安装并运行
2. **Git** 已安装
3. **Node.js 20+** 已安装（PM2 模式）
4. **pnpm** 已安装或可通过 corepack 安装（PM2 模式）
5. **Docker** 和 **docker-compose** 已安装（Docker 模式）
6. **PM2** 已安装（PM2 模式，可通过 `npm install -g pm2` 安装）

### GitHub 要求

1. 代码仓库已推送到 GitHub
2. 拥有仓库的管理员权限（用于配置 Secrets）

## 📝 配置步骤

### 1. 在服务器上准备项目目录

登录到宝塔服务器，执行以下命令：

```bash
# 创建项目目录（如果不存在）
mkdir -p /www/wwwroot/nestAdmin
cd /www/wwwroot/nestAdmin

# 如果目录已存在但未初始化 Git，执行：
git init
git remote add origin https://github.com/chenglu1/nestAdmin.git
git fetch origin
git checkout -b main origin/main

# 如果目录已存在且已初始化 Git，确保远程仓库正确：
git remote set-url origin https://github.com/chenglu1/nestAdmin.git
git fetch origin
git checkout main
```

### 2. 配置 GitHub Secrets

在 GitHub 仓库中配置以下 Secrets：

1. 进入仓库：`https://github.com/chenglu1/nestAdmin`
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**，添加以下 Secrets：

#### 必需的 Secrets

| Secret 名称 | 说明 | 示例值 |
|------------|------|--------|
| `SERVER_HOST` | 服务器 IP 地址 | `118.89.79.13` |
| `SERVER_USER` | SSH 用户名 | `root` |
| `SERVER_SSH_KEY` | SSH 私钥内容 | 见下方说明 |
| `SERVER_SSH_PORT` | SSH 端口（可选，默认 22） | `22` |

#### 生成 SSH 密钥对

**在 Windows PowerShell 中执行：**

```powershell
# 1. 创建 .ssh 目录（如果不存在）
New-Item -ItemType Directory -Force -Path $env:USERPROFILE\.ssh

# 2. 生成 SSH 密钥对
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f $env:USERPROFILE\.ssh\github_actions_deploy

# 提示 "Enter passphrase" 时，直接按回车（留空，不设置密码）
# 提示 "Enter same passphrase again" 时，再次按回车

# 3. 查看公钥（需要添加到服务器的 authorized_keys）
Get-Content $env:USERPROFILE\.ssh\github_actions_deploy.pub

# 4. 查看私钥（需要添加到 GitHub Secrets）
Get-Content $env:USERPROFILE\.ssh\github_actions_deploy
```

**在 Linux/Mac 终端中执行：**

```bash
# 生成 SSH 密钥对（如果还没有）
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# 提示 "Enter passphrase" 时，直接按回车（留空，不设置密码）
# 提示 "Enter same passphrase again" 时，再次按回车

# 查看公钥（需要添加到服务器的 authorized_keys）
cat ~/.ssh/github_actions_deploy.pub

# 查看私钥（需要添加到 GitHub Secrets）
cat ~/.ssh/github_actions_deploy
```

**注意事项：**
- ⚠️ **Passphrase（密码短语）可以留空**：直接按回车即可，这样 GitHub Actions 可以自动使用密钥
- ⚠️ **Windows 路径**：使用 `$env:USERPROFILE\.ssh\` 而不是 `~/.ssh/`
- ⚠️ **密钥文件位置**：
  - Windows: `C:\Users\你的用户名\.ssh\github_actions_deploy`
  - Linux/Mac: `~/.ssh/github_actions_deploy`

#### 配置服务器 SSH 密钥

在**服务器**上执行：

```bash
# 将公钥添加到 authorized_keys
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "你的公钥内容" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 确保 SSH 服务允许密钥认证
# 编辑 /etc/ssh/sshd_config，确保以下配置：
# PubkeyAuthentication yes
# AuthorizedKeysFile .ssh/authorized_keys

# 重启 SSH 服务（如果需要）
systemctl restart sshd
```

#### 将私钥添加到 GitHub Secrets

1. 复制私钥内容（`~/.ssh/github_actions_deploy` 文件的全部内容）
2. 在 GitHub 仓库中添加 Secret：
   - Name: `SERVER_SSH_KEY`
   - Value: 粘贴私钥内容（包括 `-----BEGIN OPENSSH PRIVATE KEY-----` 和 `-----END OPENSSH PRIVATE KEY-----`）

### 3. 配置服务器环境

#### PM2 模式配置

```bash
# 安装 Node.js（如果未安装）
# 在宝塔面板中：软件商店 → 安装 Node.js 版本管理器

# 安装 pnpm（如果未安装）
npm install -g pnpm
# 或使用 corepack
corepack enable
corepack prepare pnpm@latest --activate

# 安装 PM2（如果未安装）
npm install -g pm2

# 配置 PM2 开机自启
pm2 startup
pm2 save
```

#### Docker 模式配置

```bash
# 在宝塔面板中安装 Docker
# 软件商店 → 安装 Docker 管理器

# 验证安装
docker --version
docker-compose --version

# 创建环境变量文件
cd /www/wwwroot/nestAdmin
cp .env.docker .env.docker.local
# 编辑 .env.docker.local，配置数据库密码等敏感信息
```

### 4. 设置部署脚本权限

```bash
cd /www/wwwroot/nestAdmin
chmod +x scripts/deploy.sh
```

### 5. 创建日志目录

```bash
mkdir -p /www/wwwroot/nestAdmin/logs
chmod 755 /www/wwwroot/nestAdmin/logs
```

## 🎯 部署模式

### PM2 模式（默认）

适用于直接在服务器上运行 Node.js 应用的场景。

**特点：**
- 需要服务器安装 Node.js、pnpm、PM2
- 代码在服务器上编译
- 使用 PM2 管理进程
- 适合传统部署方式

**配置：**
- GitHub Actions 会自动使用 PM2 模式
- 确保服务器已安装所需依赖

### Docker 模式

适用于使用 Docker 容器化部署的场景。

**特点：**
- 需要服务器安装 Docker 和 docker-compose
- 代码在容器内构建
- 使用 docker-compose 管理服务
- 适合容器化部署

**配置：**
1. 在 GitHub Actions 工作流中添加环境变量：
   ```yaml
   env:
     DEPLOY_MODE: docker
   ```
2. 或修改 `.github/workflows/deploy.yml`，在部署步骤中设置：
   ```bash
   export DEPLOY_MODE="docker"
   ```

## 🧪 测试部署

### 方法 1: 推送到 main 分支

```bash
# 在本地仓库
git checkout main
git add .
git commit -m "test: 测试自动部署"
git push origin main
```

### 方法 2: 手动触发工作流

1. 进入 GitHub 仓库
2. 点击 **Actions** 标签
3. 选择 **Deploy to Production** 工作流
4. 点击 **Run workflow** → **Run workflow**

### 查看部署日志

1. **GitHub Actions 日志**：
   - 进入仓库的 **Actions** 标签
   - 点击最新的工作流运行
   - 查看部署步骤的日志

2. **服务器日志**：
   ```bash
   # 查看部署脚本日志
   tail -f /www/wwwroot/nestAdmin/logs/deploy.log
   
   # 查看 PM2 日志（PM2 模式）
   pm2 logs nestAdmin-backend
   
   # 查看 Docker 日志（Docker 模式）
   docker-compose logs -f
   ```

## 🔍 故障排查

### 问题 1: SSH 连接失败

**症状：** GitHub Actions 显示 "Connection refused" 或 "Permission denied"

**解决方案：**
1. 检查服务器 IP 和端口是否正确
2. 验证 SSH 密钥是否正确配置
3. 检查服务器防火墙是否开放 SSH 端口
4. 测试 SSH 连接：
   ```bash
   ssh -i ~/.ssh/github_actions_deploy -p 22 root@118.89.79.13
   ```

### 问题 2: Git 操作失败

**症状：** "Git pull 失败" 或 "Git checkout 失败"

**解决方案：**
1. 检查项目目录权限：
   ```bash
   ls -la /www/wwwroot/nestAdmin
   chown -R root:root /www/wwwroot/nestAdmin
   ```
2. 检查 Git 远程仓库配置：
   ```bash
   cd /www/wwwroot/nestAdmin
   git remote -v
   ```
3. 确保服务器可以访问 GitHub（可能需要配置代理）

### 问题 3: pnpm 未找到

**症状：** "pnpm: command not found"

**解决方案：**
```bash
# 安装 pnpm
npm install -g pnpm
# 或使用 corepack
corepack enable
corepack prepare pnpm@latest --activate

# 验证安装
pnpm --version
```

### 问题 4: PM2 重启失败

**症状：** "PM2 重启失败"

**解决方案：**
1. 检查 PM2 是否安装：
   ```bash
   pm2 --version
   ```
2. 检查应用配置：
   ```bash
   cd /www/wwwroot/nestAdmin/backend
   pm2 list
   pm2 logs nestAdmin-backend
   ```
3. 手动重启：
   ```bash
   pm2 restart nestAdmin-backend
   # 或
   pm2 delete nestAdmin-backend
   pm2 start ecosystem.config.js --env production
   ```

### 问题 5: Docker 容器启动失败

**症状：** "Docker 容器启动失败"

**解决方案：**
1. 检查 Docker 服务状态：
   ```bash
   systemctl status docker
   docker ps -a
   ```
2. 检查环境变量文件：
   ```bash
   cd /www/wwwroot/nestAdmin
   ls -la .env.docker*
   ```
3. 查看 Docker 日志：
   ```bash
   docker-compose logs
   ```

### 问题 6: 健康检查失败

**症状：** "健康检查失败"

**解决方案：**
1. 检查服务是否正在运行：
   ```bash
   # PM2 模式
   pm2 list
   curl http://localhost:3001/api/health
   
   # Docker 模式
   docker-compose ps
   curl http://localhost:3001/api/health
   ```
2. 检查端口是否被占用：
   ```bash
   netstat -tlnp | grep 3001
   ```
3. 检查防火墙设置（宝塔面板 → 安全）

## 📚 相关文档

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [宝塔面板文档](https://www.bt.cn/bbs/forum-40-1.html)
- [PM2 文档](https://pm2.keymetrics.io/docs/)
- [Docker Compose 文档](https://docs.docker.com/compose/)

## 🔐 安全建议

1. **SSH 密钥安全**：
   - 不要将私钥提交到代码仓库
   - 定期轮换 SSH 密钥
   - 使用专用部署用户而非 root（推荐）

2. **服务器安全**：
   - 配置防火墙规则
   - 定期更新系统和软件
   - 使用强密码和密钥认证

3. **环境变量安全**：
   - 敏感信息使用环境变量文件（`.env.docker.local`）
   - 不要将 `.env` 文件提交到 Git
   - 使用宝塔面板的文件权限管理

## 📞 支持

如遇到问题，请：

1. 查看 GitHub Actions 日志
2. 查看服务器部署日志：`/www/wwwroot/nestAdmin/logs/deploy.log`
3. 检查服务器服务状态
4. 参考故障排查章节

---

**最后更新：** 2025-12-19

