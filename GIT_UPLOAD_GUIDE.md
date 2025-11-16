# GitHub 项目上传指南

## 📝 准备工作

### 1. 在 GitHub 上创建新仓库

1. 访问 https://github.com/new
2. 填写仓库信息:
   - **Repository name**: `nestAdmin` (或其他名称)
   - **Description**: `NestJS + React 全栈管理系统`
   - **Visibility**: Public (公开) 或 Private (私有)
   - ⚠️ **不要勾选** "Initialize this repository with"
3. 点击 "Create repository"

## 🚀 上传代码到 GitHub

### 方式 1: 使用命令行 (推荐)

打开 PowerShell 或 Git Bash,进入项目目录:

```bash
# 进入项目目录
cd C:\Users\chenglu\Desktop\todo\nestAdmin

# 1. 初始化 Git 仓库
git init

# 2. 添加所有文件
git add .

# 3. 提交代码
git commit -m "Initial commit: NestJS + React 全栈管理系统"

# 4. 添加远程仓库 (替换为你的 GitHub 仓库地址)
git remote add origin https://github.com/chenglu1/nestAdmin.git

# 5. 推送到 GitHub
git push -u origin main
```

### 方式 2: 使用 GitHub Desktop (图形界面)

1. 下载并安装 [GitHub Desktop](https://desktop.github.com/)
2. 打开 GitHub Desktop
3. 点击 "Add" → "Add Existing Repository"
4. 选择项目目录: `C:\Users\chenglu\Desktop\todo\nestAdmin`
5. 点击 "Publish repository"
6. 填写仓库信息并发布

## ⚠️ 重要提示

### 1. 检查敏感信息

在上传前,确保以下敏感信息已被忽略:

```bash
# 查看 .gitignore 文件
cat .gitignore
```

应该包含:
- `.env` - 环境变量文件
- `node_modules/` - 依赖包
- `logs/` - 日志文件
- `dist/` - 构建产物

### 2. 创建 .env.example

确保不要上传真实的 `.env` 文件:

```bash
# 后端
backend/.env.example  ✅ (已创建)
backend/.env          ❌ (不要上传)

# 根目录
.env.example          ✅ (已创建)
.env                  ❌ (不要上传)
```

### 3. 删除已上传的敏感文件

如果不小心上传了敏感文件:

```bash
# 从 Git 历史中删除文件
git rm --cached backend/.env
git rm --cached .env

# 提交更改
git commit -m "Remove sensitive files"

# 推送
git push origin main
```

## 🔐 配置 SSH (可选,更安全)

### 1. 生成 SSH 密钥

```bash
# 生成新的 SSH 密钥
ssh-keygen -t ed25519 -C "your_email@example.com"

# 启动 SSH agent
eval "$(ssh-agent -s)"

# 添加密钥
ssh-add ~/.ssh/id_ed25519
```

### 2. 添加到 GitHub

1. 复制公钥内容:
```bash
cat ~/.ssh/id_ed25519.pub
```

2. 打开 GitHub → Settings → SSH and GPG keys
3. 点击 "New SSH key"
4. 粘贴公钥并保存

### 3. 使用 SSH 地址

```bash
# 更改远程仓库为 SSH 地址
git remote set-url origin git@github.com:chenglu1/nestAdmin.git

# 推送
git push -u origin main
```

## 📋 常用 Git 命令

### 日常开发

```bash
# 查看状态
git status

# 添加文件
git add .                    # 添加所有文件
git add backend/src/         # 添加特定目录
git add README.md            # 添加特定文件

# 提交
git commit -m "描述信息"

# 推送
git push

# 拉取最新代码
git pull
```

### 分支管理

```bash
# 创建新分支
git checkout -b feature/new-feature

# 切换分支
git checkout main

# 查看所有分支
git branch -a

# 删除分支
git branch -d feature/old-feature
```

### 查看历史

```bash
# 查看提交历史
git log

# 查看简洁历史
git log --oneline

# 查看文件修改
git diff
```

## 🔄 后续更新流程

每次修改代码后:

```bash
# 1. 查看修改
git status

# 2. 添加文件
git add .

# 3. 提交
git commit -m "描述本次修改内容"

# 4. 推送到 GitHub
git push
```

## 📦 推荐的提交信息格式

```bash
# 新功能
git commit -m "feat: 添加用户管理模块"

# 修复 Bug
git commit -m "fix: 修复登录失败的问题"

# 文档更新
git commit -m "docs: 更新 README 部署文档"

# 性能优化
git commit -m "perf: 优化数据库查询性能"

# 代码重构
git commit -m "refactor: 重构用户服务代码"

# 测试
git commit -m "test: 添加用户模块单元测试"

# 样式修改
git commit -m "style: 调整登录页面样式"
```

## 🛠️ 故障排查

### 问题 1: 推送被拒绝

```bash
# 错误: ! [rejected] main -> main (fetch first)
# 解决: 先拉取再推送
git pull origin main --rebase
git push origin main
```

### 问题 2: 文件过大

```bash
# GitHub 单文件限制 100MB
# 解决: 使用 Git LFS 或删除大文件
git lfs install
git lfs track "*.zip"
git lfs track "*.mp4"
```

### 问题 3: 忘记 .gitignore

```bash
# 先创建 .gitignore
# 然后清除缓存
git rm -r --cached .
git add .
git commit -m "Apply .gitignore"
git push
```

## 📚 参考资料

- [Git 官方文档](https://git-scm.com/doc)
- [GitHub 使用指南](https://docs.github.com/cn)
- [Git 可视化学习](https://learngitbranching.js.org/)

## ✅ 检查清单

上传前检查:
- [ ] `.gitignore` 文件已创建
- [ ] `.env` 文件未被追踪
- [ ] `node_modules/` 未被上传
- [ ] 敏感信息已移除
- [ ] README.md 已更新
- [ ] 代码已测试通过

---

**需要帮助?** 如有问题,请查看 [GitHub 帮助文档](https://docs.github.com/)
