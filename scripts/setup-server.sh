#!/bin/bash

# ==========================================
# NestAdmin 服务器快速配置脚本
# 功能: 在宝塔服务器上快速配置部署环境
# ==========================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
PROJECT_ROOT="/www/wwwroot/nestAdmin"
GITHUB_REPO="https://github.com/chenglu1/nestAdmin.git"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🚀 NestAdmin 服务器环境配置${NC}"
echo -e "${BLUE}========================================${NC}"

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}⚠️  建议使用 root 用户运行此脚本${NC}"
fi

# 1. 检查并安装 Git
echo -e "\n${YELLOW}[1/7] 检查 Git...${NC}"
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}Git 未安装，正在安装...${NC}"
    if command -v yum &> /dev/null; then
        yum install -y git
    elif command -v apt-get &> /dev/null; then
        apt-get update && apt-get install -y git
    else
        echo -e "${RED}无法自动安装 Git，请手动安装${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ Git: $(git --version)${NC}"

# 2. 检查并安装 Node.js
echo -e "\n${YELLOW}[2/7] 检查 Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js 未安装${NC}"
    echo -e "${YELLOW}请在宝塔面板中安装 Node.js 版本管理器${NC}"
    echo -e "${YELLOW}路径: 软件商店 → Node.js 版本管理器${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"

# 3. 检查并安装 pnpm
echo -e "\n${YELLOW}[3/7] 检查 pnpm...${NC}"
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}pnpm 未安装，正在安装...${NC}"
    if command -v corepack &> /dev/null; then
        corepack enable
        corepack prepare pnpm@latest --activate
    else
        npm install -g pnpm
    fi
fi
echo -e "${GREEN}✅ pnpm: $(pnpm --version)${NC}"

# 4. 检查并安装 PM2
echo -e "\n${YELLOW}[4/7] 检查 PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 未安装，正在安装...${NC}"
    npm install -g pm2
    pm2 startup
    pm2 save
fi
echo -e "${GREEN}✅ PM2: $(pm2 --version)${NC}"

# 5. 创建项目目录并克隆代码
echo -e "\n${YELLOW}[5/7] 配置项目目录...${NC}"
if [ ! -d "$PROJECT_ROOT" ]; then
    echo -e "${YELLOW}创建项目目录: $PROJECT_ROOT${NC}"
    mkdir -p "$PROJECT_ROOT"
    cd "$PROJECT_ROOT"
    git clone "$GITHUB_REPO" .
else
    echo -e "${YELLOW}项目目录已存在，更新代码...${NC}"
    cd "$PROJECT_ROOT"
    if [ -d ".git" ]; then
        git fetch origin
        git checkout main
        git pull origin main
    else
        echo -e "${YELLOW}初始化 Git 仓库...${NC}"
        git init
        git remote add origin "$GITHUB_REPO"
        git fetch origin
        git checkout -b main origin/main
    fi
fi
echo -e "${GREEN}✅ 项目目录配置完成${NC}"

# 6. 创建必要的目录和文件
echo -e "\n${YELLOW}[6/7] 创建必要的目录...${NC}"
mkdir -p "$PROJECT_ROOT/logs"
mkdir -p "$PROJECT_ROOT/backend/logs"
chmod 755 "$PROJECT_ROOT/logs"
chmod 755 "$PROJECT_ROOT/backend/logs"
echo -e "${GREEN}✅ 目录创建完成${NC}"

# 7. 设置脚本权限
echo -e "\n${YELLOW}[7/7] 设置脚本权限...${NC}"
chmod +x "$PROJECT_ROOT/scripts/deploy.sh"
chmod +x "$PROJECT_ROOT/scripts/baota_docker_deploy.sh"
chmod +x "$PROJECT_ROOT/scripts/post-receive-hook.sh"
echo -e "${GREEN}✅ 脚本权限设置完成${NC}"

# 8. 配置 SSH 密钥提示
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}📝 下一步操作${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}1. 配置 SSH 密钥认证:${NC}"
echo -e "   - 生成 SSH 密钥对: ssh-keygen -t rsa -b 4096 -C 'github-actions-deploy'"
echo -e "   - 将公钥添加到 ~/.ssh/authorized_keys"
echo -e "   - 将私钥添加到 GitHub Secrets (SERVER_SSH_KEY)"
echo ""
echo -e "${YELLOW}2. 配置 GitHub Secrets:${NC}"
echo -e "   - SERVER_HOST: 你的服务器 IP"
echo -e "   - SERVER_USER: SSH 用户名（通常是 root）"
echo -e "   - SERVER_SSH_KEY: SSH 私钥内容"
echo -e "   - SERVER_SSH_PORT: SSH 端口（可选，默认 22）"
echo ""
echo -e "${YELLOW}3. 配置环境变量:${NC}"
if [ -f "$PROJECT_ROOT/.env.docker" ]; then
    echo -e "   - 复制环境变量文件: cp $PROJECT_ROOT/.env.docker $PROJECT_ROOT/.env.docker.local"
    echo -e "   - 编辑 .env.docker.local，配置数据库密码等敏感信息"
fi
echo ""
echo -e "${YELLOW}4. 测试部署:${NC}"
echo -e "   - 推送到 main 分支: git push origin main"
echo -e "   - 或在 GitHub Actions 中手动触发工作流"
echo ""
echo -e "${GREEN}✅ 服务器环境配置完成！${NC}"
echo -e "${BLUE}========================================${NC}"

