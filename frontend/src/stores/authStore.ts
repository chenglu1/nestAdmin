import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AxiosError } from 'axios';
import { login as apiLogin, getUserProfile, logout as apiLogout, refreshToken as apiRefreshToken } from '@/api/auth';
import { getUserMenus } from '@/api/menu';
import type { UserProfile } from '@/api/auth';
import type { MenuItem } from '@/layout/types';

// 全局扩展Window接口，添加自定义属性声明
declare global {
  interface Window {
    authActivityListener?: () => void;
  }
}

// 默认会话超时时间（毫秒）- 30分钟
const DEFAULT_SESSION_TIMEOUT = 30 * 60 * 1000; // 30分钟

interface AuthState {
  // 用户相关
  user: UserProfile | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  error: string | null;
  
  // 加载状态 - 更细粒度
  isLoading: {
    login: boolean;
    logout: boolean;
    refreshTokens: boolean;
    refreshUserProfile: boolean;
    fetchMenus: boolean;
  };
  
  // 菜单相关
  menus: MenuItem[];
  
  // 令牌相关
  tokenExpiry: number | null; // token过期时间戳
  refreshTimer: number | null; // 刷新定时器ID
  
  // 会话管理相关
  sessionTimeout: number | null; // 会话超时时间
  sessionTimer: number | null; // 会话超时定时器ID
  lastActivityTime: number | null; // 最后活动时间
  
  // Actions
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  fetchMenus: () => Promise<void>;
  updateToken: (newToken: string) => void;
  updateRefreshToken: (newRefreshToken: string) => void;
  refreshTokens: () => Promise<string>;
  handleApiError: (error: unknown, defaultMessage: string) => string;
  // 令牌刷新相关
  parseJwt: (token: string) => { exp: number } | null;
  scheduleTokenRefresh: (token: string) => void;
  clearRefreshTimer: () => void;
  // 会话管理相关
  resetSessionTimeout: () => void;
  startSessionMonitoring: () => void;
  stopSessionMonitoring: () => void;
  setupActivityListeners: () => void;
  removeActivityListeners: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
      // 细粒度的加载状态
      isLoading: {
        login: false,
        logout: false,
        refreshTokens: false,
        refreshUserProfile: false,
        fetchMenus: false,
      },
      menus: [],
      tokenExpiry: null,
      refreshTimer: null,
      // 会话管理初始状态
      sessionTimeout: null,
      sessionTimer: null,
      lastActivityTime: null,

      // 统一错误处理函数
      handleApiError: (error: unknown, defaultMessage: string) => {
        console.error(defaultMessage, error);
        const errorMessage = (error as AxiosError<{ message?: string }>)?.response?.data?.message || defaultMessage;
        set({ error: errorMessage });
        return errorMessage;
      },
      
      // 解析JWT token，获取过期时间
      parseJwt: (token: string) => {
        try {
          const base64Url = token.split('.')[1];
          if (!base64Url) return null;
          
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          
          return JSON.parse(jsonPayload) as { exp: number };
        } catch (error) {
          console.error('解析JWT失败:', error);
          return null;
        }
      },
      
      // 设置token自动刷新定时器
      scheduleTokenRefresh: (token: string) => {
        const decodedToken = get().parseJwt(token);
        if (!decodedToken || !decodedToken.exp) return;
        
        const expiryTime = decodedToken.exp * 1000; // 转换为毫秒
        const currentTime = Date.now();
        const timeUntilExpiry = expiryTime - currentTime;
        
        // 在token过期前5分钟刷新
        const refreshTime = Math.max(0, timeUntilExpiry - 5 * 60 * 1000);
        
        // 清除之前的定时器
        get().clearRefreshTimer();
        
        // 设置新的定时器
        const timerId = window.setTimeout(() => {
          get().refreshTokens().catch(() => {
            // 如果刷新失败，会在refreshTokens内部处理登出
          });
        }, refreshTime);
        
        set({ tokenExpiry: expiryTime, refreshTimer: timerId });
      },
      
      // 清除刷新定时器
      clearRefreshTimer: () => {
        const { refreshTimer } = get();
        if (refreshTimer !== null) {
          window.clearTimeout(refreshTimer);
          set({ refreshTimer: null, tokenExpiry: null });
        }
      },
      
