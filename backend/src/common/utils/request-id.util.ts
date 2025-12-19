import { randomUUID } from 'crypto';

/**
 * 请求ID工具类
 * 用于生成和追踪请求的唯一标识符
 */
export class RequestIdUtil {
  private static readonly REQUEST_ID_HEADER = 'x-request-id';
  private static readonly REQUEST_ID_KEY = 'requestId';

  /**
   * 生成请求ID
   */
  static generate(): string {
    return randomUUID();
  }

  /**
   * 从请求头获取请求ID，如果没有则生成新的
   */
  static getOrGenerate(request: any): string {
    const headerId = request?.headers?.[this.REQUEST_ID_HEADER];
    if (headerId) {
      return String(headerId);
    }
    return this.generate();
  }

  /**
   * 设置请求ID到请求对象
   */
  static setRequestId(request: any, requestId: string): void {
    if (request) {
      request[this.REQUEST_ID_KEY] = requestId;
    }
  }

  /**
   * 从请求对象获取请求ID
   */
  static getRequestId(request: any): string | undefined {
    return request?.[this.REQUEST_ID_KEY];
  }

  /**
   * 获取请求ID响应头名称
   */
  static getHeaderName(): string {
    return this.REQUEST_ID_HEADER;
  }
}

