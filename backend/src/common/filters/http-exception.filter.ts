import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorResponse {
  code: number;
  message: string;
  data: null;
  timestamp: string;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception.getStatus();
    const message = this.extractMessage(exception.getResponse());

    this.logger.error(`HTTP ${status} - ${message}`, exception.stack);

    const errorResponse: ErrorResponse = {
      code: status,
      message,
      data: null,
      timestamp: new Date().toISOString(),
    };

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
