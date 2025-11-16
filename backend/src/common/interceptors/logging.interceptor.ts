import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { LogService } from '../../modules/log/log.service';
import {
  OPERATION_LOG_KEY,
  OperationLogMetadata,
} from '../../modules/log/decorators/operation-log.decorator';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  constructor(
    private reflector: Reflector,
    @Inject(LogService) private logService: LogService,
  ) {}

  /**
   * 获取客户端真实IP地址
   * 优先级: x-forwarded-for > x-real-ip > request.ip
   * 处理 IPv6 回环地址 ::1 转换为 127.0.0.1
   */
  private getClientIp(request: any): string {
    // 1. 尝试从 x-forwarded-for 获取(代理场景)
    const xForwardedFor = request.headers['x-forwarded-for'];
    if (xForwardedFor) {
      // x-forwarded-for 可能包含多个IP,取第一个
      const ips = xForwardedFor.split(',');
      return ips[0].trim();
    }

    // 2. 尝试从 x-real-ip 获取(Nginx代理)
    const xRealIp = request.headers['x-real-ip'];
    if (xRealIp) {
      return xRealIp;
    }

    // 3. 使用 request.ip
    let ip = request.ip || request.connection?.remoteAddress || '';

    // 4. 处理 IPv6 回环地址
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      ip = '127.0.0.1';
    }

    // 5. 移除 IPv6 前缀
    if (ip.startsWith('::ffff:')) {
      ip = ip.substring(7);
    }

    return ip;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
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

    const { method, originalUrl, body, query, params, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const user = request.user; // JWT 解析后的用户信息

    // 获取真实IP地址
    const ip = this.getClientIp(request);

    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (data) => {
        const duration = Date.now() - startTime;

        try {
          await this.logService.create({
            userId: user?.userId,
            username: user?.username,
            module: operationLogMeta.module,
            description: operationLogMeta.description,
            method,
            path: originalUrl,
            params: JSON.stringify({ body, query, params }),
            ip,
            userAgent,
            statusCode: response.statusCode,
            response: JSON.stringify(data),
            duration,
          });
        } catch (error) {
          this.logger.error('保存操作日志失败:', error);
        }
      }),
      catchError(async (error) => {
        const duration = Date.now() - startTime;

        try {
          await this.logService.create({
            userId: user?.userId,
            username: user?.username,
            module: operationLogMeta.module,
            description: operationLogMeta.description,
            method,
            path: originalUrl,
            params: JSON.stringify({ body, query, params }),
            ip,
            userAgent,
            statusCode: error.status || 500,
            response: JSON.stringify({ error: error.message }),
            duration,
          });
        } catch (logError) {
          this.logger.error('保存错误日志失败:', logError);
        }

        throw error;
      }),
    );
  }
}
