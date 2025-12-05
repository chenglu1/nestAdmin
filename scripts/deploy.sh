#!/bin/bash

# ==========================================
# NestAdmin 自动部署脚本
# 功能: 监听 Git 推送，自动更新、编译、重启应用
# ==========================================

set -e  # 任何命令失败立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
PROJECT_ROOT="/home/nestadmin"  # 项目根目录
BACKEND_DIR="${PROJECT_ROOT}/backend"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"
LOG_FILE="/var/log/nestadmin-deploy.log"
BRANCH="main"  # 监听的分支

# 函数: 日志输出
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

# 函数: 拉取最新代码
pull_code() {
    log "📥 开始拉取最新代码..."
    cd "$PROJECT_ROOT"
    
    git fetch origin || error "Git fetch 失败"
    git checkout "$BRANCH" || error "Git checkout 失败"
    git pull origin "$BRANCH" || error "Git pull 失败"
    
    log "✅ 代码拉取成功"
}

# 函数: 更新后端依赖
update_backend_deps() {
    log "📦 更新后端依赖..."
    cd "$BACKEND_DIR"
    
    pnpm install --prod || error "后端依赖安装失败"
    
    log "✅ 后端依赖更新成功"
}

# 函数: 编译后端
build_backend() {
    log "🔨 编译后端代码..."
    cd "$BACKEND_DIR"
    
    pnpm build || error "后端编译失败"
    
    log "✅ 后端编译成功"
}

# 函数: 更新前端依赖
update_frontend_deps() {
    log "📦 更新前端依赖..."
    cd "$FRONTEND_DIR"
    
    pnpm install --prod || error "前端依赖安装失败"
    
    log "✅ 前端依赖更新成功"
}

# 函数: 编译前端
build_frontend() {
    log "🔨 编译前端代码..."
    cd "$FRONTEND_DIR"
    
    pnpm build || error "前端编译失败"
    
    log "✅ 前端编译成功"
}

# 函数: 重启服务（使用 PM2）
restart_services() {
    log "🔄 重启应用服务..."
    
    # 重启后端
    cd "$BACKEND_DIR"
    pm2 restart nestAdmin || pm2 start dist/main.js --name nestAdmin
    
    log "✅ 应用重启成功"
}

# 函数: 监控健康检查
health_check() {
    log "🏥 执行健康检查..."
    
    local max_retries=5
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        if curl -s http://localhost:3001/api/health > /dev/null; then
            log "✅ 健康检查通过"
            return 0
        fi
        
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $max_retries ]; then
            warn "健康检查失败，${retry_count}/${max_retries}，5秒后重试..."
            sleep 5
        fi
    done
    
    error "❌ 健康检查失败，应用启动异常"
}

# 函数: 发送通知
send_notification() {
    local status=$1
    local message=$2
    
    # 可集成钉钉、企业微信、Slack 等
    log "📢 部署状态: $status - $message"
    
    # 示例: 发送钉钉通知
    # curl -X POST https://oapi.dingtalk.com/robot/send \
    #   -H 'Content-Type: application/json' \
    #   -d '{"msgtype":"text","text":{"content":"'"$message"'"}}'
}

# 主流程
main() {
    log "=========================================="
    log "🚀 NestAdmin 自动部署流程开始"
    log "=========================================="
    
    # 检查项目目录是否存在
    [ -d "$PROJECT_ROOT" ] || error "项目目录不存在: $PROJECT_ROOT"
    
    # 执行部署步骤
    pull_code
    update_backend_deps
    build_backend
    update_frontend_deps
    build_frontend
    restart_services
    health_check
    
    log "=========================================="
    log "✅ 部署完成！"
    log "=========================================="
    
    send_notification "成功" "NestAdmin 部署完成"
}

# 错误处理
trap 'error "部署过程中发生错误"; send_notification "失败" "NestAdmin 部署失败"' ERR

# 执行主流程
main "$@"
