/**
 * IP 地址处理工具
 */

/**
 * 获取客户端真实IP地址
 * 优先级: x-forwarded-for > x-real-ip > request.ip
 * 处理 IPv6 回环地址 ::1 转换为 127.0.0.1
 */
export function getClientIp(request: any): string {
  // 1. 从 x-forwarded-for 获取 (代理场景)
  const xForwardedFor = request.headers['x-forwarded-for'];
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',');
    return ips[0].trim();
  }

  // 2. 从 x-real-ip 获取 (Nginx代理)
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
