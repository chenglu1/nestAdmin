import request from '@/utils/request';

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

// 刷新令牌接口
export const refreshToken = (refreshToken: string) => {
  return request.post<void, { code: number; message: string; data: { accessToken: string; refreshToken: string } }>('/auth/refresh', { refreshToken });
};

// 获取用户信息
export const getUserProfile = () => {
  return request.get<void, { code: number; data: UserProfile }>('/user/profile');
};

// 登出接口
export const logout = (refreshToken?: string) => {
  return request.post('/auth/logout', refreshToken ? { refreshToken } : undefined);
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