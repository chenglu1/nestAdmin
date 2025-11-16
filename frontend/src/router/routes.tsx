import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

// 懒加载页面组件 - 代码分割,按需加载
const Login = lazy(() => import('@/pages/Login/Login'));
const Home = lazy(() => import('@/pages/Home/Home'));
const Dashboard = lazy(() => import('@/pages/Dashboard/Dashboard'));
const UserManagement = lazy(() => import('@/pages/UserManagement/UserManagement'));
const MenuManagement = lazy(() => import('@/pages/MenuManagement/MenuManagement'));
const RoleManagement = lazy(() => import('@/pages/RoleManagement/RoleManagement'));
const OperationLog = lazy(() => import('@/pages/OperationLog/OperationLog'));
const PerformanceMonitor = lazy(() => import('@/pages/PerformanceMonitor/PerformanceMonitor'));

import type { ReactElement } from 'react';

// 路由配置类型
export interface RouteConfig {
  path?: string;
  index?: boolean;
  element: ReactElement;
  children?: RouteConfig[];
  meta?: {
    title?: string;
    requiresAuth?: boolean;
    icon?: string;
  };
}

// 路由配置
export const routes: RouteConfig[] = [
  {
    path: '/login',
    element: <Login />,
    meta: {
      title: '登录',
      requiresAuth: false,
    },
  },
  {
    path: '/home',
    element: <Home />,
    meta: {
      title: '首页',
      requiresAuth: true,
    },
    children: [
      {
        index: true,
        element: <Dashboard />,
        meta: {
          title: '工作台',
        },
      },
      {
        path: 'users',
        element: <UserManagement />,
        meta: {
          title: '用户管理',
        },
      },
      {
        path: 'menus',
        element: <MenuManagement />,
        meta: {
          title: '菜单管理',
        },
      },
      {
        path: 'roles',
        element: <RoleManagement />,
        meta: {
          title: '角色管理',
        },
      },
      {
        path: 'logs',
        element: <OperationLog />,
        meta: {
          title: '操作日志',
        },
      },
      {
        path: 'performance',
        element: <PerformanceMonitor />,
        meta: {
          title: '性能监控',
        },
      },
    ],
  },
  {
    path: '/',
    element: <Navigate to="/home" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/home" replace />,
  },
];
