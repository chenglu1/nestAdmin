#!/bin/bash

# ==========================================
# Git 服务器端 Hook 脚本 (post-receive)
# 将此文件放在服务器: .git/hooks/post-receive
# ==========================================

# 读取 Git 推送的信息
while read oldrev newrev refname; do
    branch=$(git rev-parse --symbolic --abbrev-ref $refname)
    
    # 只在 main 分支推送时触发部署
    if [ "$branch" = "main" ]; then
        echo "检测到 main 分支更新，触发自动部署..."
        
        # 调用部署脚本（后台运行）
        /home/nestadmin/scripts/deploy.sh > /dev/null 2>&1 &
        
        echo "✅ 部署脚本已触发"
    fi
done
