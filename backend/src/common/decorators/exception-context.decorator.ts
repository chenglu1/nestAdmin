import { SetMetadata } from '@nestjs/common';

export const EXCEPTION_CONTEXT_KEY = 'exception_context';

/**
 * 异常上下文装饰器
 * 用于为异常添加额外的上下文信息
 * 
 * @example
 * @ExceptionContext({ module: 'user', operation: 'create' })
 * @Post()
 * async createUser() { }
 */
export const ExceptionContext = (context: {
  module?: string;
  operation?: string;
  resource?: string;
  [key: string]: any;
}) => SetMetadata(EXCEPTION_CONTEXT_KEY, context);

