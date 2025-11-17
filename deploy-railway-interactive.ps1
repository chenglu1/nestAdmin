# Railway 一键部署脚本 (PowerShell)

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Railway 部署助手 - NestAdmin 全栈项目" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否安装了Railway CLI
Write-Host "[1/6] 检查Railway CLI..." -ForegroundColor Yellow
$railwayInstalled = Get-Command railway -ErrorAction SilentlyContinue

if (-not $railwayInstalled) {
    Write-Host "❌ Railway CLI未安装" -ForegroundColor Red
    Write-Host ""
    Write-Host "请选择安装方式:" -ForegroundColor Cyan
    Write-Host "1. NPM安装(推荐):  npm install -g @railway/cli" -ForegroundColor Green
    Write-Host "2. 手动下载:       https://railway.app/cli" -ForegroundColor Green
    Write-Host ""
    $install = Read-Host "是否现在使用NPM安装? (y/n)"
    
    if ($install -eq "y") {
        Write-Host "正在安装Railway CLI..." -ForegroundColor Yellow
        npm install -g @railway/cli
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ 安装失败,请手动安装后重试" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Railway CLI安装成功" -ForegroundColor Green
    } else {
        Write-Host "❌ 请先安装Railway CLI后再运行此脚本" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Railway CLI已安装" -ForegroundColor Green
}

Write-Host ""

# 检查Git状态
Write-Host "[2/6] 检查Git状态..." -ForegroundColor Yellow
$gitStatus = git status --porcelain

if ($gitStatus) {
    Write-Host "⚠️  发现未提交的更改:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    $commit = Read-Host "是否提交并推送到GitHub? (y/n)"
    
    if ($commit -eq "y") {
        $commitMsg = Read-Host "输入提交信息 (默认: Update for Railway deployment)"
        if (-not $commitMsg) {
            $commitMsg = "Update for Railway deployment"
        }
        
        git add .
        git commit -m $commitMsg
        git push
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Git推送失败" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ 代码已推送到GitHub" -ForegroundColor Green
    }
} else {
    Write-Host "✅ 代码已同步" -ForegroundColor Green
}

Write-Host ""

# Railway登录
Write-Host "[3/6] Railway账号登录..." -ForegroundColor Yellow
Write-Host "提示: 将打开浏览器进行GitHub授权登录" -ForegroundColor Cyan
Start-Sleep -Seconds 2

railway login

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Railway登录失败" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 登录成功" -ForegroundColor Green
Write-Host ""

# 选择部署方式
Write-Host "[4/6] 选择部署方式..." -ForegroundColor Yellow
Write-Host ""
Write-Host "请选择部署方式:" -ForegroundColor Cyan
Write-Host "1. 网页部署 (推荐新手,可视化操作)" -ForegroundColor Green
Write-Host "2. CLI部署 (高级用户,自动化)" -ForegroundColor Green
Write-Host ""
$deployMethod = Read-Host "请输入选项 (1/2)"

if ($deployMethod -eq "1") {
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "  网页部署流程" -ForegroundColor Cyan
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "✅ 准备工作已完成!" -ForegroundColor Green
    Write-Host ""
    Write-Host "接下来请按以下步骤操作:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "【第1步】创建Railway项目" -ForegroundColor Cyan
    Write-Host "  1. 点击 'New Project'" -ForegroundColor White
    Write-Host "  2. 选择 'Deploy from GitHub repo'" -ForegroundColor White
    Write-Host "  3. 找到 'chenglu1/nestAdmin' 仓库" -ForegroundColor White
    Write-Host ""
    
    Write-Host "【第2步】添加MySQL数据库" -ForegroundColor Cyan
    Write-Host "  1. 点击 '+ New' → 'Database' → 'Add MySQL'" -ForegroundColor White
    Write-Host "  2. Railway自动创建MySQL实例" -ForegroundColor White
    Write-Host ""
    
    Write-Host "【第3步】部署后端服务" -ForegroundColor Cyan
    Write-Host "  1. 点击 '+ New' → 'GitHub Repo' → 选择 'backend' 目录" -ForegroundColor White
    Write-Host "  2. 配置环境变量(详见 RAILWAY_DEPLOY_GUIDE.md)" -ForegroundColor White
    Write-Host "  3. 点击 'Deploy'" -ForegroundColor White
    Write-Host "  4. 获取后端域名: Settings → Generate Domain" -ForegroundColor White
    Write-Host ""
    
    Write-Host "【第4步】部署前端服务" -ForegroundColor Cyan
    Write-Host "  1. 点击 '+ New' → 'GitHub Repo' → 选择 'frontend' 目录" -ForegroundColor White
    Write-Host "  2. 配置 VITE_API_URL 为后端域名" -ForegroundColor White
    Write-Host "  3. 点击 'Deploy'" -ForegroundColor White
    Write-Host "  4. 获取前端域名: Settings → Generate Domain" -ForegroundColor White
    Write-Host ""
    
    Write-Host "📖 完整步骤请查看: RAILWAY_DEPLOY_GUIDE.md" -ForegroundColor Yellow
    Write-Host ""
    
    $openBrowser = Read-Host "是否现在打开Railway控制台? (y/n)"
    if ($openBrowser -eq "y") {
        Start-Process "https://railway.app/new"
    }
    
    $openGuide = Read-Host "是否打开部署指南文档? (y/n)"
    if ($openGuide -eq "y") {
        Start-Process "RAILWAY_DEPLOY_GUIDE.md"
    }
    
} elseif ($deployMethod -eq "2") {
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "  CLI自动部署" -ForegroundColor Cyan
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    
    # 初始化Railway项目
    Write-Host "[5/6] 初始化Railway项目..." -ForegroundColor Yellow
    
    $initProject = Read-Host "是否创建新的Railway项目? (y=新建, n=链接现有项目)"
    
    if ($initProject -eq "y") {
        $projectName = Read-Host "输入项目名称 (默认: nestadmin)"
        if (-not $projectName) {
            $projectName = "nestadmin"
        }
        
        railway init --name $projectName
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ 项目初始化失败" -ForegroundColor Red
            exit 1
        }
    } else {
        railway link
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ 项目链接失败" -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host "✅ 项目已准备就绪" -ForegroundColor Green
    Write-Host ""
    
    # 部署服务
    Write-Host "[6/6] 部署服务..." -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "⚠️  注意: CLI部署需要手动配置环境变量" -ForegroundColor Yellow
    Write-Host "推荐使用网页控制台配置环境变量和数据库" -ForegroundColor Yellow
    Write-Host ""
    
    $deployNow = Read-Host "是否继续CLI部署? (y=继续, n=稍后在网页配置)"
    
    if ($deployNow -eq "y") {
        # 部署后端
        Write-Host ""
        Write-Host "正在部署后端服务..." -ForegroundColor Cyan
        Set-Location backend
        railway up
        Set-Location ..
        
        Write-Host ""
        Write-Host "正在部署前端服务..." -ForegroundColor Cyan
        Set-Location frontend
        railway up
        Set-Location ..
        
        Write-Host ""
        Write-Host "✅ 服务部署完成" -ForegroundColor Green
        Write-Host ""
        Write-Host "查看部署状态: railway status" -ForegroundColor Cyan
        Write-Host "查看日志: railway logs" -ForegroundColor Cyan
        Write-Host "打开控制台: railway open" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "请在Railway控制台完成以下配置:" -ForegroundColor Yellow
        Write-Host "1. 添加MySQL数据库" -ForegroundColor White
        Write-Host "2. 配置环境变量" -ForegroundColor White
        Write-Host "3. 手动触发部署" -ForegroundColor White
        
        $openConsole = Read-Host "是否打开Railway控制台? (y/n)"
        if ($openConsole -eq "y") {
            railway open
        }
    }
    
} else {
    Write-Host "❌ 无效选项" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  部署流程完成!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 更多帮助:" -ForegroundColor Yellow
Write-Host "  • 部署指南: RAILWAY_DEPLOY_GUIDE.md" -ForegroundColor White
Write-Host "  • Railway文档: https://docs.railway.app" -ForegroundColor White
Write-Host "  • 项目控制台: https://railway.app/dashboard" -ForegroundColor White
Write-Host ""
Write-Host "🎉 祝你部署顺利!" -ForegroundColor Green
