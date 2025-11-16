import axios from 'axios';
import { message } from 'antd';

// 创建 axios 实例
const request = axios.create({
  baseURL: 'http://localhost:3000', // 后端 API 地址
  timeout: 10000,
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res = response.data;
    
    // 如果返回的状态码不是 200,则显示错误
    if (res.code && res.code !== 200) {
      const errorMsg = res.message || '请求失败';
      message.error({
        content: errorMsg,
        duration: 3,
      });
      return Promise.reject(new Error(errorMsg));
    }
    
    return res;
  },
  (error) => {
    // 友好的错误提示
    let errorMessage = '请求失败';
    
    if (error.code === 'ECONNABORTED') {
      errorMessage = '请求超时,请稍后重试';
    } else if (error.code === 'ERR_NETWORK') {
      errorMessage = '网络连接失败,请检查网络或确认后端服务是否启动';
    } else if (error.response) {
      // 服务器返回了错误响应
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          errorMessage = data?.message || '请求参数错误';
          break;
        case 401:
          // 如果是登录接口返回 401,显示错误但不跳转
          if (error.config.url?.includes('/auth/login')) {
            errorMessage = data?.message || '用户名或密码错误';
          } else {
            // 其他接口返回 401,说明 token 过期,跳转到登录页
            errorMessage = '登录已过期,请重新登录';
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setTimeout(() => {
              window.location.href = '/login';
            }, 1500);
          }
          break;
        case 403:
          errorMessage = data?.message || '没有权限访问此资源';
          break;
        case 404:
          errorMessage = '请求的资源不存在';
          break;
        case 500:
          errorMessage = '服务器内部错误,请联系管理员';
          break;
        case 502:
          errorMessage = '网关错误,请稍后重试';
          break;
        case 503:
          errorMessage = '服务暂时不可用,请稍后重试';
          break;
        default:
          errorMessage = data?.message || `请求失败 (状态码: ${status})`;
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      errorMessage = '服务器无响应,请检查网络连接或后端服务是否正常运行';
    } else {
      // 请求配置出错
      errorMessage = error.message || '请求配置错误';
    }
    
    // 显示错误提示,增加持续时间确保用户能看到
    message.error({
      content: errorMessage,
      duration: 3, // 持续 3 秒
    });
    
    return Promise.reject(error);
  }
);

export default request;
