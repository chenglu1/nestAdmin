@echo off
chcp 65001 >nul
REM Railway 一键部署脚本(Windows)
REM 使用前请先安装 Railway CLI: npm i -g @railway/cli

echo 🚀 开始部署到 Railway...
echo.

REM 检查 Railway CLI 是否安装
where railway >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Railway CLI 未安装
    echo 请运行: npm install -g @railway/cli
    pause
    exit /b 1
)

REM 登录 Railway
echo 📝 登录 Railway...
call railway login
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 登录失败
    pause
    exit /b 1
)

REM 创建新项目
echo.
echo 🔨 初始化项目...
call railway init
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 项目初始化失败
    pause
    exit /b 1
)

REM 添加 MySQL
echo.
echo 🗄️  添加 MySQL 数据库...
call railway add --plugin mysql
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  MySQL 添加失败,请在 Railway 控制台手动添加
)

REM 添加 Redis
echo.
echo 💾 添加 Redis...
call railway add --plugin redis
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Redis 添加失败,请在 Railway 控制台手动添加
)

REM 设置环境变量
echo.
echo ⚙️  配置环境变量...
call railway variables set NODE_ENV=production
call railway variables set PORT=3000
call railway variables set JWT_EXPIRES_IN=7d

echo.
echo ⚠️  注意: 请在 Railway 控制台设置以下环境变量:
echo   - DATABASE_HOST
echo   - DATABASE_PORT
echo   - DATABASE_USER
echo   - DATABASE_PASSWORD
echo   - DATABASE_NAME
echo   - JWT_SECRET
echo   - REDIS_HOST
echo   - REDIS_PORT
echo.

REM 部署
echo 📦 开始部署...
call railway up
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 部署失败
    pause
    exit /b 1
)

echo.
echo ✅ 部署完成!
echo.
echo 查看项目:
call railway open
echo.
echo 查看日志:
echo   railway logs
echo.
pause
