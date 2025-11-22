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
   * 安全的JSON序列化方法 - 更健壮的实现
   */
  private safeStringify(obj: any): string {
    // 快速处理常见的简单类型
    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';
    if (typeof obj !== 'object') return JSON.stringify(obj);
    
    // 使用WeakMap来跟踪已经处理过的对象，避免循环引用
    const seen = new WeakMap<any, boolean>();
    
    // 创建一个简化对象的递归函数
    const simplify = (value: any): any => {
      // 基本类型直接返回
      if (value === null || typeof value !== 'object') return value;
      
      // 检查是否已经处理过这个对象
      if (seen.has(value)) return '[CircularReference]';
      
      // 标记这个对象已经处理过
      seen.set(value, true);
      
      // 处理问题对象类型
      const constructorName = value.constructor?.name;
      if (constructorName && [
        'Socket', 'HTTPParser', 'ServerResponse', 'IncomingMessage',
        'Stream', 'Buffer', 'EventEmitter', 'Function', 'Promise',
        'RegExp', 'Date', 'Map', 'Set'
      ].includes(constructorName)) {
        return `[${constructorName}]`;
      }
      
      // 处理数组
      if (Array.isArray(value)) {
        // 限制数组长度，避免过大的数据
        if (value.length > 10) {
          return `[Array(${value.length})]`;
        }
        return value.map(item => simplify(item));
      }
      
      // 处理普通对象
      const simplifiedObj: Record<string, any> = {};
      const keys = Object.keys(value).slice(0, 10); // 只处理前10个属性
      
      for (const key of keys) {
        // 跳过问题键名
        if (['_events', '_eventsCount', '_maxListeners', 'socket', 'parser', 
             'res', 'req', 'buffer', 'stack', '__proto__'].includes(key)) {
          simplifiedObj[key] = '[Skipped]';
          continue;
        }
        
        try {
          simplifiedObj[key] = simplify(value[key]);
        } catch (e) {
          simplifiedObj[key] = '[Error]';
        }
      }
      
      // 如果对象有更多属性，添加标记
      if (Object.keys(value).length > 10) {
        simplifiedObj['_moreProps'] = Object.keys(value).length - 10;
      }
      
      return simplifiedObj;
    };
    
    try {
      // 使用简化函数处理对象
      const simplified = simplify(obj);
      return JSON.stringify(simplified);
    } catch (error) {
      // 终极兜底：如果所有方法都失败，返回一个完全静态的字符串
      return '{"error":"Serialization failed"}';
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, originalUrl, body, query, params } = request;
    const user = request.user;
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    const startCpu = process.cpuUsage();

    // 预处理请求数据，避免循环引用
    const safeRequestData = {
      body: body ? 'request-body-data' : undefined,
      query: typeof query === 'object' ? Object.keys(query).length : 0,
      params: typeof params === 'object' ? Object.keys(params).length : 0,
    };

    return next.handle().pipe(
      tap((data) => {
        const metrics = this.buildMetrics(
          method,
          originalUrl,
          200,
          Date.now() - startTime,
          safeRequestData,
          this.safeStringify(data).length,
          request,
          user,
          startMemory,
          startCpu,
        );
        this.saveMetrics(metrics);
        this.checkSlowRequest(metrics);
      }),
      catchError((error) => {
        const metrics = this.buildMetrics(
          method,
          originalUrl,
          error.status || 500,
          Date.now() - startTime,
          safeRequestData,
          0,
          request,
          user,
          startMemory,
          startCpu,
          error.message,
        );
        this.saveMetrics(metrics);
        return throwError(() => error);
      }),
    );
  }

  /**
   * 构建性能指标
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
    const endMemory = process.memoryUsage();
    const endCpu = process.cpuUsage(startCpu);

    return {
      method,
      path,
      statusCode,
      responseTime,
      requestSize: this.safeStringify(requestData).length,
      responseSize,
      ipAddress: getClientIp(request),
      userAgent: request.headers?.['user-agent'] || '',
      // 修复用户属性访问，支持JWT默认的sub和username
      userId: user?.userId || user?.id || (user?.sub && typeof user.sub === 'number' ? user.sub : (user?.sub && typeof user.sub === 'string' ? parseInt(user.sub, 10) : undefined)),
      username: user?.username,
      cpuUsage: parseFloat(
        ((endCpu.user + endCpu.system) / 1000).toFixed(2),
      ),
      memoryUsage: endMemory.heapUsed - startMemory.heapUsed,
      errorMessage,
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
