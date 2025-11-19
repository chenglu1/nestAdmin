# 安装优化后的新依赖
Write-Host "正在安装缓存模块依赖..." -ForegroundColor Green

cd backend

Write-Host "安装 @nestjs/cache-manager 和 cache-manager..." -ForegroundColor Cyan
npm install @nestjs/cache-manager cache-manager

$enableRedis = Read-Host "是否需要 Redis 支持? (y/n)"
if ($enableRedis -eq 'y' -or $enableRedis -eq 'Y') {
    Write-Host "安装 Redis 依赖..." -ForegroundColor Cyan
    npm install cache-manager-redis-store
    Write-Host "提示: 请在 .env 文件中设置 ENABLE_REDIS=true" -ForegroundColor Yellow
}

Write-Host "依赖安装完成!" -ForegroundColor Green
Write-Host "运行 'npm run start:dev' 启动后端服务" -ForegroundColor Cyan
