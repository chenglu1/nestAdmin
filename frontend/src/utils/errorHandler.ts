import { AxiosError } from 'axios';
import { message } from 'antd';
import { useAuthStore } from '@/stores/authStore';

// 错误消息显示时长（秒）
const MESSAGE_DURATION = 3;

// API 响应接口
export interface ApiResponse {
  message?: string;
  code?: number;
  data?: unknown;
}

// 错误类型枚举
export const ErrorType = {
  NETWORK: 'NETWORK',           // 网络错误
  TIMEOUT: 'TIMEOUT',            // 请求超时
  BUSINESS: 'BUSINESS',          // 业务错误（code !== 200）
  AUTH: 'AUTH',                 // 认证错误（401）
  PERMISSION: 'PERMISSION',      // 权限错误（403）
  NOT_FOUND: 'NOT_FOUND',        // 资源不存在（404）
  SERVER: 'SERVER',              // 服务器错误（5xx）
  UNKNOWN: 'UNKNOWN',            // 未知错误
} as const;

export type ErrorType = typeof ErrorType[keyof typeof ErrorType];

// 错误信息接口
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  code?: number;
  status?: number;
  originalError?: AxiosError | Error | unknown;
}

// HTTP 状态码对应的错误信息映射
const HTTP_ERROR_MESSAGES: Record<number, (data?: ApiResponse) => string> = {
  400: (data) => data?.message || '请求参数错误',
  401: (data) => data?.message || '用户名或密码错误',
  403: (data) => data?.message || '没有权限访问此资源',
  404: () => '请求的资源不存在',
  500: (data) => data?.message || '服务器内部错误，请联系管理员',
  502: () => '网关错误，请稍后重试',
  503: () => '服务暂时不可用，请稍后重试',
  504: () => '网关超时，请稍后重试',
};

// 需要静默处理的接口（不显示错误提示）
const SILENT_ERROR_PATHS = [
  '/auth/login',      // 登录接口由组件自己处理错误
  '/auth/refresh',     // 刷新token接口静默处理
];

/**
 * 判断是否需要静默处理错误
 */
function shouldSilentError(url?: string): boolean {
  if (!url) return false;
  return SILENT_ERROR_PATHS.some(path => url.includes(path));
}

/**
 * 解析错误类型
 */
function parseErrorType(error: AxiosError): ErrorType {
  // 网络错误
  if (error.code === 'ERR_NETWORK' || !error.response) {
    return ErrorType.NETWORK;
  }

  // 请求超时
  if (error.code === 'ECONNABORTED') {
    return ErrorType.TIMEOUT;
  }

  const status = error.response.status;

  // 认证错误
  if (status === 401) {
    return ErrorType.AUTH;
  }

  // 权限错误
  if (status === 403) {
    return ErrorType.PERMISSION;
  }

  // 资源不存在
  if (status === 404) {
    return ErrorType.NOT_FOUND;
  }

  // 服务器错误
  if (status >= 500) {
    return ErrorType.SERVER;
  }

  return ErrorType.UNKNOWN;
}

/**
 * 获取错误信息
 */
export function getErrorInfo(error: AxiosError | Error): ErrorInfo {
  // 处理 Axios 错误
  if ('isAxiosError' in error && error.isAxiosError) {
    const axiosError = error as AxiosError<ApiResponse>;
    const type = parseErrorType(axiosError);
    let errorMessage = '请求失败';

    // 网络错误
    if (type === ErrorType.NETWORK) {
      errorMessage = '网络连接失败，请检查网络或确认后端服务是否启动';
    }
    // 请求超时
    else if (type === ErrorType.TIMEOUT) {
      errorMessage = '请求超时，请稍后重试';
    }
    // HTTP 错误
    else if (axiosError.response) {
      const { status, data } = axiosError.response;
      const getMessage = HTTP_ERROR_MESSAGES[status];
      errorMessage = getMessage ? getMessage(data) : `请求失败 (状态码: ${status})`;
    }
    // 请求已发送但无响应
    else if (axiosError.request) {
      errorMessage = '服务器无响应，请检查网络连接或后端服务是否正常运行';
    }

    return {
      type,
      message: errorMessage,
      code: (axiosError.response?.data as ApiResponse)?.code,
      status: axiosError.response?.status,
      originalError: axiosError,
    };
  }

  // 处理普通错误
  return {
    type: ErrorType.UNKNOWN,
    message: error.message || '未知错误',
    originalError: error,
  };
}

/**
 * 处理业务错误（code !== 200）
 */
export function handleBusinessError(response: ApiResponse): ErrorInfo {
  const errorMessage = response.message || '请求失败';
  
  return {
    type: ErrorType.BUSINESS,
    message: errorMessage,
    code: response.code,
    originalError: response,
  };
}

/**
 * 显示错误提示
 */
export function showError(errorInfo: ErrorInfo, silent = false): void {
  if (silent) {
    return;
  }

  // 检查是否需要静默处理
  const axiosError = errorInfo.originalError as AxiosError | undefined;
  if (axiosError?.config?.url && shouldSilentError(axiosError.config.url)) {
    return;
  }

  message.error({
    content: errorInfo.message,
    duration: MESSAGE_DURATION,
  });
}

/**
 * 统一错误处理函数
 * @param error 错误对象
 * @param options 配置选项
 * @returns 错误信息对象
 */
export function handleError(
  error: AxiosError | Error,
  options: {
    silent?: boolean;           // 是否静默处理（不显示提示）
    showMessage?: boolean;     // 是否显示错误提示（默认 true）
    customHandler?: (errorInfo: ErrorInfo) => void; // 自定义处理函数
  } = {}
): ErrorInfo {
  const { silent = false, showMessage = true, customHandler } = options;

  // 获取错误信息
  const errorInfo = getErrorInfo(error);

  // 自定义处理
  if (customHandler) {
    customHandler(errorInfo);
  }

  // 显示错误提示
  if (showMessage && !silent) {
    showError(errorInfo, silent);
  }

  // 记录错误日志
  console.error('API Error:', {
    type: errorInfo.type,
    message: errorInfo.message,
    code: errorInfo.code,
    status: errorInfo.status,
    error: errorInfo.originalError,
  });

  return errorInfo;
}

/**
 * 处理认证错误（401）
 */
export async function handleAuthError(error: AxiosError): Promise<string> {
  const isLoginApi = error.config?.url?.includes('/auth/login');
  const isRefreshApi = error.config?.url?.includes('/auth/refresh');

  // 登录接口错误，返回错误消息
  if (isLoginApi) {
    return (error.response?.data as ApiResponse)?.message || '用户名或密码错误';
  }

  // 刷新token接口失败，执行登出
  if (isRefreshApi) {
    try {
      const { logout } = useAuthStore.getState();
      if (typeof logout === 'function') {
        logout();
      }
    } catch (err) {
      console.error('Failed to logout after refresh token error:', err);
    }

    setTimeout(() => {
      window.location.href = '/login';
    }, 1500);

    return '登录已过期，请重新登录';
  }

  // 其他401错误，尝试刷新token
  try {
    const { refreshTokens } = useAuthStore.getState();
    if (typeof refreshTokens === 'function') {
      await refreshTokens();
      return 'Token 已自动刷新，请重试';
    }
  } catch (err) {
    console.error('Failed to refresh token:', err);
  }

  return '登录已过期，请重新登录';
}

