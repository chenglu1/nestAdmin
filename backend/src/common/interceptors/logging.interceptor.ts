import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { LogService } from '../../modules/log/log.service';
import {
  OPERATION_LOG_KEY,
  OperationLogMetadata,
} from '../../modules/log/decorators/operation-log.decorator';
import { getClientIp } from '../utils/ip.util';

interface LogContext {
  userId?: number;
  username?: string;
  module: string;
  description: string;
  method: string;
  path: string;
  params: string;
  ip: string;
  userAgent: string;
  duration: number;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);
  
  /**
   * 安全的JSON序列化方法，避免循环引用问题
   */
  private safeStringify(obj: any): string {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    });
  }

  constructor(
    private reflector: Reflector,
    @Inject(LogService) private logService: LogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();

    // 获取装饰器元数据
    const operationLogMeta = this.reflector.get<OperationLogMetadata>(
      OPERATION_LOG_KEY,
      handler,
    );

    // 如果没有 @OperationLog 装饰器,跳过日志记录
    if (!operationLogMeta) {
      return next.handle();
    }

    const startTime = Date.now();
    const logContext = this.buildLogContext(request, operationLogMeta);

    return next.handle().pipe(
      tap((data) => {
        this.saveLog({
          ...logContext,
          statusCode: 200,
          response: this.safeStringify(data),
          duration: Date.now() - startTime,
        });
      }),
      catchError((error) => {
        this.saveLog({
          ...logContext,
          statusCode: error.status || 500,
          response: this.safeStringify({ error: error.message }),
          duration: Date.now() - startTime,
        });
        return throwError(() => error);
      }),
    );
  }

  /**
   * 构建日志上下文信息
   */
  private buildLogContext(
    request: any,
    meta: OperationLogMetadata,
  ): Omit<LogContext, 'statusCode' | 'response' | 'duration'> {
    const { method, originalUrl, body, query, params, headers } = request;
    const user = request.user;

    return {
      userId: user?.userId,
      username: user?.username,
      module: meta.module,
      description: meta.description,
      method,
      path: originalUrl,
      params: this.safeStringify({ body, query, params }),
      ip: getClientIp(request),
      userAgent: headers['user-agent'] || '',
    };
  }

  /**
   * 异步保存日志
   */
  private saveLog(context: LogContext & { statusCode: number; response: string }) {
    this.logService.create(context).catch((error) => {
      this.logger.error('保存操作日志失败:', error);
    });
  }
}
