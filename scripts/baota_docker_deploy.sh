#!/bin/bash

# 宝塔Docker部署脚本 - nestAdmin项目
echo "========================================"
echo "开始在宝塔服务器上部署nestAdmin项目..."
echo "========================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker 未安装，请先在宝塔面板中安装Docker${NC}"
    exit 1
fi

# 检查docker-compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}错误: docker-compose 未安装，请先在宝塔面板中安装docker-compose${NC}"
    exit 1
fi

echo -e "${GREEN}Docker 环境检查通过${NC}"

# 获取当前目录
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
echo -e "${YELLOW}项目目录: ${PROJECT_DIR}${NC}"

# 进入项目目录
cd "${PROJECT_DIR}"

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo -e "${RED}错误: .env 文件不存在，请先创建并配置环境变量${NC}"
    exit 1
fi

echo -e "${GREEN}环境变量文件检查通过${NC}"

# 停止现有容器（如果存在）
echo -e "${YELLOW}停止现有容器...${NC}"
docker-compose down

# 清理旧镜像
echo -e "${YELLOW}清理旧镜像...${NC}"
docker-compose rm -f -v

# 构建镜像
echo -e "${YELLOW}构建Docker镜像...${NC}"
docker-compose build
if [ $? -ne 0 ]; then
    echo -e "${RED}镜像构建失败，请检查Dockerfile和依赖项${NC}"
    exit 1
fi

# 启动容器
echo -e "${YELLOW}启动Docker容器...${NC}"
docker-compose up -d
if [ $? -ne 0 ]; then
    echo -e "${RED}容器启动失败，请检查docker-compose.yml配置${NC}"
    exit 1
fi

# 等待服务启动
echo -e "${YELLOW}等待服务启动，这可能需要几分钟...${NC}"
sleep 30

# 检查容器状态
echo -e "${YELLOW}检查容器状态...${NC}"
docker-compose ps

# 检查服务健康状态
echo -e "${YELLOW}检查服务健康状态...${NC}"

# 检查MySQL服务
if docker-compose exec mysql mysqladmin ping -h localhost &> /dev/null; then
    echo -e "${GREEN}MySQL 服务正常${NC}"
else
    echo -e "${RED}MySQL 服务异常，请检查日志${NC}"
fi

# 检查Redis服务
if docker-compose exec redis redis-cli -a "$(grep REDIS_PASSWORD .env | cut -d '=' -f2)" ping &> /dev/null; then
    echo -e "${GREEN}Redis 服务正常${NC}"
else
    echo -e "${RED}Redis 服务异常，请检查日志${NC}"
fi

# 检查后端服务
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health | grep -q "200"; then
    echo -e "${GREEN}后端服务正常${NC}"
else
    echo -e "${RED}后端服务异常，请检查日志${NC}"
fi

# 检查前端服务
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200"; then
    echo -e "${GREEN}前端服务正常${NC}"
else
    echo -e "${RED}前端服务异常，请检查日志${NC}"
fi

echo "========================================"
echo -e "${GREEN}部署完成！${NC}"
echo -e "前端访问地址: ${YELLOW}http://服务器IP:8080${NC}"
echo -e "后端API地址: ${YELLOW}http://服务器IP:3001/api${NC}"
echo "========================================"

# 提示在宝塔面板中配置
cat << EOF

${YELLOW}宝塔面板配置建议:${NC}
1. 确保服务器已开放 8080 和 3001 端口
2. 如需使用域名访问，请在宝塔面板中创建站点并配置反向代理:
   - 前端: 代理到 127.0.0.1:8080
   - 后端API: 代理到 127.0.0.1:3001/api
3. 建议配置SSL证书以启用HTTPS访问
4. 定期备份数据卷:
   - MySQL数据卷: mysql_data
   - Redis数据卷: redis_data

EOF