# 异常处理使用指南

## 📋 概述

本项目已实现完善的异常处理机制，包括：
- 自定义业务异常类（10+ 种异常类型）
- 全局异常过滤器（统一错误响应格式）
- 请求ID追踪（便于日志追踪和问题排查）
- 详细的错误日志记录（包含上下文信息）
- 异常上下文装饰器（添加业务上下文）
- 生产环境安全保护（隐藏敏感信息）

## 🎯 异常类型

### 1. BusinessException（业务异常基类）

所有业务异常的基类，提供统一的异常格式。

```typescript
import { BusinessException } from '../common/exceptions/business.exception';

throw new BusinessException('业务错误信息', HttpStatus.BAD_REQUEST, 'ERROR_CODE', { additionalData: 'data' });
```

### 2. 常用业务异常类

#### NotFoundException（资源不存在）

```typescript
import { NotFoundException } from '../common/exceptions/business.exception';

throw new NotFoundException('用户不存在');
throw new NotFoundException('用户不存在', { userId: 123 });
```

#### UnauthorizedException（未授权）

```typescript
import { UnauthorizedException } from '../common/exceptions/business.exception';

throw new UnauthorizedException('登录已过期');
throw new UnauthorizedException('权限不足', { requiredRole: 'admin' });
```

#### ForbiddenException（权限不足）

```typescript
import { ForbiddenException } from '../common/exceptions/business.exception';

throw new ForbiddenException('您没有权限执行此操作');
throw new ForbiddenException('权限不足', { resource: 'user', action: 'delete' });
```

#### BadRequestException（请求参数错误）

```typescript
import { BadRequestException } from '../common/exceptions/business.exception';

throw new BadRequestException('用户名不能为空');
throw new BadRequestException('参数验证失败', { errors: validationErrors });
```

#### ConflictException（资源冲突）

```typescript
import { ConflictException } from '../common/exceptions/business.exception';

throw new ConflictException('用户名已存在');
throw new ConflictException('资源冲突', { conflictingField: 'username' });
```

#### InternalServerErrorException（服务器内部错误）

```typescript
import { InternalServerErrorException } from '../common/exceptions/business.exception';

throw new InternalServerErrorException('数据库连接失败');
```

#### ValidationException（参数验证失败）

```typescript
import { ValidationException } from '../common/exceptions/business.exception';

throw new ValidationException('参数验证失败', [
  { field: 'username', message: '用户名不能为空' },
  { field: 'email', message: '邮箱格式不正确' },
]);
```

#### DatabaseException（数据库操作失败）

```typescript
import { DatabaseException } from '../common/exceptions/business.exception';

throw new DatabaseException('数据库操作失败', { 
  query: 'SELECT * FROM users',
  error: 'Connection timeout',
});
```

#### ExternalServiceException（外部服务调用失败）

```typescript
import { ExternalServiceException } from '../common/exceptions/business.exception';

throw new ExternalServiceException(
  '第三方API调用失败',
  'PaymentService',
  { apiUrl: 'https://api.payment.com', statusCode: 500 },
);
```

#### TimeoutException（请求超时）

```typescript
import { TimeoutException } from '../common/exceptions/business.exception';

throw new TimeoutException('请求超时', 5000); // 5秒超时
```

#### ResourceLockedException（资源锁定）

```typescript
import { ResourceLockedException } from '../common/exceptions/business.exception';

throw new ResourceLockedException('资源已被其他用户锁定', { 
  resourceId: 123,
  lockedBy: 'user456',
});
```

#### PayloadTooLargeException（请求体过大）

```typescript
import { PayloadTooLargeException } from '../common/exceptions/business.exception';

throw new PayloadTooLargeException('文件大小超过限制', '10MB');
```

#### ServiceUnavailableException（服务不可用）

```typescript
import { ServiceUnavailableException } from '../common/exceptions/business.exception';

throw new ServiceUnavailableException('服务暂时不可用，请稍后重试', 60); // 60秒后重试
```

## 📝 使用示例

### 示例 1: 在 Service 中使用

```typescript
import { Injectable } from '@nestjs/common';
import { NotFoundException, BadRequestException } from '../common/exceptions/business.exception';

@Injectable()
export class UserService {
  async findUserById(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException('用户不存在', { userId: id });
    }
    
    return user;
  }

  async createUser(dto: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({ 
      where: { username: dto.username } 
    });
    
    if (existingUser) {
      throw new BadRequestException('用户名已存在', { username: dto.username });
    }
    
    // 创建用户逻辑...
  }
}
```

### 示例 2: 在 Controller 中使用

```typescript
import { Controller, Get, Param } from '@nestjs/common';
import { NotFoundException } from '../common/exceptions/business.exception';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  async getUser(@Param('id') id: number) {
    try {
      return await this.userService.findUserById(id);
    } catch (error) {
      // 业务异常会自动被全局异常过滤器处理
      throw error;
    }
  }
}
```

