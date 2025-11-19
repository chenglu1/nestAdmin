/*
 * @Description: Layout 常量定义
 */
import {
  HomeOutlined,
  UserOutlined,
  TeamOutlined,
  MenuOutlined,
  SafetyOutlined,
  FileTextOutlined,
  SettingOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import type { JSX } from 'react';

// 图标映射 - 使用函数返回 JSX 元素
export const IconMap: Record<string, JSX.Element> = {
  HomeOutlined: <HomeOutlined />,
  UserOutlined: <UserOutlined />,
  TeamOutlined: <TeamOutlined />,
  MenuOutlined: <MenuOutlined />,
  SafetyOutlined: <SafetyOutlined />,
  FileTextOutlined: <FileTextOutlined />,
  SettingOutlined: <SettingOutlined />,
  DashboardOutlined: <DashboardOutlined />,
};
