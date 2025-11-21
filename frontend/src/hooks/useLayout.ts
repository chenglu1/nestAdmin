/*
 * @Description: Layout 相关自定义 Hook
 */
import { useAuthStore } from '@/stores/authStore';
import { useLayoutStore } from '@/stores/layoutStore';

/**
 * 布局数据加载 Hook
 */
export const useLayoutData = () => {
  const { user, menus, isLoading } = useAuthStore();
  return { user, menus, loading: isLoading };
};

/**
 * 侧边栏状态 Hook
 */
export const useSiderCollapsed = () => {
  const { collapsed, toggleCollapsed } = useLayoutStore();
  return { collapsed, toggleCollapsed };
};

/**
 * 退出登录 Hook
 */
export const useLogout = () => {
  const { logout } = useAuthStore();
  return logout;
};
