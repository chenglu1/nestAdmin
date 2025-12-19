# 🔒 关于腾讯云安全告警的说明

## ⚠️ 告警信息

如果你收到了类似以下的安全告警：

```
【腾讯云】主机安全检测到可疑登录风险
来源IP：40.76.191.165（美国）
登录用户名：root
风险等级：高危
时间：2025-12-19 23:07:08
```

## ✅ 这是正常的！

### 为什么会出现这个告警？

1. **GitHub Actions 的 IP 地址**
   - GitHub Actions 运行在 GitHub 的服务器上
   - 这些服务器可能位于美国或其他国家
   - IP 地址 `40.76.191.165` 是 GitHub Actions 的服务器 IP

2. **自动部署触发**
   - 当你推送代码到 GitHub 时
   - GitHub Actions 会自动执行部署脚本
   - 脚本通过 SSH 连接到你的服务器
   - 这会被腾讯云安全系统识别为"可疑登录"

3. **告警时间对应**
   - 告警时间 `23:07:08` 正好对应部署时间
   - 这是正常的自动部署行为

## 🔍 如何确认是 GitHub Actions？

### 方法 1: 查看 GitHub Actions 日志

1. 进入仓库：https://github.com/chenglu1/nestAdmin
2. 点击 **Actions** 标签
3. 查看部署时间是否与告警时间一致

### 方法 2: 查看服务器日志

```bash
# 查看 SSH 登录日志
grep "40.76.191.165" /var/log/auth.log
# 或
grep "40.76.191.165" /var/log/secure

# 查看部署日志
tail -f /www/wwwroot/nestAdmin/logs/deploy.log
```

### 方法 3: 查看 GitHub Actions IP 范围

GitHub Actions 使用的 IP 地址范围：
- 可以在 GitHub 文档中查看：https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners#ip-addresses

## 🛡️ 安全建议

### 1. 白名单 GitHub Actions IP（可选）

如果你担心误报，可以将 GitHub Actions 的 IP 范围添加到白名单：

```bash
# 查看 GitHub Actions IP 范围
# https://api.github.com/meta

# 在宝塔面板中：
# 安全 → 防火墙 → 添加规则
# 允许 GitHub Actions IP 范围访问 SSH 端口（22）
```

### 2. 使用 SSH 密钥认证（已配置 ✅）

- ✅ 已配置 SSH 密钥认证
- ✅ 不使用密码登录
- ✅ 密钥已添加到服务器

### 3. 限制 SSH 访问（推荐）

在宝塔面板中：
1. **安全** → **SSH管理**
2. 设置：
   - 禁止 root 密码登录
   - 只允许密钥认证
   - 限制登录 IP（可选）

### 4. 监控登录日志

定期检查：
```bash
# 查看最近的 SSH 登录记录
lastlog

# 查看失败的登录尝试
grep "Failed password" /var/log/auth.log
```

## 📝 总结

- ✅ **告警是正常的**：GitHub Actions 自动部署会触发这个告警
- ✅ **无需担心**：这是你配置的自动部署功能
- ✅ **已配置安全措施**：使用 SSH 密钥认证，不使用密码
- ⚠️ **建议**：如果频繁收到告警，可以考虑将 GitHub Actions IP 添加到白名单

## 🔗 相关链接

- [GitHub Actions IP 地址](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners#ip-addresses)
- [腾讯云主机安全](https://console.cloud.tencent.com/cwp)
- [部署指南](./DEPLOYMENT_GUIDE.md)

---

**最后更新：** 2025-12-19

