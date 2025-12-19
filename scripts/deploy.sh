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
PROJECT_ROOT="/www/wwwroot/nestAdmin"  # 项目根目录（宝塔默认路径）
BACKEND_DIR="${PROJECT_ROOT}/backend"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"
LOG_FILE="${PROJECT_ROOT}/logs/deploy.log"
BRANCH="main"  # 监听的分支
DEPLOY_MODE="${DEPLOY_MODE:-pm2}"  # 部署模式: pm2 或 docker

# 创建日志目录
mkdir -p "$(dirname "$LOG_FILE")"

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

# 函数: 检查 pnpm
check_pnpm() {
    if ! command -v pnpm &> /dev/null; then
        log "📦 pnpm 未安装，正在安装..."
        npm install -g pnpm || {
            # 如果 npm 安装失败，尝试使用 corepack
            corepack enable || error "无法启用 corepack"
            corepack prepare pnpm@latest --activate || error "无法安装 pnpm"
        }
        log "✅ pnpm 安装成功"
    else
        log "✅ pnpm 已安装: $(pnpm --version)"
    fi
}

# 函数: 更新后端依赖
update_backend_deps() {
    log "📦 更新后端依赖..."
    cd "$BACKEND_DIR"
    
    check_pnpm
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
    
    check_pnpm
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
restart_services_pm2() {
    log "🔄 使用 PM2 重启应用服务..."
    
    # 检查 PM2 是否安装
    if ! command -v pm2 &> /dev/null; then
        log "📦 PM2 未安装，正在安装..."
        npm install -g pm2 || error "PM2 安装失败"
    fi
    
    # 重启后端
    cd "$BACKEND_DIR"
    
    # 检查 PM2 应用是否存在
    if pm2 list | grep -q "nestAdmin-backend"; then
        pm2 restart nestAdmin-backend || error "PM2 重启失败"
    else
        # 如果不存在，使用 ecosystem.config.js 启动
        if [ -f "ecosystem.config.js" ]; then
            pm2 start ecosystem.config.js --env production || error "PM2 启动失败"
        else
            pm2 start dist/src/main.js --name nestAdmin-backend -i max || error "PM2 启动失败"
        fi
    fi
    
    # 保存 PM2 配置
    pm2 save || warn "PM2 配置保存失败"
    
    log "✅ PM2 应用重启成功"
}

# 函数: 重启服务（使用 Docker）
restart_services_docker() {
    log "🔄 使用 Docker 重启应用服务..."
    
    cd "$PROJECT_ROOT"
    
    # 检查 docker-compose 是否安装
    if ! command -v docker-compose &> /dev/null; then
        error "docker-compose 未安装，请先在宝塔面板中安装 Docker"
    fi
    
    # 检查 .env 文件是否存在
    if [ ! -f ".env.docker.local" ] && [ ! -f ".env.docker" ]; then
        warn ".env.docker.local 或 .env.docker 文件不存在，使用默认配置"
    fi
    
    # 停止现有容器
    log "停止现有容器..."
    docker-compose --env-file .env.docker.local down 2>/dev/null || docker-compose down 2>/dev/null || true
    
    # 重新构建并启动
    log "构建并启动容器..."
    docker-compose --env-file .env.docker.local up -d --build || docker-compose up -d --build || error "Docker 容器启动失败"
    
    log "✅ Docker 容器重启成功"
}

# 函数: 重启服务（根据部署模式选择）
restart_services() {
    if [ "$DEPLOY_MODE" = "docker" ]; then
        restart_services_docker
    else
        restart_services_pm2
    fi
}

# 函数: 监控健康检查
health_check() {
    log "🏥 执行健康检查..."
    
    local max_retries=10
    local retry_count=0
    local health_url="http://localhost:3001/api/health"
    
    # 如果是 Docker 模式，可能需要等待更长时间
    if [ "$DEPLOY_MODE" = "docker" ]; then
        log "等待 Docker 容器启动..."
        sleep 15
    fi
    
    while [ $retry_count -lt $max_retries ]; do
        if curl -s -f "$health_url" > /dev/null 2>&1; then
            log "✅ 健康检查通过"
            return 0
        fi
        
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $max_retries ]; then
            warn "健康检查失败，${retry_count}/${max_retries}，5秒后重试..."
            sleep 5
        fi
    done
    
    warn "❌ 健康检查失败，但部署流程继续（请手动检查服务状态）"
    return 1
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
    log "部署模式: $DEPLOY_MODE"
    log "=========================================="
    
    # 检查项目目录是否存在
    [ -d "$PROJECT_ROOT" ] || error "项目目录不存在: $PROJECT_ROOT"
    
    # 如果设置了 SKIP_GIT_PULL（GitHub Actions 已经拉取了代码），则跳过拉取
    # 否则执行代码拉取
    if [ -n "$SKIP_GIT_PULL" ]; then
        log "⏭️  跳过代码拉取（已在 GitHub Actions 中完成）"
    else
        pull_code
    fi
    
    # Docker 模式直接重启容器（代码已在容器内构建）
    if [ "$DEPLOY_MODE" = "docker" ]; then
        restart_services
        health_check
    else
        # PM2 模式需要构建代码
        update_backend_deps
        build_backend
        update_frontend_deps
        build_frontend
        restart_services
        health_check
    fi
    
    log "=========================================="
    log "✅ 部署完成！"
    log "=========================================="
    
    send_notification "成功" "NestAdmin 部署完成"
}

# 错误处理
trap 'error "部署过程中发生错误"; send_notification "失败" "NestAdmin 部署失败"' ERR

# 执行主流程
main "$@"
