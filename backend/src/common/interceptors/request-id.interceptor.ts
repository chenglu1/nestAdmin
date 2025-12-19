import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestIdUtil } from '../utils/request-id.util';

/**
 * 请求ID拦截器
 * 为每个请求生成唯一的请求ID，用于日志追踪和错误排查
 */
@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // 获取或生成请求ID
    const requestId = RequestIdUtil.getOrGenerate(request);
    
    // 设置请求ID到请求对象
    RequestIdUtil.setRequestId(request, requestId);
    
    return next.handle();
  }
}

