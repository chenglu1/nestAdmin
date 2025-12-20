#!/bin/bash

# ==========================================
# 服务器磁盘清理脚本
# 用于清理生产环境中占用空间的文件
# ==========================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
PROJECT_ROOT="/www/wwwroot/nestAdmin"
LOG_FILE="${PROJECT_ROOT}/logs/cleanup.log"

# 创建日志目录
mkdir -p "$(dirname "$LOG_FILE")"

# 函数: 日志输出
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}" | tee -a "$LOG_FILE"
}

# 函数: 显示磁盘使用情况
show_disk_usage() {
    echo ""
    info "========================================="
    info "📊 当前磁盘使用情况"
    info "========================================="
    df -h / | tail -1 | awk '{print "总容量: " $2 ", 已用: " $3 " (" $5 "), 可用: " $4}'
    echo ""
}

# 函数: 清理日志文件
cleanup_logs() {
    log "🧹 清理日志文件..."
    
    local freed_space=0
    
    # 清理项目日志（保留最近7天）
    if [ -d "${PROJECT_ROOT}/logs" ]; then
        find "${PROJECT_ROOT}/logs" -name "*.log" -type f -mtime +7 -delete
        freed_space=$(find "${PROJECT_ROOT}/logs" -name "*.log" -type f -mtime +7 -exec du -ch {} + 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
        log "✅ 已清理7天前的日志文件"
    fi
    
    # 清理 PM2 日志（保留最近7天）
    if command -v pm2 &> /dev/null; then
        pm2 flush 2>/dev/null || warn "PM2 日志清理失败"
        log "✅ 已清理 PM2 日志"
    fi
    
    # 清理系统日志（需要 root 权限）
    if [ "$EUID" -eq 0 ]; then
        journalctl --vacuum-time=7d 2>/dev/null || warn "系统日志清理失败"
        log "✅ 已清理系统日志（保留7天）"
    fi
    
    echo ""
}

# 函数: 清理构建缓存和临时文件
cleanup_build_cache() {
    log "🧹 清理构建缓存和临时文件..."
    
    # 清理 TypeScript 构建信息
    find "$PROJECT_ROOT" -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true
    log "✅ 已清理 TypeScript 构建信息文件"
    
    # 清理 Vite 缓存
    if [ -d "${PROJECT_ROOT}/frontend/.vite" ]; then
        rm -rf "${PROJECT_ROOT}/frontend/.vite"
        log "✅ 已清理 Vite 缓存"
    fi
    
    # 清理其他缓存目录
    find "$PROJECT_ROOT" -type d -name ".cache" -exec rm -rf {} + 2>/dev/null || true
    find "$PROJECT_ROOT" -type d -name "coverage" -exec rm -rf {} + 2>/dev/null || true
    log "✅ 已清理其他缓存目录"
    
    echo ""
}

# 函数: 清理 pnpm 缓存（可选，会重新下载）
cleanup_pnpm_cache() {
    log "🧹 清理 pnpm 缓存..."
    
    read -p "是否清理 pnpm 缓存？这会导致下次部署时重新下载依赖 (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # 清理 pnpm store
        if [ -d "${PNPM_STORE_DIR:-/root/.pnpm-store}" ]; then
            pnpm store prune 2>/dev/null || warn "pnpm store prune 失败"
            log "✅ 已清理 pnpm store"
        fi
        
        # 清理全局 pnpm store
        if command -v pnpm &> /dev/null; then
            pnpm store prune --force 2>/dev/null || warn "pnpm 全局缓存清理失败"
            log "✅ 已清理 pnpm 全局缓存"
        fi
    else
        log "⏭️  跳过 pnpm 缓存清理"
    fi
    
    echo ""
}

# 函数: 清理旧的构建文件（保留最新的）
cleanup_old_builds() {
    log "🧹 清理旧的构建文件..."
    
    # 清理后端的旧构建（如果有备份）
    if [ -d "${PROJECT_ROOT}/backend/dist.backup" ]; then
        rm -rf "${PROJECT_ROOT}/backend/dist.backup"
        log "✅ 已清理后端构建备份"
    fi
    
    # 清理前端的旧构建（如果有备份）
    if [ -d "${PROJECT_ROOT}/frontend/dist.backup" ]; then
        rm -rf "${PROJECT_ROOT}/frontend/dist.backup"
        log "✅ 已清理前端构建备份"
    fi
    
    echo ""
}

# 函数: 清理 Docker 资源（如果使用 Docker）
cleanup_docker() {
    log "🧹 清理 Docker 资源..."
    
    if command -v docker &> /dev/null; then
        read -p "是否清理 Docker 未使用的资源（镜像、容器、网络）？ (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker system prune -af --volumes 2>/dev/null || warn "Docker 清理失败"
            log "✅ 已清理 Docker 未使用的资源"
        else
            log "⏭️  跳过 Docker 清理"
        fi
    else
        log "⏭️  未安装 Docker，跳过"
    fi
    
    echo ""
}

# 函数: 清理系统临时文件
cleanup_temp_files() {
    log "🧹 清理系统临时文件..."
    
    # 清理 /tmp 目录（保留最近1天的文件）
    if [ "$EUID" -eq 0 ]; then
        find /tmp -type f -mtime +1 -delete 2>/dev/null || warn "临时文件清理失败"
        log "✅ 已清理系统临时文件"
    else
        log "⏭️  需要 root 权限清理系统临时文件"
    fi
    
    echo ""
}

# 函数: 显示大文件/目录
show_large_files() {
    log "📁 查找占用空间较大的文件和目录..."
    
    echo ""
    info "Top 10 大文件/目录（在项目目录中）:"
    if [ -d "$PROJECT_ROOT" ]; then
        du -h --max-depth=2 "$PROJECT_ROOT" 2>/dev/null | sort -rh | head -10
    fi
    
    echo ""
    info "Top 10 大文件/目录（系统根目录）:"
    du -h --max-depth=1 / 2>/dev/null | sort -rh | head -10 | grep -v "^$"
    
    echo ""
}

# 主函数
main() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}🧹 服务器磁盘清理工具${NC}"
    echo -e "${GREEN}========================================${NC}"
    
    # 显示当前磁盘使用情况
    show_disk_usage
    
    # 显示大文件
    show_large_files
    
    # 询问用户要清理的内容
    echo ""
    echo -e "${YELLOW}请选择要清理的内容：${NC}"
    echo "1) 清理日志文件（保留最近7天）"
    echo "2) 清理构建缓存和临时文件"
    echo "3) 清理 pnpm 缓存"
    echo "4) 清理旧的构建文件"
    echo "5) 清理 Docker 资源（如果使用）"
    echo "6) 清理系统临时文件（需要 root）"
    echo "7) 全部清理（推荐）"
    echo "0) 退出"
    echo ""
    read -p "请输入选项 (0-7): " choice
    
    case $choice in
        1)
            cleanup_logs
            ;;
        2)
            cleanup_build_cache
            ;;
        3)
            cleanup_pnpm_cache
            ;;
        4)
            cleanup_old_builds
            ;;
        5)
            cleanup_docker
            ;;
        6)
            cleanup_temp_files
            ;;
        7)
            cleanup_logs
            cleanup_build_cache
            cleanup_old_builds
            cleanup_temp_files
            cleanup_pnpm_cache
            cleanup_docker
            ;;
        0)
            log "退出清理工具"
            exit 0
            ;;
        *)
            error "无效的选项"
            exit 1
            ;;
    esac
    
    # 显示清理后的磁盘使用情况
    show_disk_usage
    
    log "✅ 清理完成！"
    echo ""
}

# 执行主函数
main

