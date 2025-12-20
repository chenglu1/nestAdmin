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

# 优化：配置 pnpm 全局缓存目录（加速依赖安装）
export PNPM_HOME="${PNPM_HOME:-/root/.local/share/pnpm}"
export PNPM_STORE_DIR="${PNPM_STORE_DIR:-/root/.pnpm-store}"
mkdir -p "$PNPM_STORE_DIR"

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

# 函数: 清理临时文件和缓存（在部署前执行）
cleanup_before_deploy() {
    log "🧹 清理临时文件和缓存..."
    
    # 清理 TypeScript 构建信息
    find "$PROJECT_ROOT" -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true
    
    # 清理旧的日志文件（保留最近3天）
    if [ -d "${PROJECT_ROOT}/logs" ]; then
        find "${PROJECT_ROOT}/logs" -name "*.log" -type f -mtime +3 -delete 2>/dev/null || true
    fi
    
    # 清理 PM2 日志（如果日志文件太大）
    if command -v pm2 &> /dev/null; then
        # 只清理，不删除所有日志
        pm2 flush 2>/dev/null || true
    fi
    
    log "✅ 临时文件清理完成"
}

# 函数: 拉取最新代码
pull_code() {
    log "📥 开始拉取最新代码..."
    cd "$PROJECT_ROOT"
    
    # 检查是否是 git 仓库
    if [ ! -d ".git" ]; then
        warn "项目目录不是 git 仓库，跳过代码拉取"
        return 0
    fi
    
    git fetch origin || error "Git fetch 失败"
    git checkout "$BRANCH" || error "Git checkout 失败"
    git pull origin "$BRANCH" || error "Git pull 失败"
    
    log "✅ 代码拉取成功"
}

# 函数: 检查 pnpm
check_pnpm() {
    # 重新加载 PATH（确保能找到新安装的命令）
    export PATH="$PATH:/usr/local/bin:/usr/bin"
    
    if ! command -v pnpm &> /dev/null; then
        log "📦 pnpm 未安装，正在安装..."
        
        # 优先使用 corepack（Node.js 16+ 自带）
        if command -v corepack &> /dev/null; then
            log "使用 corepack 安装 pnpm..."
            corepack enable || warn "corepack enable 失败，尝试其他方法"
            corepack prepare pnpm@latest --activate || {
                log "corepack 安装失败，使用 npm 安装..."
                npm install -g pnpm || error "pnpm 安装失败"
            }
        else
            # 使用 npm 安装
            npm install -g pnpm || error "pnpm 安装失败"
        fi
        
        # 重新加载 PATH
        export PATH="$PATH:$(npm config get prefix)/bin"
        
        # 验证安装
        if command -v pnpm &> /dev/null; then
            log "✅ pnpm 安装成功: $(pnpm --version)"
        else
            # 尝试使用完整路径
            PNPM_PATH=$(npm config get prefix)/bin/pnpm
            if [ -f "$PNPM_PATH" ]; then
                log "✅ pnpm 已安装，使用路径: $PNPM_PATH"
                alias pnpm="$PNPM_PATH"
            else
                error "pnpm 安装后仍无法找到命令"
            fi
        fi
    else
        log "✅ pnpm 已安装: $(pnpm --version)"
    fi
}

