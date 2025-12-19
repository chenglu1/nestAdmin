# 请求限流使用指南

## 📋 概述

本项目已集成 `@nestjs/throttler` 实现请求限流功能，可以有效防止：
- API 暴力破解攻击
- DDoS 攻击
- 资源滥用

## ⚙️ 配置说明

### 默认限流策略

在 `app.module.ts` 中配置了默认限流策略：
- **默认限流**: 100次请求/60秒（适用于所有接口）
- **严格限流**: 10次请求/60秒（适用于登录等敏感接口）
- **非常严格限流**: 5次请求/60秒（适用于密码重置等关键接口）

### 存储方式

- **内存存储**（默认）: 适用于单实例部署
- **Redis 存储**（可选）: 适用于多实例分布式部署

## 🎯 使用方法

### 1. 使用默认限流

默认情况下，所有接口都受到 100次/60秒 的限流保护，无需额外配置。

### 2. 使用严格限流

为登录等敏感接口添加严格限流：

```typescript
import { ThrottleStrict } from '../../common/decorators/throttle.decorator';

@Post('login')
@ThrottleStrict() // 10次请求/60秒
async login(@Body() loginDto: LoginDto) {
  // ...
}
```

### 3. 使用非常严格限流

为密码重置等关键接口添加非常严格限流：

```typescript
import { ThrottleVeryStrict } from '../../common/decorators/throttle.decorator';

@Post('reset-password')
@ThrottleVeryStrict() // 5次请求/60秒
async resetPassword(@Body() dto: ResetPasswordDto) {
  // ...
}
```

### 4. 自定义限流

使用自定义限流策略：

```typescript
import { ThrottleCustom } from '../../common/decorators/throttle.decorator';

@Post('send-email')
@ThrottleCustom(3, 300000) // 3次请求/5分钟
async sendEmail(@Body() dto: SendEmailDto) {
  // ...
}
```

### 5. 跳过限流

为健康检查等不需要限流的接口跳过限流：

```typescript
import { SkipThrottle } from '../../common/decorators/throttle.decorator';

@Get('health')
@SkipThrottle() // 跳过限流
async healthCheck() {
  // ...
}
```

## 📊 限流响应

当请求超过限流阈值时，API 会返回：

```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests",
  "error": "Too Many Requests"
}
```

HTTP 状态码：`429 Too Many Requests`

响应头包含：
- `X-RateLimit-Limit`: 限制次数
- `X-RateLimit-Remaining`: 剩余次数
- `X-RateLimit-Reset`: 重置时间（Unix 时间戳）

## 🔧 配置 Redis 存储（可选）

如需在多实例环境中使用分布式限流，可以配置 Redis 存储：

```typescript
// app.module.ts
ThrottlerModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const enableRedis = configService.get('ENABLE_REDIS', 'false') === 'true';
    
    return {
      throttlers: [
        {
          ttl: 60000,
          limit: 100,
        },
      ],
      // 配置 Redis 存储
      storage: enableRedis ? {
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASSWORD'),
      } : undefined,
    };
  },
}),
```

## 📝 最佳实践

1. **登录接口**: 使用 `@ThrottleStrict()` 防止暴力破解
2. **密码重置**: 使用 `@ThrottleVeryStrict()` 防止滥用
3. **发送验证码**: 使用自定义限流，如 `@ThrottleCustom(3, 300000)`（3次/5分钟）
4. **健康检查**: 使用 `@SkipThrottle()` 跳过限流
5. **公开 API**: 使用默认限流或自定义限流
6. **内部 API**: 可以适当放宽限流策略

## ⚠️ 注意事项

1. 限流是基于 IP 地址的，同一 IP 的所有请求共享限流计数
2. 在生产环境中，建议使用 Redis 存储以实现分布式限流
3. 限流策略应该根据实际业务需求调整
4. 监控限流触发情况，及时发现异常访问

## 🐛 调试

如果遇到限流问题，可以：

1. 检查日志中的限流信息
2. 查看响应头中的限流信息
3. 调整限流策略配置
4. 检查 Redis 连接（如果使用 Redis 存储）

