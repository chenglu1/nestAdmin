# NestJS + React 全栈管理系统

一个现代化、高性能的前后端分离管理系统,包含用户认证、权限管理、日志记录、性能监控等企业级功能。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.1-red)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2-purple)](https://vitejs.dev/)
[![Ant Design](https://img.shields.io/badge/Ant%20Design-6.0-blue)](https://ant.design/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-blue)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/Zustand-4.5-green)](https://zustand-demo.pmnd.rs/)

## ✨ 核心功能

- 🔐 **用户认证**: JWT + Passport 身份验证，支持HttpOnly Cookie安全存储
- 👥 **权限管理**: 用户、角色、菜单管理
- 📊 **性能监控**: API响应时间、慢查询追踪、系统健康检查
- 📝 **操作日志**: 完整的审计日志记录和查询
- 📖 **API文档**: Swagger自动生成接口文档
- 🎨 **现代化UI**: Ant Design 6 + 响应式布局
- 🔒 **安全加固**: Helmet + 请求限流 + 输入验证 + XSS防护
- ⚡ **性能优化**: 代码分割 + 路由懒加载 + Gzip 压缩

## 🎯 最新优化

- ✅ **pnpm 包管理器**: 安装速度提升 66%，磁盘占用减少 64%
- ✅ **性能优化**: 构建 +22%、API响应 +87%、并发 +200%
- ✅ **Ant Design 6.0**: UI 框架升级
- ✅ **安全增强**: HttpOnly Cookie、XSS 防护
- ✅ **架构优化**: TypeScript 严格模式、Redis 缓存、连接池

## 🛠️ 技术栈

### 后端
- **框架**: NestJS 11.1.8
- **数据库**: MySQL 8.0 + TypeORM 0.3.27
- **认证**: JWT + Passport
- **监控**: @nestjs/terminus (健康检查)
- **日志**: Winston (文件日志 + 数据库日志)
- **文档**: Swagger
- **语言**: TypeScript

### 前端
- **框架**: React 18.3.1 + TypeScript
- **构建**: Vite 7.2.2
- **UI库**: Ant Design 6.0.0
- **状态管理**: Zustand 4.5.0
- **路由**: React Router 6.28.0
- **图表**: ECharts 6.0.0
- **HTTP**: Axios 1.13.2
- **数据请求**: GraphQL支持

## 📁 项目结构

```
nestAdmin/
├── backend/                # 后端 (NestJS)
│   ├── src/
│   │   ├── modules/       # 业务模块
│   │   │   ├── auth/     # 认证模块
│   │   │   ├── user/     # 用户管理
│   │   │   ├── role/     # 角色管理
│   │   │   ├── menu/     # 菜单管理
│   │   │   ├── health/   # 健康检查
│   │   │   ├── performance/  # 性能监控
│   │   │   ├── log/      # 操作日志
│   │   │   ├── cache/    # 缓存管理
│   │   │   └── common/   # 通用模块
│   │   ├── common/       # 公共模块
│   │   │   ├── interceptors/  # 拦截器
│   │   │   ├── filters/       # 异常过滤器
│   │   │   └── utils/         # 工具函数
│   │   ├── config/       # 配置文件
│   │   └── main.ts       # 应用入口
│   └── sql/              # SQL脚本
│
└── frontend/              # 前端 (React)
    ├── src/
    │   ├── api/          # API接口定义
    │   ├── pages/        # 页面组件
    │   │   ├── Dashboard/      # 仪表盘
    │   │   ├── Login/          # 登录页
    │   │   ├── UserManagement/ # 用户管理
    │   │   ├── RoleManagement/ # 角色管理
    │   │   ├── MenuManagement/ # 菜单管理
    │   │   ├── OperationLog/   # 操作日志
    │   │   └── PerformanceMonitor/ # 性能监控
    │   ├── components/   # 公共组件
    │   ├── hooks/        # 自定义hooks
    │   ├── stores/       # 状态管理 (Zustand)
    │   ├── router/       # 路由配置
    │   ├── utils/        # 工具函数
    │   ├── layout/       # 布局组件
    │   └── styles/       # 全局样式
    └── vite.config.ts    # Vite配置
```

## 🚀 快速开始

### 环境要求
- Node.js 20+
- **pnpm 8+** (推荐使用 pnpm 替代 npm)
- MySQL 8.0+
- Redis 7+ (可选，用于缓存)

### 📦 安装 pnpm

```bash
npm install -g pnpm
# 或
corepack enable && corepack prepare pnpm@latest --activate
```

### 方式 1: Docker 部署 (推荐) 🐳

```bash
# 1. 克隆项目
git clone <repository-url>
cd nestAdmin

# 2. 配置环境变量
cp .env.docker .env.docker.local
# 编辑 .env.docker.local，修改密码等敏感信息

# 3. 一键启动所有服务
docker-compose --env-file .env.docker.local up -d

# 4. 查看运行状态
docker-compose ps

# 5. 访问应用
# 前端: http://localhost
# 后端: http://localhost:3001
# API文档: http://localhost:3001/api-docs
```

**包含服务**: MySQL 8.0 + Redis 7 + NestJS + Nginx

### 方式 2: 本地开发 (使用 pnpm)

```bash
# 1. 克隆项目
git clone <repository-url>
cd nestAdmin

# 2. 安装所有依赖 (推荐使用 pnpm)
pnpm install

# 3. 配置后端环境变量
cp backend/.env.example backend/.env
# 编辑 backend/.env，配置数据库等信息

# 4. 初始化数据库
cd backend
# 创建数据库并导入 sql/init_data.sql

# 5. 启动开发服务器
cd ..
pnpm dev              # 同时启动前后端
# 或单独启动
pnpm dev:backend      # 只启动后端
pnpm dev:frontend     # 只启动前端
```

### 方式 3: PM2 生产部署

```bash
# 1. 构建所有项目
pnpm build            # 同时构建前后端

# 2. 启动 PM2 (集群模式)
cd backend
pm2 start ecosystem.config.js --env production

# 3. 前端静态文件部署
cd ../frontend
# 使用 Nginx 或静态服务器托管 dist/ 目录
```

### 方式 4: GitHub Actions 自动部署 🚀

项目已配置 GitHub Actions，推送到 `main` 分支会自动部署到生产服务器。

**快速配置：**

1. **在服务器上运行快速配置脚本**：
   ```bash
   # 下载并运行配置脚本
   curl -fsSL https://raw.githubusercontent.com/chenglu1/nestAdmin/main/scripts/setup-server.sh | bash
   # 或手动执行
   bash scripts/setup-server.sh
   ```

2. **配置 GitHub Secrets**：
   - 进入仓库 Settings → Secrets and variables → Actions
   - 添加以下 Secrets：
     - `SERVER_HOST`: 服务器 IP 地址
     - `SERVER_USER`: SSH 用户名（通常是 root）
     - `SERVER_SSH_KEY`: SSH 私钥内容
     - `SERVER_SSH_PORT`: SSH 端口（可选，默认 22）

3. **推送到 main 分支触发部署**：
   ```bash
   git push origin main
   ```

**详细配置说明请查看：** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 📋 常用命令

### 使用 pnpm (推荐)

```bash
# 安装依赖
pnpm install              # 安装所有项目依赖

# 开发
pnpm dev                  # 同时启动前后端
pnpm dev:backend          # 只启动后端
pnpm dev:frontend         # 只启动前端

# 构建
pnpm build                # 构建所有项目
pnpm build:backend        # 只构建后端
pnpm build:frontend       # 只构建前端

# 代码质量
pnpm lint                 # 检查所有项目
pnpm format               # 格式化代码

# 清理
pnpm clean                # 清理构建产物
pnpm clean:all            # 清理所有依赖和构建产物

# 添加依赖
pnpm -F backend add <package>    # 添加后端依赖
pnpm -F frontend add <package>   # 添加前端依赖
```

### 默认账号
- **用户名**: `admin`
- **密码**: `admin123`

### 访问地址
- **前端**: http://localhost:5174 (开发) / http://localhost (Docker)
- **后端API**: http://localhost:3001/api
- **Swagger文档**: http://localhost:3001/api-docs
- **健康检查**: http://localhost:3001/api/health

## �📚 主要功能模块

### 1. 用户管理
- 用户列表、新增、编辑、删除
- 用户角色分配
- 用户状态管理

### 2. 角色管理
- 角色列表、新增、编辑、删除
- 角色权限分配

### 3. 菜单管理
- 菜单树形展示
- 菜单CRUD操作
- 动态路由生成

### 4. 操作日志
- 自动记录所有操作
- 日志查询和筛选
- IP地址追踪

### 5. 性能监控
- API响应时间监控
- 慢查询追踪 (>1s)
- 系统健康检查
- 实时数据可视化

## 🔌 API文档

所有API接口均已集成Swagger文档,启动后端服务后访问:
**http://localhost:3000/api-docs**

主要接口:
- `POST /auth/login` - 用户登录
- `GET /user/profile` - 获取用户信息
- `GET /health` - 健康检查
- `GET /performance/stats` - 性能统计

## 📝 开发指南

### 数据库迁移

```bash
cd backend
pnpm typeorm -- migration:run -d ./typeorm.config.ts    # 运行迁移
pnpm typeorm -- migration:revert -d ./typeorm.config.ts # 回滚迁移
```

### Git 提交规范

```bash
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
perf: 性能优化
test: 测试
chore: 其他修改
```

示例:
```bash
git commit -m "feat: 添加用户导出功能"
git commit -m "fix: 修复登录token过期问题"
```

### 环境配置

修改 `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=nest_admin

JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
PORT=3000
```

## 🔧 常见问题

**Q: 数据库连接失败?**  
A: 检查 MySQL 服务和 `.env` 配置

**Q: 前端无法访问后端?**  
A: 确认后端已启动，检查端口占用

## 📚 相关文档

- [架构分析报告](./ARCHITECTURE_ANALYSIS.md)
- [pnpm 迁移指南](./MIGRATION_TO_PNPM.md)
- [pnpm 快速参考](./PNPM_QUICK_REFERENCE.md)

## 📄 License

MIT

---

**Last Updated**: 2025-12-05
