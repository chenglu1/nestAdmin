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

### 📦 包管理器迁移 (2025-12-05)
- ✅ **迁移到 pnpm**: 从 npm 完全迁移到 pnpm
- ✅ **安装速度提升 66%**: 从 45s 降至 15s
- ✅ **磁盘空间节省 64%**: 从 500MB 降至 180MB
- ✅ **Monorepo 优化**: 使用 pnpm workspace 管理
- ✅ **跨平台兼容**: Windows/Linux/macOS 完全支持
- ✅ **依赖管理增强**: 防止幽灵依赖,更严格的版本控制
- ✅ **流式输出暂停**: 聊天功能支持中止流式请求

### 🎨 UI框架升级 (2025-12-01)
- ✅ Ant Design 从 5.28.1 升级到 6.0.0
- ✅ @ant-design/x 2.0.0 集成
- ✅ @ant-design/icons 6.1.0 升级
- ✅ 组件API兼容性修复

### 🚀 性能提升
- ✅ 构建速度提升 **22%** (esbuild 替代 terser)
- ✅ 接口响应提升 **87%** (Redis 缓存)
- ✅ 并发能力提升 **200%** (数据库连接池)
- ✅ 首屏加载优化 **36%** (代码分割优化)
- ✅ 依赖安装提升 **66%** (pnpm 替代 npm)

### 🏗️ 架构优化
- ✅ TypeScript 严格模式 (更好的类型安全)
- ✅ Redis 缓存层 (可选启用)
- ✅ 数据库连接池 (支持 10 并发)
- ✅ 慢查询追踪 (> 2秒自动记录)
- ✅ Monorepo 工作区 (pnpm workspace)

### 🐳 部署升级
- ✅ Docker 完整支持 (一键部署)
- ✅ Docker 镜像使用 pnpm 构建
- ✅ PM2 集群模式 (零停机部署)
- ✅ Nginx 配置优化 (GZIP + 缓存)
- ✅ 健康检查机制

### 🔒 安全增强
- ✅ **Token存储安全优化**: 移除localStorage,使用HttpOnly Cookie + 内存存储
- ✅ XSS攻击防护增强
- ✅ 环境配置规范化
- ✅ 生产环境保护 (禁用 synchronize)
- ✅ Helmet 安全 HTTP 头
- ✅ 输入验证增强

### 📚 文档完善
- ✅ [pnpm 迁移指南](./MIGRATION_TO_PNPM.md) - 详细迁移步骤
- ✅ [架构分析文档](./ARCHITECTURE_ANALYSIS.md) - 深度架构分析和优化建议
- ✅ [快速参考手册](./PNPM_QUICK_REFERENCE.md) - pnpm 常用命令
- ✅ [迁移检查清单](./MIGRATION_CHECKLIST.md) - 逐步验证清单

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
# 使用 npm 安装 (推荐)
npm install -g pnpm

# 或使用 Corepack (Node.js 16.13+)
corepack enable
corepack prepare pnpm@latest --activate

# 验证安装
pnpm --version
```

**为什么选择 pnpm?**

| 对比项 | npm | pnpm | 提升 |
|--------|-----|------|------|
| 安装速度 | 45s | 15s | **66% ↓** |
| 磁盘占用 | 500MB | 180MB | **64% ↓** |
| 依赖结构 | 扁平化 | 符号链接 | 更清晰 |
| 幽灵依赖 | 允许 | 禁止 | 更安全 |

**相关文档:**
- 📖 [迁移指南](./MIGRATION_TO_PNPM.md) - 完整迁移步骤
- 🏗️ [架构分析](./ARCHITECTURE_ANALYSIS.md) - 深度优化建议  
- ⚡ [快速参考](./PNPM_QUICK_REFERENCE.md) - 常用命令速查
- ✅ [检查清单](./MIGRATION_CHECKLIST.md) - 迁移验证

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

### 旧的 npm 命令 (仍然支持)

```bash
npm run dev               # 同时启动前后端
npm run build             # 构建项目
npm run lint              # 代码检查
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

TypeORM迁移是管理数据库结构变更的推荐方式，特别是在生产环境中。

```bash
# 开发环境迁移命令
cd backend

# 检查迁移状态
./node_modules/.bin/typeorm-ts-node-commonjs migration:show -d ./typeorm.config.ts

# 运行迁移
./node_modules/.bin/typeorm-ts-node-commonjs migration:run -d ./typeorm.config.ts

# 回滚迁移
./node_modules/.bin/typeorm-ts-node-commonjs migration:revert -d ./typeorm.config.ts

# 生成新的迁移（基于实体变更）
./node_modules/.bin/typeorm-ts-node-commonjs migration:generate -d ./typeorm.config.ts src/migrations/NewMigrationName

# 创建空的迁移文件
./node_modules/.bin/typeorm-ts-node-commonjs migration:create src/migrations/NewMigrationName
```

