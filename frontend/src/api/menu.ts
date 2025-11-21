import request from '@/utils/request';

export interface MenuData {
  id?: number;
  name: string;
  path: string;
  component?: string;
  icon?: string;
  parentId?: number;
  order?: number;
  permissions?: string[];
  hidden?: boolean;
}

// 获取菜单树
export const getMenuTree = () => {
  return request.get('/menu/tree');
};

// 获取菜单列表
export const getMenuList = () => {
  return request.get('/menu/list');
};

// 获取当前用户的菜单
export const getUserMenus = () => {
  return request.get('/menu/user');
};

// 创建菜单
export const createMenu = (data: MenuData) => {
  return request.post<MenuData, { code: number; message: string }>('/menu', data);
};

// 更新菜单
export const updateMenu = (id: number, data: MenuData) => {
  return request.put<MenuData, { code: number; message: string }>(`/menu/${id}`, data);
};

// 删除菜单
export const deleteMenu = (id: number) => {
  return request.delete(`/menu/${id}`);
};
