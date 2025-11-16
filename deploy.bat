@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ================================
echo NestAdmin 部署脚本
echo ================================
echo.

REM 检查 Docker 是否安装
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker 未安装，请先安装 Docker Desktop
    pause
    exit /b 1
)

REM 检查 Docker Compose 是否安装
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose 未安装
    pause
    exit /b 1
)

REM 检查 .env 文件
if not exist .env (
    echo ⚠️  .env 文件不存在，从 .env.example 复制...
    copy .env.example .env
    echo 请编辑 .env 文件并设置正确的配置
    pause
    exit /b 1
)

REM 停止旧容器
echo 🛑 停止旧容器...
docker-compose down

REM 询问是否清理旧镜像
set /p cleanup="是否清理旧的 Docker 镜像? (Y/N): "
if /i "%cleanup%"=="Y" (
    echo 🧹 清理旧镜像...
    docker system prune -af
)

REM 构建镜像
echo 🔨 构建 Docker 镜像...
docker-compose build --no-cache
if %errorlevel% neq 0 (
    echo ❌ 构建失败
    pause
    exit /b 1
)

REM 启动容器
echo 🚀 启动容器...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ❌ 启动失败
    pause
    exit /b 1
)

REM 等待服务启动
echo ⏳ 等待服务启动...
timeout /t 15 /nobreak >nul

REM 检查容器状态
echo.
echo 📊 检查容器状态:
docker-compose ps

REM 检查健康状态
echo.
echo 🏥 检查健康状态:
echo 后端: http://localhost:3000/health
echo 前端: http://localhost

echo.
echo ✅ 部署完成！
echo.
echo 按任意键查看日志 (Ctrl+C 退出)...
pause >nul

docker-compose logs -f
