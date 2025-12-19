import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { BusinessException } from '../exceptions/business.exception';
import { RequestIdUtil } from '../utils/request-id.util';

interface ErrorResponse {
  code: number;
  message: string;
  data: any;
  timestamp: string;
  path?: string;
  method?: string;
  requestId?: string;
  errorCode?: string;
}

/**
 * 全局异常过滤器
 * 统一处理所有异常，包括 HttpException 和其他未捕获的异常
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 获取或生成请求ID
    const requestId = RequestIdUtil.getOrGenerate(request);
    RequestIdUtil.setRequestId(request, requestId);

    // 设置请求ID响应头
    response.setHeader(RequestIdUtil.getHeaderName(), requestId);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';
    let code = 'INTERNAL_SERVER_ERROR';
    let data: any = null;

    // 获取用户信息（如果已认证）
    const user = (request as any)?.user;
    const userId = user?.userId || user?.id || user?.sub;
    const username = user?.username;

    // 处理业务异常
    if (exception instanceof BusinessException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;
      message = exceptionResponse.message || exception.message;
      code = exception.code || String(status);
      data = exception.data || null;
    }
    // 处理 HttpException
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = this.extractMessage(exceptionResponse);
      code = String(status);
      
      // 如果是业务异常格式，提取 code 和 data
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, any>;
        if (responseObj.code) {
          code = String(responseObj.code);
        }
        if (responseObj.data !== undefined) {
          data = responseObj.data;
        }
      }
    }
    // 处理其他未捕获的异常
    else if (exception instanceof Error) {
      message = exception.message || '服务器内部错误';
      this.logger.error(
        `未捕获的异常: ${message}`,
        exception.stack,
        `${request.method} ${request.url}`,
      );
    }
    // 处理未知类型的异常
    else {
      this.logger.error(
        `未知类型的异常: ${JSON.stringify(exception)}`,
        undefined,
        `${request.method} ${request.url}`,
      );
    }

    // 构建日志上下文
    const logContext = {
      requestId,
      method: request.method,
      url: request.url,
      status,
      message,
      userId,
      username,
      ip: request.ip || request.headers['x-forwarded-for'] || request.connection.remoteAddress,
      userAgent: request.headers['user-agent'],
    };

    // 记录错误日志（排除 404 等常见错误）
    if (status >= 500) {
      this.logger.error(
        `HTTP ${status} - ${message} [RequestId: ${requestId}]`,
        exception instanceof Error ? exception.stack : undefined,
        JSON.stringify(logContext),
      );
    } else if (status >= 400) {
      this.logger.warn(
        `HTTP ${status} - ${message} [RequestId: ${requestId}]`,
        JSON.stringify(logContext),
      );
    }

    const errorResponse: ErrorResponse = {
      code: status,
      message,
      data,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId,
      errorCode: code,
    };

    // 生产环境隐藏敏感错误信息
    if (process.env.NODE_ENV === 'production' && status >= 500) {
      errorResponse.message = '服务器内部错误，请联系管理员';
      errorResponse.data = null;
    }

    response.status(status).json(errorResponse);
  }

  /**
   * 从异常对象中提取错误信息
   */
  private extractMessage(exceptionResponse: unknown): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const { message, error } = exceptionResponse as Record<string, any>;
      return message || error || '请求失败';
    }

    return '请求失败';
  }
}
