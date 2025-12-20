import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { handleError, handleBusinessError, handleAuthError, type ApiResponse } from './errorHandler';

// 聊天API配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// 聊天API配置
const CHAT_API_URL = `${API_BASE_URL}/chatanywhere/chat`;

// 聊天消息类型定义
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// 聊天请求参数
export interface ChatRequestParams {
  messages: ChatMessage[];
  model?: string;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

// 聊天响应数据
export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    logprobs: null;
    finish_reason: string | null;
  }[];
  system_fingerprint: string;
}

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


// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res = response.data;
    
    // 仅当状态码为 200 才认为成功
    if (res.code === 200) {
      return res;
    }
    
    // 处理业务错误（code !== 200）
    const errorInfo = handleBusinessError(res);
    
    // 构造错误对象
    const error = new Error(errorInfo.message) as Error & { 
      response?: { status?: number; data?: ApiResponse }; 
      config?: object;
      errorInfo?: typeof errorInfo;
    };
    error.response = { status: res.code, data: res };
    error.config = response.config;
    error.errorInfo = errorInfo;
    
    // 统一错误处理（会自动判断是否需要显示提示）
    handleError(error, {
      showMessage: true, // 显示错误提示
    });
    
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
      } catch (refreshError) {
        // 刷新token失败，处理认证错误
        await handleAuthError(error);
        
        // 静默处理刷新token的错误，避免重复提示
        handleError(refreshError as AxiosError, {
          silent: true,
        });
        
        // 显示认证错误提示
        handleError(error, {
          showMessage: true,
        });
        
        return Promise.reject(error);
      } finally {
        refreshTokenPromise = null;
      }
    }
    
    // 处理其他错误
    handleError(error, {
      showMessage: true,
    });
    
    return Promise.reject(error);
  }
);

/**
 * 发送聊天请求
 * @param params 聊天请求参数
 * @param onChunk 流式响应回调函数
 * @returns Promise<Response> 响应对象
 */
export const sendChatRequest = async (
  params: ChatRequestParams,
  onChunk?: (chunk: ChatResponse) => void,
  signal?: AbortSignal
): Promise<Response> => {
  // 从authStore中获取token
  const { token } = useAuthStore.getState();
  
  // 确保stream参数为true
  const requestParams = {
    ...params,
    stream: true
  };
  
  const response = await fetch(CHAT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    credentials: 'include',
    body: JSON.stringify({
      model: requestParams.model || 'gpt-3.5-turbo',
      messages: requestParams.messages,
      stream: requestParams.stream,
      temperature: requestParams.temperature || 0.7,
      max_tokens: requestParams.max_tokens || 1000,
    }),
    signal, // 添加 AbortSignal 支持
  });

  if (!response.ok) {
    throw new Error(`Chat API request failed with status: ${response.status}`);
  }

  // 如果是流式响应且提供了回调函数，则处理流式数据
  if (params.stream && onChunk && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      // 解码当前获取的数据块
      let chunk = '';
      if (value) {
        chunk = decoder.decode(value, { stream: !done });
      } else if (done) {
        // 流结束时，获取可能剩余的解码数据
        chunk = decoder.decode();
      }
      
      // 将新数据添加到缓冲区
      buffer += chunk;
      
      // 处理缓冲区中的完整SSE事件
      let lineEndIndex;
      while ((lineEndIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.substring(0, lineEndIndex);
        buffer = buffer.substring(lineEndIndex + 1);
        
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          continue;
        }

        if (trimmedLine === 'data: [DONE]') {
          continue;
        }

        if (trimmedLine.startsWith('data: ')) {
          try {
            const jsonStr = trimmedLine.slice(6);
            const data = JSON.parse(jsonStr) as ChatResponse;
            // 直接调用回调函数，确保实时处理
            onChunk(data);
          } catch (error) {
            console.error('Error parsing SSE data:', error);
            console.error('Failed line:', trimmedLine);
            // 即使解析失败，也要继续处理后续数据
          }
        }
      }
      
      if (done) {
        // 处理流结束时缓冲区中可能剩余的完整事件
        if (buffer.trim()) {
          // 如果缓冲区中还有数据，尝试作为完整事件处理
          try {
            if (buffer.startsWith('data: ')) {
              const jsonStr = buffer.slice(6);
              const data = JSON.parse(jsonStr) as ChatResponse;
              onChunk(data);
            }
          } catch (error) {
            console.error('Error parsing final SSE data:', error);
            console.error('Final buffer:', buffer);
          }
        }
        break;
      }
    }
  }

  return response;
};

export default request;