      // 重置会话超时时间
      resetSessionTimeout: () => {
        const currentTime = Date.now();
        set({ lastActivityTime: currentTime });
        
        // 清除现有定时器
        const state = get();
        if (state.sessionTimer) {
          clearTimeout(state.sessionTimer);
        }
        
        // 设置新的超时定时器
        const timeoutId = setTimeout(() => {
          // 会话超时，执行登出
          if (get().isAuthenticated) {
            console.warn('会话已超时，自动登出');
            get().logout();
            // 可以在这里添加通知用户的逻辑
          }
        }, state.sessionTimeout || DEFAULT_SESSION_TIMEOUT);
        
        set({ sessionTimer: timeoutId });
      },
      
      // 启动会话监控
      startSessionMonitoring: () => {
        // 设置初始活动时间
        set({ lastActivityTime: Date.now() });
        
        // 设置初始超时定时器
        get().resetSessionTimeout();
        
        // 设置用户活动监听器
        get().setupActivityListeners();
      },
      
      // 停止会话监控
      stopSessionMonitoring: () => {
        const state = get();
        // 清除超时定时器
        if (state.sessionTimer) {
          clearTimeout(state.sessionTimer);
          set({ sessionTimer: null });
        }
        
        // 移除用户活动监听器
        get().removeActivityListeners();
        
        // 清除最后活动时间
        set({ lastActivityTime: null });
      },
      
      // 设置用户活动监听器
      setupActivityListeners: () => {
        const handleActivity = () => {
          get().resetSessionTimeout();
        };
        
        // 监听鼠标移动、点击、滚动和键盘输入
        document.addEventListener('mousemove', handleActivity);
        document.addEventListener('mousedown', handleActivity);
        document.addEventListener('keypress', handleActivity);
        document.addEventListener('scroll', handleActivity);
        
        // 将监听器存储在全局对象上，以便稍后移除
        window.authActivityListener = handleActivity;
      },
      
      // 移除用户活动监听器
      removeActivityListeners: () => {
        const handleActivity = window.authActivityListener;
        if (handleActivity) {
          document.removeEventListener('mousemove', handleActivity);
          document.removeEventListener('mousedown', handleActivity);
          document.removeEventListener('keypress', handleActivity);
          document.removeEventListener('scroll', handleActivity);
          
          // 清除全局引用
          delete window.authActivityListener;
        }
      },
      
      // 登录
      login: async (username: string, password: string) => {
        set(state => ({ 
          error: null, 
          isLoading: { ...state.isLoading, login: true } 
        }));
        try {
          const response = await apiLogin({ username, password });
          const { accessToken, refreshToken, user } = response.data;
          
          set({
            token: accessToken,
            refreshToken,
            user: user as UserProfile,
            isAuthenticated: true,
            isLoading: { login: false, logout: false, refreshTokens: false, refreshUserProfile: false, fetchMenus: false }
          });
          
          // 设置token自动刷新
          get().scheduleTokenRefresh(accessToken);
          
          // 设置默认会话超时时间
          set({ sessionTimeout: DEFAULT_SESSION_TIMEOUT });
          
          // 启动会话监控
          get().startSessionMonitoring();
          
          // 登录成功后获取菜单
          get().fetchMenus();
        } catch (error: unknown) {
          get().handleApiError(error, '登录失败，请重试');
          set(state => ({ 
            isLoading: { ...state.isLoading, login: false } 
          }));
          throw error; // 向上抛出错误，让组件可以捕获
        }
      },

