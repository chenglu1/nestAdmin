import request from '@/utils/request';

export interface RoleData {
  id?: number;
  name: string;
  description?: string;
}

// 获取角色列表
export const getRoleList = () => {
  return request.get('/role/list');
};

// 创建角色
export const createRole = (data: RoleData) => {
  return request.post<RoleData, { code: number; message: string }>('/role', data);
};

// 更新角色
export const updateRole = (id: number, data: RoleData) => {
  return request.put<RoleData, { code: number; message: string }>(`/role/${id}`, data);
};

// 删除角色
export const deleteRole = (id: number) => {
  return request.delete(`/role/${id}`);
};

// 给角色分配菜单权限
export const assignMenusToRole = (roleId: number, menuIds: number[]) => {
  return request.post(`/role/${roleId}/menus`, { menuIds });
};

// 获取角色的菜单权限
export const getRoleMenus = (roleId: number) => {
  return request.get(`/role/${roleId}/menus`);
};

// 给用户分配角色
export const assignRolesToUser = (userId: number, roleIds: number[]) => {
  return request.post(`/user/${userId}/roles`, { roleIds });
};

// 获取用户的角色
export const getUserRoles = (userId: number) => {
  return request.get(`/user/${userId}/roles`);
};
