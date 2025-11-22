import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { useAuthStore } from '@/stores/authStore';

// 根据环境使用不同的API地址
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const MESSAGE_DURATION = 3; // 秒

// 响应数据接口
interface ApiResponse {
  message?: string;
  code?: number;
}

// HTTP 状态码对应的错误信息映射
const HTTP_ERROR_MESSAGES: Record<number, (data?: ApiResponse) => string> = {
  400: (data) => data?.message || '请求参数错误',
  401: (data) => data?.message || '用户名或密码错误',
  403: (data) => data?.message || '没有权限访问此资源',
  404: () => '请求的资源不存在',
  500: (data) => data?.message || '服务器内部错误,请联系管理员',
  502: () => '网关错误,请稍后重试',
  503: () => '服务暂时不可用,请稍后重试',
};

// 创建 axios 实例
const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // 允许跨域携带Cookie，确保refreshToken能从Cookie中自动传递
  headers: {
    'Content-Type': 'application/json'
  }
});

// 用于存储正在刷新token的Promise
let refreshTokenPromise: Promise<string> | null = null;

// 请求拦截器 - 添加 token
request.interceptors.request.use(
  (config) => {
    try {
      // 从store获取token
      const { token } = useAuthStore.getState();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to get token from auth store:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * 执行刷新令牌操作 - 现在refreshToken通过Cookie自动传递
 */
async function doRefreshToken(): Promise<string> {
  try {
    // 直接使用axios实例而不是request，避免触发拦截器循环调用
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      {}, // 不再需要手动传递refreshToken
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true, // 确保浏览器发送Cookie
      }
    );
    
    const { accessToken } = response.data.data;
    
    // 更新auth store中的token
    try {
      const { updateToken } = useAuthStore.getState();
      if (typeof updateToken === 'function') {
        updateToken(accessToken);
      }
    } catch (error) {
      console.error('Failed to update token in auth store:', error);
    }
    
    return accessToken;
  } catch (error) {
    // 刷新失败，清除用户数据
    try {
      const { logout } = useAuthStore.getState();
      if (typeof logout === 'function') {
        logout();
      }
    } catch (error) {
      console.error('Failed to logout after token refresh failure:', error);
    }
    
    throw error;
  }
}

/**
 * 处理 401 错误 - 区分登录接口和其他接口
 */
async function handle401Error(error: AxiosError): Promise<string> {
  const isLoginApi = error.config?.url?.includes('/auth/login');
  const isRefreshApi = error.config?.url?.includes('/auth/refresh');
  
  if (isLoginApi) {
    return (error.response?.data as ApiResponse)?.message || '用户名或密码错误';
  }
  
  if (isRefreshApi) {
    // 刷新令牌本身也失败了，说明refresh token已过期或无效
    try {
      const { logout } = useAuthStore.getState();
      if (typeof logout === 'function') {
        logout();
      }
    } catch (error) {
      console.error('Failed to logout after refresh token error:', error);
    }
    
    setTimeout(() => {
      window.location.href = '/login';
    }, 1500);
    
    return '登录已过期,请重新登录';
  }
  
  // 尝试刷新令牌（refreshToken通过Cookie自动传递）
  try {
    // 使用Promise来确保只刷新一次
    if (!refreshTokenPromise) {
      refreshTokenPromise = doRefreshToken();
    }
    
    await refreshTokenPromise;
    return 'Token 已自动刷新，请重试';
  } finally {
    // 无论成功失败，都清除刷新Promise
    refreshTokenPromise = null;
  }
}

/**
 * 获取 HTTP 错误信息
 */
function getErrorMessage(error: AxiosError): string {
  if (error.code === 'ECONNABORTED') {
    return '请求超时,请稍后重试';
  }
  
  if (error.code === 'ERR_NETWORK') {
    return '网络连接失败,请检查网络或确认后端服务是否启动';
  }
  
  if (error.response) {
    const { status, data } = error.response;
    
    if (status === 401) {
      // 401错误由响应拦截器异步处理，这里返回默认错误信息
      return (data as ApiResponse)?.message || '登录已过期,请重新登录';
    }
    
    const getMessage = HTTP_ERROR_MESSAGES[status];
    return getMessage ? getMessage(data as ApiResponse) : `请求失败 (状态码: ${status})`;
  }
  
  if (error.request) {
    return '服务器无响应,请检查网络连接或后端服务是否正常运行';
  }
  
  return error.message || '请求配置错误';
}

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res = response.data;
    
    // 仅当状态码为 200 才认为成功
    if (res.code === 200) {
      return res;
    }
    
    // 显示错误信息
    const errorMsg = res.message || '请求失败';
    message.error({ content: errorMsg, duration: MESSAGE_DURATION });
    
    // 构造错误对象传递给错误处理器
    const error = new Error(errorMsg) as Error & { response?: { status?: number; data?: ApiResponse }, config?: object };
    error.response = { status: res.code, data: res };
    error.config = response.config;
    
    return Promise.reject(error);
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // 处理401错误，尝试自动刷新token
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !originalRequest.url?.includes('/auth/login')) {
      originalRequest._retry = true;
      
      try {
        // 如果正在刷新token，将请求加入队列
        if (!refreshTokenPromise) {
          refreshTokenPromise = doRefreshToken();
        }
        
        const newToken = await refreshTokenPromise;
        
        // 更新请求头中的token
        if (!originalRequest.headers) {
          originalRequest.headers = {};
        }
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        // 重试原始请求
        return request(originalRequest);
      } catch {
        // 刷新token失败，处理错误
        const errorMessage = await handle401Error(error);
        message.error({ content: errorMessage, duration: MESSAGE_DURATION });
        return Promise.reject(error);
      } finally {
        refreshTokenPromise = null;
      }
    }
    
    // 处理其他错误
    const errorMessage = getErrorMessage(error);
    message.error({ content: errorMessage, duration: MESSAGE_DURATION });
    return Promise.reject(error);
  }
);

export default request;
