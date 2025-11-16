@echo off
chcp 65001 >nul
echo ================================
echo NestAdmin 开发环境启动
echo ================================
echo.

REM 检查 Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安装
    pause
    exit /b 1
)

REM 启动后端
start "Backend Server" cmd /k "cd backend && npm run start:dev"

REM 等待2秒
timeout /t 2 /nobreak >nul

REM 启动前端
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ 服务启动中...
echo.
echo 后端: http://localhost:3000
echo 前端: http://localhost:5174
echo Swagger: http://localhost:3000/api-docs
echo.
pause