      // 退出登录
      logout: async () => {
        set(state => ({ 
          isLoading: { ...state.isLoading, logout: true } 
        }));
        try {
          // 调用后端注销接口，后端会处理Cookie清除
          await apiLogout();
        } catch (error) {
          get().handleApiError(error, '注销失败');
          // 即使注销失败也清除本地状态
        } finally {
          // 清除刷新定时器
          get().clearRefreshTimer();
          
          // 清除本地状态
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            menus: [],
            tokenExpiry: null,
            refreshTimer: null,
            isLoading: { login: false, logout: false, refreshTokens: false, refreshUserProfile: false, fetchMenus: false }
          });
        }
      },

      // 更新访问令牌
      updateToken: (newToken: string) => {
        set({ token: newToken });
        // 更新token后重新设置自动刷新
        get().scheduleTokenRefresh(newToken);
      },

      // 更新刷新令牌 - 现在主要由后端通过Cookie管理
      updateRefreshToken: (newRefreshToken: string) => {
        set({ refreshToken: newRefreshToken });
      },

      // 刷新令牌 - 现在通过Cookie自动传递refreshToken
      refreshTokens: async () => {
        // 防止重复刷新
        if (get().isLoading.refreshTokens) {
          throw new Error('令牌刷新中，请稍后再试');
        }
        
        set(state => ({ 
          isLoading: { ...state.isLoading, refreshTokens: true } 
        }));
        
        try {
          const response = await apiRefreshToken();
          const { accessToken } = response.data;
          
          get().updateToken(accessToken);
          
          set(state => ({ 
            isLoading: { ...state.isLoading, refreshTokens: false } 
          }));
          
          return accessToken;
        } catch (error) {
          get().handleApiError(error, '刷新令牌失败');
          
          set(state => ({ 
            isLoading: { ...state.isLoading, refreshTokens: false } 
          }));
          
          // 刷新失败，执行登出
          get().logout();
          throw error;
        }
      },

      // 刷新用户信息
      refreshUserProfile: async () => {
        set(state => ({ 
          isLoading: { ...state.isLoading, refreshUserProfile: true } 
        }));
        
        try {
          const response = await getUserProfile();
          set(state => ({
            user: response.data,
            isLoading: { ...state.isLoading, refreshUserProfile: false }
          }));
        } catch (error) {
          get().handleApiError(error, '刷新用户信息失败');
          
          set(state => ({ 
            isLoading: { ...state.isLoading, refreshUserProfile: false } 
          }));
          
          // 如果获取失败，可能是token失效，执行登出
          get().logout();
        }
      },

      // 获取菜单
      fetchMenus: async () => {
        set(state => ({ 
          isLoading: { ...state.isLoading, fetchMenus: true } 
        }));
        try {
          const response = await getUserMenus();
          set(state => ({
            menus: response.data,
            isLoading: { ...state.isLoading, fetchMenus: false }
          }));
        } catch (error) {
          get().handleApiError(error, '获取菜单失败');
          set(state => ({ 
            isLoading: { ...state.isLoading, fetchMenus: false } 
          }));
        }
      }
    }),
    {
      name: 'auth-storage',
      // 优化持久化策略：
      // 1. 只存储必要的认证信息
      // 2. 对于敏感信息考虑安全性
      partialize: (state) => ({
        // 存储所有必要的AuthState属性
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        tokenExpiry: state.tokenExpiry,
        sessionTimeout: state.sessionTimeout,
        error: state.error,
        isLoading: state.isLoading,
        menus: state.menus,
        sessionTimer: state.sessionTimer,
        lastActivityTime: state.lastActivityTime
      }),
      
      // 从持久化存储恢复后，重新设置token自动刷新
      onRehydrateStorage: () => (state) => {
        if (state?.token && state?.isAuthenticated) {
          // 延迟一下执行，确保store已经完全初始化
          setTimeout(() => {
            const store = useAuthStore.getState();
            // 恢复后检查token是否仍然有效
            if (state.token) {
              const decodedToken = store.parseJwt(state.token);
              if (decodedToken && decodedToken.exp * 1000 > Date.now()) {
                store.scheduleTokenRefresh(state.token);
                // 可选：恢复后刷新用户完整信息
                store.refreshUserProfile().catch(() => {
                  // 刷新失败不做特殊处理，因为token仍然有效
                });
                
                // 启动会话监控
                store.startSessionMonitoring();
              } else {
                // token已过期，尝试刷新
                store.refreshTokens().catch(() => {
                  // 刷新失败会自动登出
                });
              }
            }
          }, 100);
        }
      },
      
      // 处理storage类型兼容性问题
      storage: {
        getItem: (name) => {
          const value = localStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        }
      }
    })
);