import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * 业务异常类
 * 用于处理业务逻辑错误，统一错误响应格式
 */
export class BusinessException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly code?: string,
    public readonly data?: any,
  ) {
    super(
      {
        code: statusCode,
        message,
        data: data || null,
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );
  }
}

/**
 * 常用业务异常
 */
export class NotFoundException extends BusinessException {
  constructor(message: string = '资源不存在', data?: any) {
    super(message, HttpStatus.NOT_FOUND, 'NOT_FOUND', data);
  }
}

export class UnauthorizedException extends BusinessException {
  constructor(message: string = '未授权访问', data?: any) {
    super(message, HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', data);
  }
}

export class ForbiddenException extends BusinessException {
  constructor(message: string = '权限不足', data?: any) {
    super(message, HttpStatus.FORBIDDEN, 'FORBIDDEN', data);
  }
}

export class BadRequestException extends BusinessException {
  constructor(message: string = '请求参数错误', data?: any) {
    super(message, HttpStatus.BAD_REQUEST, 'BAD_REQUEST', data);
  }
}

export class ConflictException extends BusinessException {
  constructor(message: string = '资源冲突', data?: any) {
    super(message, HttpStatus.CONFLICT, 'CONFLICT', data);
  }
}

export class InternalServerErrorException extends BusinessException {
  constructor(message: string = '服务器内部错误', data?: any) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, 'INTERNAL_SERVER_ERROR', data);
  }
}

/**
 * 验证异常
 * 用于参数验证失败
 */
export class ValidationException extends BusinessException {
  constructor(message: string = '参数验证失败', errors?: any[]) {
    super(message, HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', { errors });
  }
}

/**
 * 数据库异常
 * 用于数据库操作错误
 */
export class DatabaseException extends BusinessException {
  constructor(message: string = '数据库操作失败', data?: any) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, 'DATABASE_ERROR', data);
  }
}

/**
 * 外部服务异常
 * 用于调用外部API失败
 */
export class ExternalServiceException extends BusinessException {
  constructor(
    message: string = '外部服务调用失败',
    public readonly serviceName?: string,
    data?: any,
  ) {
    super(message, HttpStatus.BAD_GATEWAY, 'EXTERNAL_SERVICE_ERROR', {
      serviceName,
      ...data,
    });
  }
}

/**
 * 超时异常
 * 用于请求超时
 */
export class TimeoutException extends BusinessException {
  constructor(message: string = '请求超时', timeout?: number) {
    super(message, HttpStatus.REQUEST_TIMEOUT, 'TIMEOUT_ERROR', { timeout });
  }
}

/**
 * 资源锁定异常
 * 用于资源被锁定（如乐观锁）
 */
export class ResourceLockedException extends BusinessException {
  constructor(message: string = '资源已被锁定', data?: any) {
    super(message, HttpStatus.LOCKED, 'RESOURCE_LOCKED', data);
  }
}

/**
 * 请求过大异常
 * 用于请求体过大
 */
export class PayloadTooLargeException extends BusinessException {
  constructor(message: string = '请求体过大', maxSize?: string) {
    super(message, HttpStatus.PAYLOAD_TOO_LARGE, 'PAYLOAD_TOO_LARGE', { maxSize });
  }
}

/**
 * 服务不可用异常
 * 用于服务暂时不可用
 */
export class ServiceUnavailableException extends BusinessException {
  constructor(message: string = '服务暂时不可用', retryAfter?: number) {
    super(message, HttpStatus.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE', {
      retryAfter,
    });
  }
}