## 📊 错误响应格式

所有异常都会返回统一的错误响应格式：

```json
{
  "code": 404,
  "message": "用户不存在",
  "data": {
    "userId": 123
  },
  "timestamp": "2025-12-19T10:30:00.000Z",
  "path": "/api/users/123",
  "method": "GET",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "errorCode": "NOT_FOUND"
}
```

### 响应字段说明

- `code`: HTTP 状态码
- `message`: 错误消息（用户友好）
- `data`: 额外的错误数据（可选）
- `timestamp`: 错误发生时间（ISO 8601 格式）
- `path`: 请求路径
- `method`: HTTP 方法
- `requestId`: 请求唯一标识符（用于日志追踪）
- `errorCode`: 错误代码（用于程序化处理）

### 请求ID追踪

每个请求都会自动生成唯一的请求ID，用于：
- 日志追踪：在日志中搜索特定请求的所有操作
- 问题排查：通过请求ID快速定位问题
- 性能分析：追踪请求的完整生命周期

请求ID会：
- 自动添加到响应头：`X-Request-Id`
- 包含在错误响应中：`requestId` 字段
- 记录在所有日志中：便于关联查询

### 字段说明

- `code`: HTTP 状态码
- `message`: 错误消息
- `data`: 额外的错误数据（可选）
- `timestamp`: 错误发生时间
- `path`: 请求路径（自动添加）
- `method`: 请求方法（自动添加）

## 🔒 安全特性

### 生产环境错误信息隐藏

在生产环境中，500 错误会隐藏敏感信息：

```json
{
  "code": 500,
  "message": "服务器内部错误，请联系管理员",
  "data": null,
  "timestamp": "2025-12-19T10:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 错误日志记录

所有错误都会记录到日志中，包含丰富的上下文信息：

**4xx 错误日志示例**:
```json
{
  "level": "warn",
  "message": "HTTP 404 - 用户不存在 [RequestId: 550e8400-e29b-41d4-a716-446655440000]",
  "context": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "method": "GET",
    "url": "/api/users/123",
    "status": 404,
    "message": "用户不存在",
    "userId": null,
    "username": null,
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0..."
  }
}
```

**5xx 错误日志示例**:
```json
{
  "level": "error",
  "message": "HTTP 500 - 数据库连接失败 [RequestId: 550e8400-e29b-41d4-a716-446655440000]",
  "stack": "Error: Connection timeout\n    at DatabaseService.connect...",
  "context": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "method": "POST",
    "url": "/api/users",
    "status": 500,
    "message": "数据库连接失败",
    "userId": 1,
    "username": "admin",
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0..."
  }
}
```

日志包含的信息：
- **请求ID**: 用于追踪整个请求链路
- **用户信息**: 如果已认证，包含用户ID和用户名
- **请求信息**: 方法、URL、IP地址、User-Agent
- **错误信息**: 状态码、错误消息、堆栈信息（5xx错误）

## 🎨 最佳实践

### 1. 使用合适的异常类型

```typescript
// ✅ 好的做法
throw new NotFoundException('用户不存在');
throw new BadRequestException('参数验证失败');

// ❌ 不好的做法
throw new Error('用户不存在'); // 不会返回统一的错误格式
```

### 2. 提供有用的错误信息

```typescript
// ✅ 好的做法
throw new BadRequestException('用户名已存在', { username: dto.username });

// ❌ 不好的做法
throw new BadRequestException('错误'); // 信息不够具体
```

### 3. 在 Service 层抛出异常

```typescript
// ✅ 好的做法：在 Service 层抛出异常
@Injectable()
export class UserService {
  async findUser(id: number) {
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
  }
}

// Controller 层直接调用，异常会自动处理
@Get(':id')
async getUser(@Param('id') id: number) {
  return await this.userService.findUser(id);
}
```

### 4. 避免在 Controller 中捕获业务异常

```typescript
// ✅ 好的做法：让全局异常过滤器处理
@Get(':id')
async getUser(@Param('id') id: number) {
  return await this.userService.findUser(id);
}

// ❌ 不好的做法：手动处理业务异常
@Get(':id')
async getUser(@Param('id') id: number) {
  try {
    return await this.userService.findUser(id);
  } catch (error) {
    if (error instanceof NotFoundException) {
      return res.status(404).json({ message: error.message });
    }
    throw error;
  }
}
```

## 🎯 异常上下文装饰器

使用 `@ExceptionContext` 装饰器为异常添加业务上下文信息：

```typescript
import { ExceptionContext } from '../common/decorators/exception-context.decorator';

