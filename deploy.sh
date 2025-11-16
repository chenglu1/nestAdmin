#!/bin/bash

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}NestAdmin 部署脚本${NC}"
echo -e "${GREEN}================================${NC}"

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装,请先安装 Docker${NC}"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose 未安装,请先安装 Docker Compose${NC}"
    exit 1
fi

# 检查 .env 文件
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env 文件不存在,从 .env.example 复制...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}请编辑 .env 文件并设置正确的配置${NC}"
    exit 1
fi

# 停止旧容器
echo -e "${YELLOW}🛑 停止旧容器...${NC}"
docker-compose down

# 清理旧镜像 (可选)
read -p "是否清理旧的 Docker 镜像? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🧹 清理旧镜像...${NC}"
    docker system prune -af
fi

# 构建镜像
echo -e "${GREEN}🔨 构建 Docker 镜像...${NC}"
docker-compose build --no-cache

# 启动容器
echo -e "${GREEN}🚀 启动容器...${NC}"
docker-compose up -d

# 等待服务启动
echo -e "${YELLOW}⏳ 等待服务启动...${NC}"
sleep 10

# 检查容器状态
echo -e "${GREEN}📊 检查容器状态:${NC}"
docker-compose ps

# 检查健康状态
echo -e "${GREEN}🏥 检查健康状态:${NC}"
echo -e "${YELLOW}后端健康检查:${NC}"
curl -f http://localhost:3000/health && echo -e "${GREEN}✅ 后端正常${NC}" || echo -e "${RED}❌ 后端异常${NC}"

echo -e "${YELLOW}前端健康检查:${NC}"
curl -f http://localhost/ && echo -e "${GREEN}✅ 前端正常${NC}" || echo -e "${RED}❌ 前端异常${NC}"

# 显示日志
echo -e "${GREEN}📝 查看日志 (Ctrl+C 退出):${NC}"
docker-compose logs -f
