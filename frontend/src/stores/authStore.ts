import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AxiosError } from 'axios';
import { login as apiLogin, getUserProfile, logout as apiLogout, refreshToken as apiRefreshToken } from '@/api/auth';
import { getUserMenus } from '@/api/menu';
import type { UserProfile } from '@/api/auth';
import type { MenuItem } from '@/layout/types';

interface AuthState {
  // 用户相关
  user: UserProfile | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // 菜单相关
  menus: MenuItem[];
  menusLoading: boolean;
  
  // Actions
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  fetchMenus: () => Promise<void>;
  updateToken: (newToken: string) => void;
  updateRefreshToken: (newRefreshToken: string) => void;
  refreshTokens: () => Promise<string>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      token: null,
      refreshToken: null,
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
          const { accessToken, refreshToken, user } = response.data;
          
          set({
            token: accessToken,
            refreshToken,
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
      logout: async () => {
        const { refreshToken } = get();
        try {
          // 如果有refreshToken，调用后端注销接口
          if (refreshToken) {
            await apiLogout(refreshToken);
          }
        } catch (error) {
          console.error('注销失败:', error);
          // 即使注销失败也清除本地状态
        } finally {
          // 清除本地状态
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            menus: []
          });
          // 清除localStorage中的数据
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
      },

      // 更新访问令牌
      updateToken: (newToken: string) => {
        set({ token: newToken });
        localStorage.setItem('token', newToken);
      },

      // 更新刷新令牌
      updateRefreshToken: (newRefreshToken: string) => {
        set({ refreshToken: newRefreshToken });
        localStorage.setItem('refreshToken', newRefreshToken);
      },

      // 刷新令牌
      refreshTokens: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          throw new Error('没有可用的刷新令牌');
        }

        try {
          const response = await apiRefreshToken(refreshToken);
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          
          get().updateToken(accessToken);
          get().updateRefreshToken(newRefreshToken);
          
          return accessToken;
        } catch (error) {
          console.error('刷新令牌失败:', error);
          // 刷新失败，执行登出
          get().logout();
          throw error;
        }
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
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      }),
      // 持久化时设置tokens到localStorage，兼容现有的request.ts
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          localStorage.setItem('token', state.token);
        }
        if (state?.refreshToken) {
          localStorage.setItem('refreshToken', state.refreshToken);
        }
        if (state?.user) {
          localStorage.setItem('user', JSON.stringify(state.user));
        }
      }
    }
  )
);
