#!/bin/bash

# ==========================================
# 检查生产环境服务状态
# ==========================================

echo "========================================="
echo "🔍 检查生产环境服务状态"
echo "========================================="

# 检查 PM2 服务状态
echo ""
echo "📊 PM2 服务状态:"
if command -v pm2 &> /dev/null; then
    pm2 list | grep -E "nestAdmin|NAME|┌|│"
    echo ""
    echo "📝 最近的服务日志:"
    pm2 logs nestAdmin-backend --lines 10 --nostream 2>/dev/null || echo "无法获取日志"
else
    echo "❌ PM2 未安装"
fi

# 检查服务是否在运行
echo ""
echo "🌐 端口监听状态:"
if command -v netstat &> /dev/null; then
    netstat -tlnp | grep -E "3001|LISTEN" || echo "未找到监听端口"
elif command -v ss &> /dev/null; then
    ss -tlnp | grep -E "3001|LISTEN" || echo "未找到监听端口"
else
    echo "无法检查端口状态（需要安装 netstat 或 ss）"
fi

# 检查代码版本
echo ""
echo "📦 代码版本:"
PROJECT_ROOT="/www/wwwroot/nestAdmin"
if [ -d "$PROJECT_ROOT" ]; then
    cd "$PROJECT_ROOT"
    if [ -d ".git" ]; then
        echo "最新提交: $(git log -1 --oneline 2>/dev/null || echo '无法获取')"
        echo "提交时间: $(git log -1 --format='%cd' 2>/dev/null || echo '无法获取')"
    else
        echo "⚠️  项目目录不是 Git 仓库"
    fi
    
    # 检查编译后的代码时间戳
    if [ -f "backend/dist/src/modules/auth/auth.controller.js" ]; then
        echo "编译时间: $(stat -c %y backend/dist/src/modules/auth/auth.controller.js 2>/dev/null || stat -f '%Sm' backend/dist/src/modules/auth/auth.controller.js 2>/dev/null || echo '无法获取')"
    fi
else
    echo "❌ 项目目录不存在: $PROJECT_ROOT"
fi

echo ""
echo "========================================="
echo "✅ 检查完成"
echo "========================================="

