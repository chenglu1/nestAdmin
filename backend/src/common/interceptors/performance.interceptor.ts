import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
// 修复循环引用问题
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { PerformanceService } from '../../modules/performance/performance.service';
import { getClientIp } from '../utils/ip.util';

const SLOW_REQUEST_THRESHOLD = 1000; // 毫秒

interface PerformanceMetrics {
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  ipAddress: string;
  userAgent: string;
  userId?: number;
  username?: string;
  cpuUsage?: number;
  memoryUsage?: number;
  errorMessage?: string;
}

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);

  constructor(private performanceService: PerformanceService) {}

  /**
   * 安全的JSON序列化方法 - 更健壮的实现，完全避免循环引用问题
   */
  // safeStringify 方法已移除，我们现在使用更安全的估算方法

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    try {
      // 安全地获取HTTP上下文，防止非HTTP请求导致的错误
      if (!context.switchToHttp) {
        return next.handle();
      }
      
      const httpContext = context.switchToHttp();
      if (!httpContext.getRequest) {
        return next.handle();
      }
      
      const request = httpContext.getRequest();
      if (!request) {
        return next.handle();
      }
      
      // 安全地获取请求信息
      const method = request.method || 'UNKNOWN';
      const originalUrl = request.originalUrl || '/unknown';
      
      // 避免解构赋值导致的潜在错误
      let body: any = null;
      let query: any = null;
      let params: any = null;
      let user: any = null;
      
      try {
        body = request.body;
        query = request.query;
        params = request.params;
        user = request.user;
      } catch {
        // 忽略任何获取请求属性时的错误
      }
      
      const startTime = Date.now();
      const startMemory = process.memoryUsage();
      const startCpu = process.cpuUsage();

      // 极其简化的请求数据表示，完全避免任何可能的序列化问题
      const safeRequestData = {
        body: body ? true : false,
        queryCount: query && typeof query === 'object' ? Object.keys(query).length : 0,
        paramsCount: params && typeof params === 'object' ? Object.keys(params).length : 0,
      };

      return next.handle().pipe(
        tap((data) => {
          try {
            // 估算响应大小，完全避免序列化响应数据
            let estimatedResponseSize = 0;
            try {
              if (data === null || data === undefined) {
                estimatedResponseSize = 0;
              } else if (typeof data === 'object') {
                estimatedResponseSize = 1000; // 给一个合理的估算值
              } else {
                estimatedResponseSize = String(data).length;
              }
            } catch {
              estimatedResponseSize = 0;
            }
            
            const metrics = this.buildMetrics(
              method,
              originalUrl,
              200,
              Date.now() - startTime,
              safeRequestData,
              estimatedResponseSize,
              request,
              user,
              startMemory,
              startCpu,
            );
            this.saveMetrics(metrics);
            this.checkSlowRequest(metrics);
          } catch (metricsError: any) {
            // 如果构建指标失败，记录错误但不中断流程
            this.logger.error('构建性能指标失败', metricsError?.message || 'Unknown error');
          }
        }),
        catchError((error) => {
          try {
            // 即使在错误情况下，也尝试构建指标
            const metrics = this.buildMetrics(
              method,
              originalUrl,
              error?.status || 500,
              Date.now() - startTime,
              safeRequestData,
              0,
              request,
              user,
              startMemory,
              startCpu,
              error?.message,
            );
            this.saveMetrics(metrics);
          } catch (metricsError: any) {
            // 如果构建指标失败，记录错误但不中断流程
            this.logger.error('构建错误性能指标失败', metricsError?.message || 'Unknown error');
          }
          return throwError(() => error);
        }),
      );
    } catch (contextError: any) {
      // 如果整个拦截器初始化失败，记录错误并继续处理请求
      this.logger.error('性能拦截器初始化失败', contextError?.message || 'Unknown error');
      return next.handle();
    }
  }

  /**
   * 构建性能指标 - 完全避免序列化复杂对象
   */
  private buildMetrics(
    method: string,
    path: string,
    statusCode: number,
    responseTime: number,
    requestData: any,
    responseSize: number,
    request: any,
    user: any,
    startMemory: NodeJS.MemoryUsage,
    startCpu: NodeJS.CpuUsage,
    errorMessage?: string,
  ): PerformanceMetrics {
    // 安全地计算请求大小，完全避免复杂序列化
    let requestSize = 0;
    try {
      if (requestData && typeof requestData === 'object') {
        if (requestData.body) requestSize += 100; // 估算值
        if (requestData.query) requestSize += 50; // 估算值
        if (requestData.params) requestSize += 30; // 估算值
      }
    } catch {
      requestSize = 0;
    }
    
    // 安全地获取用户信息
    let userId: number | undefined;
    let username: string | undefined;
    try {
      if (user && typeof user === 'object') {
        // 按优先级尝试获取用户ID
        const possibleIds = [user.userId, user.id];
        for (const id of possibleIds) {
          if (id !== undefined && id !== null) {
            const numId = typeof id === 'string' ? parseInt(id, 10) : id;
            if (typeof numId === 'number' && !isNaN(numId)) {
              userId = numId;
              break;
            }
          }
        }
        // 安全地获取用户名
        if (user.username) {
          username = String(user.username);
        }
      }
    } catch {
      // 如果无法获取用户信息，保持为undefined
    }
    
    // 安全地获取其他请求信息
    let ipAddress = '';
    let userAgent = '';
    try {
      ipAddress = getClientIp(request) || '';
      userAgent = request?.headers?.['user-agent'] ? String(request.headers['user-agent']) : '';
    } catch {
      // 如果无法获取请求信息，使用默认值
    }
    
    // 计算资源使用情况
    const endMemory = process.memoryUsage();
    const endCpu = process.cpuUsage(startCpu);
    
    // 只返回必要的指标，完全避免任何可能包含循环引用的对象
    return {
      method: method || '',
      path: path || '',
      statusCode: statusCode || 0,
      responseTime: responseTime || 0,
      requestSize,
      responseSize: responseSize || 0,
      ipAddress,
      userAgent: userAgent.substring(0, 200), // 限制长度
      userId,
      username,
      cpuUsage: parseFloat(((endCpu.user + endCpu.system) / 1000).toFixed(2)),
      memoryUsage: endMemory.heapUsed - startMemory.heapUsed,
      errorMessage: errorMessage ? errorMessage.substring(0, 200) : undefined, // 限制长度
    };
  }

  /**
   * 异步保存性能指标
   */
  private saveMetrics(metrics: PerformanceMetrics): void {
    this.performanceService.create(metrics).catch((error) => {
      this.logger.error('保存性能数据失败:', error);
    });
  }

  /**
   * 检查慢请求并告警
   */
  private checkSlowRequest(metrics: PerformanceMetrics): void {
    if (metrics.responseTime > SLOW_REQUEST_THRESHOLD) {
      this.logger.warn(
        `慢请求告警: ${metrics.method} ${metrics.path} - ${metrics.responseTime}ms`,
      );
    }
  }
}
