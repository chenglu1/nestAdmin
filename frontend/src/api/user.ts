import request from '@/utils/request';

export interface QueryUserParams {
  page?: number;
  limit?: number;
  username?: string;
  email?: string;
  nickname?: string;
  status?: number;
}

export interface UserData {
  username?: string;
  password?: string;
  email?: string;
  nickname?: string;
  status?: number;
}

// 获取用户列表
export const getUserList = (params: QueryUserParams) => {
  return request.get('/user/list', { params });
};

// 删除用户
export const deleteUser = (id: number) => {
  return request.delete(`/user/${id}`);
};

// 更新用户状态
export const updateUserStatus = (id: number, status: number) => {
  return request.patch(`/user/${id}/status`, { status });
};

// 更新用户信息
export const updateUser = (id: number, data: UserData) => {
  return request.patch<UserData, { code: number; message: string }>(`/user/${id}`, data);
};

// 注册用户
export const registerUser = (data: UserData & { password: string }) => {
  return request.post<UserData & { password: string }, { code: number; message: string }>('/user/register', data);
};
