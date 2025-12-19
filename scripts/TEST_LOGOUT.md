# 登出接口测试说明

## 问题描述
生产环境登出时提示"缺少刷新令牌"错误。

## 测试方法

### 方法1: 通过 Nginx 代理访问（推荐）
如果服务器配置了 Nginx 反向代理，应该通过 80 端口访问：

```powershell
# 登录
$loginBody = @{username="admin";password="admin123"} | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri "http://118.89.79.13/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
$accessToken = $loginResponse.data.accessToken

# 测试登出（不带Cookie，模拟refreshToken已过期）
$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}
$logoutResponse = Invoke-RestMethod -Uri "http://118.89.79.13/api/auth/logout" -Method POST -Headers $headers -Body "{}"
Write-Host "登出响应: $($logoutResponse | ConvertTo-Json)"
```

### 方法2: 直接访问后端端口
如果后端服务直接暴露在 3001 端口：

```powershell
# 登录
$loginBody = @{username="admin";password="admin123"} | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri "http://118.89.79.13:3001/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
$accessToken = $loginResponse.data.accessToken

# 测试登出
$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}
try {
    $logoutResponse = Invoke-RestMethod -Uri "http://118.89.79.13:3001/api/auth/logout" -Method POST -Headers $headers -Body "{}"
    Write-Host "✅ 登出成功: $($logoutResponse | ConvertTo-Json)"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "❌ 登出失败，状态码: $statusCode"
    if ($statusCode -eq 400) {
        Write-Host "⚠️  问题确认：返回400错误，需要部署最新代码"
    }
}
```

### 方法3: 使用 curl（如果服务器支持）
```bash
# 登录
curl -X POST http://118.89.79.13:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -c cookies.txt

# 提取 token（需要手动从响应中提取）
TOKEN="your_access_token_here"

# 测试登出（不带Cookie）
curl -X POST http://118.89.79.13:3001/api/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}'
```

## 预期结果

### 修复后的代码应该：
1. ✅ 即使没有 refreshToken，也能成功登出（返回 200）
2. ✅ 清除 Cookie（如果存在）
3. ✅ 返回成功消息：`{"code": 200, "message": "注销成功"}`

### 如果仍然返回 400 错误：
说明生产环境的代码还没有更新，需要：
1. 检查代码是否已提交到 GitHub
2. 触发 GitHub Actions 部署
3. 确认部署成功

## 检查服务器状态

如果遇到 502 错误，需要检查：
1. 后端服务是否运行：`pm2 list` 或 `pm2 logs`
2. 端口是否正确：`netstat -tlnp | grep 3001`
3. Nginx 配置是否正确：检查 `/www/server/panel/vhost/nginx/` 下的配置文件

