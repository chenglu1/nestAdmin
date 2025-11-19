/*
 * @Description: Layout 相关自定义 Hook
 */
import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getUserProfile } from '@/api/auth';
import { getUserMenus } from '@/api/menu';
import type { MenuItem } from '@/layout/types';
import type { UserProfile } from '@/api/auth';

/**
 * 布局数据加载 Hook
 */
export const useLayoutData = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await getUserProfile();
      setUser(response.data);
    } catch (error) {
      console.error('获取用户信息失败:', error);
      message.error('获取用户信息失败');
    }
  }, []);

  const fetchMenus = useCallback(async () => {
    try {
      const response = await getUserMenus();
      setMenus(response.data);
    } catch (error) {
      console.error('获取菜单失败:', error);
      message.error('获取菜单失败');
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchUserProfile(), fetchMenus()]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fetchUserProfile, fetchMenus]);

  return { user, menus, loading, refetchUser: fetchUserProfile };
};

/**
 * 侧边栏状态 Hook
 */
export const useSiderCollapsed = () => {
  const [collapsed, setCollapsed] = useState(false);
  
  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  return { collapsed, toggleCollapsed };
};

/**
 * 退出登录 Hook
 */
export const useLogout = () => {
  const navigate = useNavigate();

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.success('退出登录成功!');
    navigate('/login');
  }, [navigate]);

  return logout;
};
