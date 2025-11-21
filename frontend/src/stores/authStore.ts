import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AxiosError } from 'axios';
import { login as apiLogin, getUserProfile } from '@/api/auth';
import { getUserMenus } from '@/api/menu';
import type { UserProfile } from '@/api/auth';
import type { MenuItem } from '@/layout/types';

interface AuthState {
  // 用户相关
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // 菜单相关
  menus: MenuItem[];
  menusLoading: boolean;
  
  // Actions
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUserProfile: () => Promise<void>;
  fetchMenus: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      menus: [],
      menusLoading: false,

      // 登录
      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiLogin({ username, password });
          const { token, user } = response.data;
          
          set({
            token,
            user: user as UserProfile,
            isAuthenticated: true,
            isLoading: false
          });
          
          // 登录成功后获取菜单
          get().fetchMenus();
        } catch (error: unknown) {
          set({
            isLoading: false,
            error: (error as AxiosError<{ message?: string }>)?.response?.data?.message || '登录失败，请重试'
          });
          throw error; // 向上抛出错误，让组件可以捕获
        }
      },

      // 退出登录
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          menus: []
        });
      },

      // 刷新用户信息
      refreshUserProfile: async () => {
        try {
          const response = await getUserProfile();
          set({ user: response.data });
        } catch (error) {
          console.error('刷新用户信息失败:', error);
          // 如果获取失败，可能是token失效，执行登出
          get().logout();
        }
      },

      // 获取菜单
      fetchMenus: async () => {
        set({ menusLoading: true });
        try {
          const response = await getUserMenus();
          set({ menus: response.data, menusLoading: false });
        } catch (error) {
          console.error('获取菜单失败:', error);
          set({ menusLoading: false });
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),
      // 持久化时设置token到localStorage，兼容现有的request.ts
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          localStorage.setItem('token', state.token);
        }
        if (state?.user) {
          localStorage.setItem('user', JSON.stringify(state.user));
        }
      }
    }
  )
);
