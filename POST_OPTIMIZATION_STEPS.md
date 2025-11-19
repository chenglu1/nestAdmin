# 🔧 优化后需要执行的操作

## ⚠️ 重要: 安装新增依赖

优化过程中添加了缓存模块，需要安装新的依赖包。

### 1️⃣ 安装缓存依赖

```bash
cd backend
npm install @nestjs/cache-manager cache-manager
```

### 2️⃣ 可选: 安装 Redis 支持

如果要启用 Redis 缓存，需要额外安装:

```bash
npm install cache-manager-redis-store
```

然后在 `.env` 文件中设置:
```bash
ENABLE_REDIS=true
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3️⃣ 如果不想使用缓存

如果暂时不需要缓存功能，可以从 `app.module.ts` 中移除 CacheModule:

**编辑**: `backend/src/app.module.ts`

```typescript
// 注释掉这两行
// import { CacheModule } from './modules/cache/cache.module';
// CacheModule,  // 从 imports 数组中移除
```

## 📋 其他检查项

### TypeScript 严格模式迁移

启用严格模式后，可能会出现一些类型错误。运行以下命令检查:

```bash
cd backend
npm run build
```

如果有错误，请根据错误提示逐步修复。常见修复方法见 `OPTIMIZATION_REPORT.md`。

### 环境变量更新

确保 `.env` 文件包含所有新增的配置项:

```bash
# 检查是否有以下新增配置
NODE_ENV=development
ENABLE_REDIS=false
LOG_LEVEL=info
MAX_REQUEST_SIZE=10485760
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

可以参考 `backend/.env.example` 文件。

## 🚀 启动项目

### 开发环境

```bash
# 后端
cd backend
npm run start:dev

# 前端
cd frontend
npm run dev
```

### Docker 环境

```bash
# 安装依赖后重新构建
docker-compose build
docker-compose up -d
```

## ❓ 常见问题

### Q: 缓存模块报错怎么办？
A: 安装依赖或临时禁用缓存模块（见上文第3步）

### Q: TypeScript 编译错误？
A: 这是预期的，严格模式会暴露潜在问题。逐步修复或临时关闭部分检查。

### Q: Docker 构建失败？
A: 确保在构建前已安装依赖，或使用 `npm ci` 确保依赖一致性。

---

✅ 完成以上步骤后，项目优化就全部生效了！

详细优化内容请查看: [OPTIMIZATION_REPORT.md](./OPTIMIZATION_REPORT.md)
