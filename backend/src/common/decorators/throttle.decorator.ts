import { applyDecorators } from '@nestjs/common';
import { Throttle, SkipThrottle as NestSkipThrottle } from '@nestjs/throttler';

/**
 * 严格限流装饰器
 * 用于登录等敏感接口：10次请求/60秒
 */
export const ThrottleStrict = () =>
  applyDecorators(Throttle({ default: { limit: 10, ttl: 60000 } }));

/**
 * 非常严格限流装饰器
 * 用于密码重置等关键接口：5次请求/60秒
 */
export const ThrottleVeryStrict = () =>
  applyDecorators(Throttle({ default: { limit: 5, ttl: 60000 } }));

/**
 * 自定义限流装饰器
 * @param limit 限制次数
 * @param ttl 时间窗口（毫秒）
 */
export const ThrottleCustom = (limit: number, ttl: number) =>
  applyDecorators(Throttle({ default: { limit, ttl } }));

/**
 * 跳过限流装饰器
 * 用于健康检查等不需要限流的接口
 */
export const SkipThrottle = NestSkipThrottle;

