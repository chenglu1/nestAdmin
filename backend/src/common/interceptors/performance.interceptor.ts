import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { PerformanceService } from '../../modules/performance/performance.service';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);

  constructor(private performanceService: PerformanceService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    const { method, originalUrl, headers, ip, body, query, params } = request;
    const userAgent = headers['user-agent'] || '';
    const user = request.user; // JWT 用户信息

    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    const startCpu = process.cpuUsage();

    return next.handle().pipe(
      tap(async (data) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // 计算资源使用
        const endMemory = process.memoryUsage();
        const endCpu = process.cpuUsage(startCpu);
        const memoryUsed = endMemory.heapUsed - startMemory.heapUsed;
        const cpuUsed = (endCpu.user + endCpu.system) / 1000; // 微秒转毫秒

        // 计算请求/响应大小
        const requestSize = JSON.stringify({ body, query, params }).length;
        const responseSize = JSON.stringify(data).length;

        try {
          // 记录性能数据
          await this.performanceService.create({
            method,
            path: originalUrl,
            statusCode: response.statusCode,
            responseTime,
            requestSize,
            responseSize,
            ipAddress: this.getClientIp(request),
            userAgent,
            userId: user?.userId,
            username: user?.username,
            cpuUsage: parseFloat(cpuUsed.toFixed(2)),
            memoryUsage: memoryUsed,
          });

          // 慢查询告警 (>1秒)
          if (responseTime > 1000) {
            this.logger.warn(
              `慢请求告警: ${method} ${originalUrl} - ${responseTime}ms`,
            );
          }
        } catch (error) {
          this.logger.error('保存性能数据失败:', error);
        }
      }),
      catchError(async (error) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        try {
          await this.performanceService.create({
            method,
            path: originalUrl,
            statusCode: error.status || 500,
            responseTime,
            requestSize: JSON.stringify({ body, query, params }).length,
            responseSize: 0,
            ipAddress: this.getClientIp(request),
            userAgent,
            userId: user?.userId,
            username: user?.username,
            errorMessage: error.message,
          });
        } catch (logError) {
          this.logger.error('保存错误性能数据失败:', logError);
        }

        return throwError(() => error);
      }),
    );
  }

  private getClientIp(request: any): string {
    const xForwardedFor = request.headers['x-forwarded-for'];
    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim();
    }
    const xRealIp = request.headers['x-real-ip'];
    if (xRealIp) {
      return xRealIp;
    }
    let ip = request.ip || request.connection?.remoteAddress || '';
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      ip = '127.0.0.1';
    }
    if (ip.startsWith('::ffff:')) {
      ip = ip.substring(7);
    }
    return ip;
  }
}
