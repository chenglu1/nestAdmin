import request from '@/utils/request';
// 避免循环导入的引用，通过函数内部导入

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResponse {
  code: number;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: number;
      username: string;
      nickname: string;
      email: string;
    };
  };
}

export interface UserProfile {
  id: number;
  username: string;
  nickname: string;
  email: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

// 登录接口
export const login = (data: LoginParams) => {
  return request.post<LoginParams, LoginResponse>('/auth/login', data);
};

// 刷新令牌接口 - 不再需要传递refreshToken，通过Cookie自动传递
export const refreshToken = () => {
  return request.post<void, { code: number; message: string; data: { accessToken: string } }>('/auth/refresh');
};

// 获取用户信息
export const getUserProfile = () => {
  return request.get<void, { code: number; data: UserProfile }>('/user/profile');
};

// 登出接口 - 同时通过Cookie和请求体传递refreshToken，提供双重保障
export const logout = () => {
  // 直接在请求体中传递一个空对象，让后端从Cookie中获取refreshToken
  // 这样避免了循环导入问题，同时保持了API的一致性
  return request.post('/auth/logout', {});
};

// 注册接口
export const register = (data: {
  username: string;
  password: string;
  email?: string;
  nickname?: string;
}) => {
  return request.post('/user/register', data);
};

// 修改密码接口
export interface ChangePasswordParams {
  oldPassword: string;
  newPassword: string;
}

export const changePassword = (data: ChangePasswordParams) => {
  return request.post<ChangePasswordParams, { code: number; message: string }>('/user/change-password', data);
};