#!/bin/bash

echo "================================"
echo "NestAdmin 开发环境启动"
echo "================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    exit 1
fi

# 启动后端
echo "🚀 启动后端服务..."
cd backend && npm run start:dev &
BACKEND_PID=$!

# 等待2秒
sleep 2

# 启动前端
echo "🚀 启动前端服务..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ 服务启动中..."
echo ""
echo "后端: http://localhost:3000"
echo "前端: http://localhost:5174"
echo "Swagger: http://localhost:3000/api-docs"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 捕获 Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT

# 等待进程结束
wait