# 函数: 更新后端依赖（构建时需要开发依赖）
update_backend_deps() {
    log "📦 更新后端依赖（包括开发依赖，用于构建）..."
    cd "$BACKEND_DIR"
    
    check_pnpm
    
    # 确保能找到 pnpm 命令
    if ! command -v pnpm &> /dev/null; then
        # 尝试使用 npm 的全局 bin 路径
        export PATH="$PATH:$(npm config get prefix)/bin"
    fi
    
    # 设置环境变量
    export CI=true
    export HUSKY=0  # 禁用 husky（生产环境不需要 git hooks）
    
    # 配置 pnpm 使用缓存（加速安装）
    export PNPM_STORE_DIR="${PNPM_STORE_DIR:-~/.pnpm-store}"
    mkdir -p "$PNPM_STORE_DIR"
    
    # 构建时需要开发依赖（如 @nestjs/cli），所以安装所有依赖
    # 使用 --frozen-lockfile 加速（如果 lockfile 没变，跳过解析）
    # 使用 --ignore-scripts 跳过 prepare 等脚本（更安全）
    # 使用 --prefer-offline 优先使用缓存
    pnpm install --frozen-lockfile --prefer-offline --ignore-scripts || {
        # 如果 frozen-lockfile 失败（lockfile 有变化），使用普通安装
        log "⚠️  Lockfile 有变化，执行完整安装..."
        pnpm install --prefer-offline --ignore-scripts || error "后端依赖安装失败"
    }
    
    log "✅ 后端依赖更新成功"
}

# 函数: 编译后端
build_backend() {
    log "🔨 编译后端代码..."
    cd "$BACKEND_DIR"
    
    # 设置 CI 环境变量
    export CI=true
    
    pnpm build || error "后端编译失败"
    
    log "✅ 后端编译成功"
}

# 函数: 更新前端依赖（构建时需要开发依赖）
update_frontend_deps() {
    log "📦 更新前端依赖（包括开发依赖，用于构建）..."
    cd "$FRONTEND_DIR"
    
    check_pnpm
    
    # 确保能找到 pnpm 命令
    if ! command -v pnpm &> /dev/null; then
        # 尝试使用 npm 的全局 bin 路径
        export PATH="$PATH:$(npm config get prefix)/bin"
    fi
    
    # 设置环境变量
    export CI=true
    export HUSKY=0  # 禁用 husky（生产环境不需要 git hooks）
    
    # 配置 pnpm 使用缓存（加速安装）
    export PNPM_STORE_DIR="${PNPM_STORE_DIR:-~/.pnpm-store}"
    mkdir -p "$PNPM_STORE_DIR"
    
    # 构建时需要开发依赖（如 vite），所以安装所有依赖
    # 使用 --frozen-lockfile 加速（如果 lockfile 没变，跳过解析）
    # 使用 --ignore-scripts 跳过 prepare 等脚本（更安全）
    # 使用 --prefer-offline 优先使用缓存
    pnpm install --frozen-lockfile --prefer-offline --ignore-scripts || {
        # 如果 frozen-lockfile 失败（lockfile 有变化），使用普通安装
        log "⚠️  Lockfile 有变化，执行完整安装..."
        pnpm install --prefer-offline --ignore-scripts || error "前端依赖安装失败"
    }
    
    log "✅ 前端依赖更新成功"
}

# 函数: 编译前端
build_frontend() {
    log "🔨 编译前端代码..."
    cd "$FRONTEND_DIR"
    
    # 设置 CI 环境变量
    export CI=true
    
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
    
    # 设置 CI 环境变量（避免 pnpm 在非交互式环境中报错）
    export CI=true
    # 禁用 husky（生产环境不需要 git hooks）
    export HUSKY=0
    
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
        # 优化：并行安装依赖（如果可能）
        log "📦 开始安装依赖..."
        update_backend_deps &
        BACKEND_DEPS_PID=$!
        update_frontend_deps &
        FRONTEND_DEPS_PID=$!
        
        # 等待依赖安装完成
        wait $BACKEND_DEPS_PID || error "后端依赖安装失败"
        wait $FRONTEND_DEPS_PID || error "前端依赖安装失败"
        
        # 并行构建（如果服务器资源充足）
        log "🔨 开始构建..."
        build_backend &
        BACKEND_BUILD_PID=$!
        build_frontend &
        FRONTEND_BUILD_PID=$!
        
        # 等待构建完成
        wait $BACKEND_BUILD_PID || error "后端构建失败"
        wait $FRONTEND_BUILD_PID || error "前端构建失败"
        
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
