#!/bin/bash

# Railway 一键部署脚本
# 使用前请先安装 Railway CLI: npm i -g @railway/cli

set -e

echo "🚀 开始部署到 Railway..."

# 检查 Railway CLI 是否安装
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI 未安装"
    echo "请运行: npm install -g @railway/cli"
    exit 1
fi

# 登录 Railway
echo "📝 登录 Railway..."
railway login

# 创建新项目(如果不存在)
echo "🔨 初始化项目..."
railway init

# 链接到 GitHub 仓库(可选)
echo "🔗 链接 GitHub 仓库..."
railway link

# 添加 MySQL 插件
echo "🗄️  添加 MySQL 数据库..."
railway add mysql

# 添加 Redis 插件
echo "💾 添加 Redis..."
railway add redis

# 设置环境变量
echo "⚙️  配置环境变量..."
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set JWT_EXPIRES_IN=7d

# 部署后端
echo "📦 部署后端服务..."
cd backend
railway up

# 部署前端
echo "🎨 部署前端服务..."
cd ../frontend
railway up

# 获取部署 URL
echo "✅ 部署完成!"
echo ""
echo "访问地址:"
railway domain

echo ""
echo "查看日志:"
echo "  railway logs"
echo ""
echo "打开仪表板:"
echo "  railway open"