@Controller('users')
export class UserController {
  @Post()
  @ExceptionContext({ module: 'user', operation: 'create', resource: 'user' })
  async createUser(@Body() dto: CreateUserDto) {
    // 如果发生异常，日志中会包含这些上下文信息
    return await this.userService.create(dto);
  }
}
```

上下文信息会自动添加到异常日志中，便于问题定位和分析。

## 🔧 自定义异常

如果需要创建自定义异常，可以继承 `BusinessException`：

```typescript
import { BusinessException, HttpStatus } from '../common/exceptions/business.exception';

export class PaymentException extends BusinessException {
  constructor(message: string, public readonly paymentId?: string) {
    super(
      message,
      HttpStatus.PAYMENT_REQUIRED,
      'PAYMENT_ERROR',
      { paymentId },
    );
  }
}

// 使用
throw new PaymentException('支付失败', 'pay_123456');
```

## 📝 异常处理最佳实践示例

### 示例 1: Service 层异常处理

```typescript
import { Injectable } from '@nestjs/common';
import { 
  NotFoundException, 
  ConflictException,
  DatabaseException 
} from '../common/exceptions/business.exception';

@Injectable()
export class UserService {
  async findUserById(id: number) {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      
      if (!user) {
        throw new NotFoundException('用户不存在', { userId: id });
      }
      
      return user;
    } catch (error) {
      // 如果是业务异常，直接抛出
      if (error instanceof BusinessException) {
        throw error;
      }
      // 数据库错误转换为业务异常
      throw new DatabaseException('查询用户失败', { 
        userId: id,
        originalError: error.message,
      });
    }
  }

  async createUser(dto: CreateUserDto) {
    // 检查用户名是否存在
    const existingUser = await this.userRepository.findOne({ 
      where: { username: dto.username } 
    });
    
    if (existingUser) {
      throw new ConflictException('用户名已存在', { 
        username: dto.username,
        existingUserId: existingUser.id,
      });
    }
    
    try {
      return await this.userRepository.save(dto);
    } catch (error) {
      throw new DatabaseException('创建用户失败', { 
        username: dto.username,
        originalError: error.message,
      });
    }
  }
}
```

### 示例 2: Controller 层异常处理

```typescript
import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ExceptionContext } from '../common/decorators/exception-context.decorator';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  @ExceptionContext({ module: 'user', operation: 'get', resource: 'user' })
  async getUser(@Param('id') id: number) {
    // 不需要 try-catch，让全局异常过滤器处理
    return await this.userService.findUserById(id);
  }

  @Post()
  @ExceptionContext({ module: 'user', operation: 'create', resource: 'user' })
  async createUser(@Body() dto: CreateUserDto) {
    // 业务异常会自动被全局异常过滤器处理
    return await this.userService.createUser(dto);
  }
}
```

### 示例 3: 外部服务调用异常处理

```typescript
import { Injectable } from '@nestjs/common';
import { ExternalServiceException, TimeoutException } from '../common/exceptions/business.exception';
import axios from 'axios';

@Injectable()
export class PaymentService {
  async processPayment(amount: number) {
    try {
      const response = await axios.post('https://api.payment.com/charge', {
        amount,
      }, {
        timeout: 5000, // 5秒超时
      });
      
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new TimeoutException('支付服务响应超时', 5000);
      }
      
      if (error.response) {
        throw new ExternalServiceException(
          '支付服务调用失败',
          'PaymentService',
          {
            statusCode: error.response.status,
            statusText: error.response.statusText,
            responseData: error.response.data,
          },
        );
      }
      
      throw new ExternalServiceException(
        '无法连接到支付服务',
        'PaymentService',
        { originalError: error.message },
      );
    }
  }
}
```

## 📝 注意事项

1. **不要捕获业务异常**: 让全局异常过滤器统一处理
2. **提供有用的错误信息**: 帮助前端和用户理解错误原因
3. **使用合适的 HTTP 状态码**: 遵循 RESTful API 规范
4. **记录详细的错误日志**: 便于问题排查
5. **保护敏感信息**: 生产环境隐藏内部错误详情
6. **使用请求ID追踪**: 通过请求ID快速定位问题
7. **添加异常上下文**: 使用 `@ExceptionContext` 装饰器添加业务上下文
8. **统一异常类型**: 使用项目定义的业务异常类，不要直接抛出 Error

## 🔍 问题排查流程

当遇到错误时，可以按以下流程排查：

1. **查看错误响应**: 获取 `requestId` 和 `errorCode`
2. **搜索日志**: 使用 `requestId` 搜索相关日志
3. **分析上下文**: 查看日志中的用户信息、请求信息等上下文
4. **检查异常链**: 查看完整的异常堆栈信息
5. **验证业务逻辑**: 根据异常类型和上下文信息验证业务逻辑

## 📊 异常统计和监控

建议集成异常监控服务（如 Sentry）来：
- 实时监控异常发生情况
- 统计异常类型和频率
- 设置异常告警规则
- 分析异常趋势和模式

