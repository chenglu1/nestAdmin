/*
 * @Description: Layout 相关类型定义
 */

export interface MenuItem {
  id: number;
  name: string;
  path: string;
  icon?: string;
  children?: MenuItem[];
}

export interface UserProfile {
  id: number;
  username: string;
  nickname?: string;
  email?: string;
  avatar?: string;
  roles?: string[];
  status?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChangePasswordFormData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}
