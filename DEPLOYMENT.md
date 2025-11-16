# Docker 部署指南

## 📦 准备工作

### 1. 安装 Docker

**Windows/Mac:**
- 下载并安装 [Docker Desktop](https://www.docker.com/products/docker-desktop)

**Linux:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件
# 修改数据库密码和 JWT 密钥
```

## 🚀 快速部署

### 方式 1: 使用部署脚本 (推荐)

**Windows:**
```bash
deploy.bat
```

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

### 方式 2: 手动部署

```bash
# 1. 构建镜像
docker-compose build

# 2. 启动服务
docker-compose up -d

# 3. 查看日志
docker-compose logs -f

# 4. 检查状态
docker-compose ps
```

## 📋 服务访问

部署成功后,可通过以下地址访问:

- **前端**: http://localhost
- **后端API**: http://localhost:3000
- **Swagger文档**: http://localhost:3000/api-docs
- **健康检查**: http://localhost:3000/health

默认登录账号:
- 用户名: `admin`
- 密码: `admin123`

## 🔧 常用命令

### 容器管理

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f [服务名]

# 进入容器
docker-compose exec backend sh
docker-compose exec frontend sh
```

### 数据库管理

```bash
# 进入 MySQL 容器
docker-compose exec mysql mysql -uroot -p

# 导出数据库
docker-compose exec mysql mysqldump -uroot -p nest_admin > backup.sql

# 导入数据库
docker-compose exec -T mysql mysql -uroot -p nest_admin < backup.sql
```

### 清理和维护

```bash
# 清理停止的容器
docker-compose down -v

# 清理未使用的镜像
docker system prune -a

# 查看磁盘使用
docker system df
```

## 🔄 更新部署

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建镜像
docker-compose build --no-cache

# 3. 重启服务
docker-compose up -d

# 4. 清理旧镜像
docker image prune -f
```

## 🏗️ CI/CD 配置

### GitHub Actions

项目已配置 GitHub Actions 自动化部署:

1. **自动触发条件**:
   - Push 到 `main` 分支
   - Pull Request 到 `main` 分支

2. **工作流程**:
   - ✅ 代码检查 (Lint)
   - ✅ 运行测试
   - ✅ 构建应用
   - ✅ 构建 Docker 镜像
   - ✅ 推送到 Docker Hub
   - ✅ 自动部署到服务器

### 配置 GitHub Secrets

在 GitHub 仓库设置中添加以下 Secrets:

```
DOCKER_USERNAME       # Docker Hub 用户名
DOCKER_PASSWORD       # Docker Hub 密码
SERVER_HOST          # 服务器 IP 地址
SERVER_USER          # SSH 用户名
SERVER_SSH_KEY       # SSH 私钥
SERVER_PORT          # SSH 端口 (默认 22)
```

### 服务器配置

在目标服务器上:

```bash
# 1. 创建部署目录
mkdir -p /opt/nestadmin
cd /opt/nestadmin

# 2. 复制 docker-compose.yml 和 .env
scp docker-compose.yml user@server:/opt/nestadmin/
scp .env user@server:/opt/nestadmin/

# 3. 首次部署
docker-compose pull
docker-compose up -d
```

## 📊 监控和日志

### 查看服务状态

```bash
# 查看所有容器状态
docker-compose ps

# 查看资源使用
docker stats

# 查看容器详情
docker inspect nestadmin-backend
```

### 日志管理

```bash
# 实时查看所有日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 查看最近 100 行日志
docker-compose logs --tail=100 backend

# 查看时间戳
docker-compose logs -t backend
```

## 🔒 安全建议

### 生产环境配置

1. **修改默认密码**:
```env
DB_PASSWORD=StrongRandomPassword123!
JWT_SECRET=super-long-random-string-min-32-chars
```

2. **启用 HTTPS**:
```yaml
# docker-compose.yml 添加 Nginx SSL 配置
frontend:
  ports:
    - "443:443"
  volumes:
    - ./ssl:/etc/nginx/ssl
```

3. **限制端口暴露**:
```yaml
# 仅暴露必要端口
mysql:
  ports:
    - "127.0.0.1:3306:3306"  # 只允许本地访问
```

4. **定期备份**:
```bash
# 添加 crontab 定时备份
0 2 * * * docker-compose exec mysql mysqldump -uroot -p${DB_PASSWORD} nest_admin > /backup/nestadmin_$(date +\%Y\%m\%d).sql
```

## ❓ 故障排查

### 容器启动失败

```bash
# 查看错误日志
docker-compose logs backend

# 检查配置文件
cat .env

# 验证端口占用
netstat -an | grep 3000
```

### 数据库连接失败

```bash
# 检查数据库容器
docker-compose ps mysql

# 查看数据库日志
docker-compose logs mysql

# 测试连接
docker-compose exec backend ping mysql
```

### 前端无法访问后端

```bash
# 检查网络配置
docker network ls
docker network inspect nestadmin_nestadmin-network

# 检查 Nginx 配置
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf
```

## 📈 性能优化

### 1. 多阶段构建

已使用多阶段构建减小镜像体积:
- Backend: ~150MB
- Frontend: ~50MB

### 2. 缓存优化

```yaml
# docker-compose.yml
services:
  backend:
    build:
      cache_from:
        - nestadmin-backend:latest
```

### 3. 资源限制

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## 📚 参考资料

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [GitHub Actions 文档](https://docs.github.com/actions)
- [Nginx 配置指南](https://nginx.org/en/docs/)

---

**需要帮助?** 请查看项目 README 或提交 Issue
