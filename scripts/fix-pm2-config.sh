#!/bin/bash

# ==========================================
# 修复 PM2 配置脚本
# 用于检查和修复生产环境的 PM2 配置
# ==========================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="/www/wwwroot/nestAdmin"
BACKEND_DIR="${PROJECT_ROOT}/backend"

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🔧 PM2 配置检查和修复工具${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查 PM2 是否安装
if ! command -v pm2 &> /dev/null; then
    error "PM2 未安装，请先安装 PM2"
    exit 1
fi

# 检查项目目录
if [ ! -d "$BACKEND_DIR" ]; then
    error "后端目录不存在: $BACKEND_DIR"
    exit 1
fi

cd "$BACKEND_DIR"

# 检查构建文件是否存在
if [ ! -f "dist/src/main.js" ]; then
    error "构建文件不存在: dist/src/main.js"
    info "请先执行构建: cd $BACKEND_DIR && pnpm build"
    exit 1
fi

log "✅ 构建文件存在: dist/src/main.js"

# 显示当前 PM2 进程
echo ""
info "当前 PM2 进程列表:"
pm2 list

# 检查是否有错误的进程
echo ""
info "检查 PM2 进程配置..."

# 获取所有进程的详细信息
pm2 jlist | jq -r '.[] | select(.name | contains("nestAdmin") or contains("main")) | "\(.name): \(.pm2_env.script)"' 2>/dev/null || {
    # 如果没有 jq，使用 pm2 describe
    pm2 list | grep -E "nestAdmin|main" || true
}

# 停止所有相关进程
echo ""
warn "将停止所有 nestAdmin 相关进程并重新配置..."
read -p "是否继续？(y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "已取消操作"
    exit 0
fi

# 停止所有相关进程
log "停止所有 nestAdmin 相关进程..."
pm2 delete nestAdmin-backend 2>/dev/null || true
pm2 delete main 2>/dev/null || true

# 等待进程完全停止
sleep 2

# 检查 ecosystem.config.js
if [ -f "ecosystem.config.js" ]; then
    log "使用 ecosystem.config.js 启动服务..."
    pm2 start ecosystem.config.js --env production
else
    warn "ecosystem.config.js 不存在，使用直接命令启动..."
    pm2 start dist/src/main.js --name nestAdmin-backend -i max
fi

# 保存 PM2 配置
pm2 save

# 显示启动后的状态
echo ""
log "✅ PM2 服务已重新配置"
echo ""
info "当前 PM2 进程状态:"
pm2 list

echo ""
info "查看服务日志（最近20行）:"
pm2 logs nestAdmin-backend --lines 20 --nostream

echo ""
log "========================================="
log "✅ 修复完成！"
log "========================================="

