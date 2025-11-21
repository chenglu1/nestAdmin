import axios, { AxiosError } from 'axios';
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
});

// 请求拦截器 - 添加 token
request.interceptors.request.use(
  (config) => {
    // 先尝试从store获取token
    try {
    const { token } = useAuthStore.getState();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    }
  } catch {
    // 如果store还未初始化，从localStorage获取
    console.log('Store not initialized yet, using localStorage');
  }
    
    // fallback到localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * 处理 401 错误 - 区分登录接口和其他接口
 */
function handle401Error(error: AxiosError): string {
  const isLoginApi = error.config?.url?.includes('/auth/login');
  
  if (isLoginApi) {
    return (error.response?.data as ApiResponse)?.message || '用户名或密码错误';
  }
  
  // Token 过期，使用store进行登出或清除本地数据
  try {
      const { logout } = useAuthStore.getState();
      if (typeof logout === 'function') {
        logout();
      }
    } catch {
      // 如果store未初始化，直接清除localStorage
      console.log('Store not initialized yet, clearing localStorage');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  
  setTimeout(() => {
    window.location.href = '/login';
  }, 1500);
  
  return '登录已过期,请重新登录';
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
      return handle401Error(error);
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
  (error: AxiosError) => {
    const errorMessage = getErrorMessage(error);
    message.error({ content: errorMessage, duration: MESSAGE_DURATION });
    return Promise.reject(error);
  }
);

export default request;
