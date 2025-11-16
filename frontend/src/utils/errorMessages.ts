/**
 * HTTP 状态码对应的友好提示信息
 */
export const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: '请求参数错误',
  401: '未授权,请登录',
  403: '没有权限访问此资源',
  404: '请求的资源不存在',
  405: '请求方法不允许',
  408: '请求超时',
  500: '服务器内部错误',
  502: '网关错误',
  503: '服务暂时不可用',
  504: '网关超时',
};

/**
 * 网络错误代码对应的友好提示信息
 */
export const NETWORK_ERROR_MESSAGES: Record<string, string> = {
  'ECONNABORTED': '请求超时,请稍后重试',
  'ERR_NETWORK': '网络连接失败,请检查网络',
  'ERR_BAD_REQUEST': '请求格式错误',
  'ERR_BAD_RESPONSE': '服务器响应格式错误',
  'ETIMEDOUT': '连接超时',
  'ECONNREFUSED': '连接被拒绝,请确认后端服务是否启动',
};

/**
 * 业务错误码对应的友好提示信息 (根据后端定义)
 */
export const BUSINESS_ERROR_MESSAGES: Record<number, string> = {
  1001: '用户不存在',
  1002: '密码错误',
  1003: '账号已被禁用',
  1004: '验证码错误',
  1005: '验证码已过期',
  2001: '权限不足',
  2002: '操作失败',
  3001: '数据不存在',
  3002: '数据已存在',
};

/**
 * 获取友好的错误提示信息
 */
export function getFriendlyErrorMessage(
  statusCode?: number,
  errorCode?: string,
  defaultMessage?: string
): string {
  if (statusCode && HTTP_STATUS_MESSAGES[statusCode]) {
    return HTTP_STATUS_MESSAGES[statusCode];
  }
  
  if (errorCode && NETWORK_ERROR_MESSAGES[errorCode]) {
    return NETWORK_ERROR_MESSAGES[errorCode];
  }
  
  return defaultMessage || '请求失败,请稍后重试';
}