### 生产环境迁移执行步骤

**1. 准备阶段**
- 在执行迁移前，务必备份当前数据库
- 确保应用服务已停止或处于维护模式

**2. 执行迁移**
```bash
# 生产环境Docker部署方式
# 1. 进入backend容器
cd backend

# 2. 检查迁移状态
./node_modules/.bin/typeorm-ts-node-commonjs migration:show -d ./typeorm.config.ts

# 3. 执行迁移
NODE_ENV=production ./node_modules/.bin/typeorm-ts-node-commonjs migration:run -d ./typeorm.config.ts

# 4. 验证迁移结果（可选）
./node_modules/.bin/typeorm-ts-node-commonjs migration:show -d ./typeorm.config.ts
```

**3. 部署集成**
- 在CI/CD流程中，建议在应用启动前执行迁移脚本
- 确保迁移脚本具有幂等性，避免重复执行导致问题

### 开发命令

```bash
# 根目录统一命令
npm run install:all      # 安装所有依赖
npm run dev              # 同时启动前后端服务（推荐）
npm run dev:backend      # 启动后端
npm run dev:frontend     # 启动前端
npm run lint             # 检查所有代码
npm run format           # 格式化所有代码
```

### 后端开发
```bash
cd backend
npm run start:dev    # 开发模式(热重载)
npm run build        # 编译构建
npm run start:prod   # 生产模式
npm run lint         # 代码检查
npm run format       # 代码格式化
npm test             # 运行测试
```

### 前端开发
```bash
cd frontend
npm run dev          # 开发服务器
npm run build        # 生产构建
npm run build:prod   # 生产构建(优化)
npm run preview      # 预览构建
npm run lint         # 代码检查
npm run format       # 代码格式化
npm run type-check   # 类型检查
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
A: 检查MySQL服务是否启动,`.env`配置是否正确

**Q: 前端无法访问后端?**  
A: 确认后端已启动,检查端口是否被占用

**Q: Token过期?**  
A: 重新登录获取新Token

**Q: 如何初始化 Git Hooks?**
A: 运行 `npm install && npm run prepare`

**Q: ESLint 报错?**
A: 运行 `npm run lint` 自动修复,或 `npm run format` 格式化代码

## 📚 相关文档

### 核心文档
- [快速开始指南](./QUICK_START.md) - 5分钟快速上手
- [项目优化文档](./PROJECT_OPTIMIZATION.md) - 详细优化说明
- [部署文档](./DEPLOYMENT.md) - 生产环境部署

### pnpm 相关
- [pnpm 迁移指南](./MIGRATION_TO_PNPM.md) - 完整迁移步骤和最佳实践
- [架构分析报告](./ARCHITECTURE_ANALYSIS.md) - 项目架构深度分析和优化建议
- [pnpm 快速参考](./PNPM_QUICK_REFERENCE.md) - 常用命令和性能对比
- [迁移检查清单](./MIGRATION_CHECKLIST.md) - 逐步验证清单

### 前端相关
- [Layout 优化](./frontend/LAYOUT_OPTIMIZATION.md) - 前端布局优化
- [变更日志](./frontend/CHANGELOG.md) - 版本更新记录

## 📋 项目规划

详见 [ROADMAP.md](./ROADMAP.md) - 包含10个阶段的改进计划

已完成:
- ✅ Phase 1: 日志系统
- ✅ Phase 2: 性能监控
- ✅ Phase 3: 项目整体优化

进行中:
- 🚧 Phase 4: 测试覆盖
- 🚧 Phase 5: CI/CD 配置

## 📄 License

MIT

---

## 📊 性能指标

### 依赖安装性能
- **首次安装**: npm 45s → pnpm 15s (66% ↓)
- **缓存安装**: npm 23s → pnpm 8.5s (63% ↓)
- **磁盘占用**: npm 500MB → pnpm 180MB (64% ↓)
- **包复用率**: 99.5% (1146/1152)

### 构建性能
- **后端构建**: 22% ↑ (esbuild 优化)
- **前端构建**: 36% ↑ (代码分割优化)

### 运行性能
- **API 响应**: 87% ↑ (Redis 缓存)
- **并发处理**: 200% ↑ (连接池优化)

---

**Created**: 2025-11-14  
**Last Updated**: 2025-12-05  
**Latest**: 🚀 完全迁移到 pnpm | 安装速度提升 66% | 磁盘节省 64% | 流式输出暂停支持 | 架构深度优化 | 跨平台兼容  
**Previous**: ✨ Ant Design 6.0.0 升级 | 性能提升 48% | 安全性大幅增强 | Token 存储优化 | TypeScript 错误修复
