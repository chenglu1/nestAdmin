/*
 * @Description: 统一图标管理 
 */
import React, { createElement } from 'react';
import {
  // 导航类图标
  HomeOutlined,
  MenuOutlined,
  AppstoreOutlined,
  // 用户管理类图标
  UserOutlined,
  TeamOutlined,
  // 系统功能类图标
  SafetyOutlined,
  SettingOutlined,
  DashboardOutlined,
  // 基础操作类图标
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  FilterOutlined,
  // 文件与展示类图标
  UploadOutlined,
  DownloadOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  FileOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  // 状态与提示类图标
  AlertOutlined,
  CheckCircleOutlined,
  QuestionCircleOutlined,
  // 认证与退出类图标
  LockOutlined,
  LogoutOutlined,
  // 其他图标
  MoreOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  DownOutlined,
  UpOutlined,
  // 刷新类图标（使用RestOutlined代替RefreshOutlined）
  RestOutlined
} from '@ant-design/icons';

// 图标组件类型定义
type IconComponent = React.ElementType;

// 图标映射 - 直接使用组件引用
const iconComponents: Record<string, IconComponent> = {
  HomeOutlined,
  MenuOutlined,
  AppstoreOutlined,
  UserOutlined,
  TeamOutlined,
  SafetyOutlined,
  SettingOutlined,
  DashboardOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  FilterOutlined,
  UploadOutlined,
  DownloadOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  FileOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  QuestionCircleOutlined,
  LockOutlined,
  LogoutOutlined,
  MoreOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  DownOutlined,
  UpOutlined,
  RestOutlined
};

// 图标名称数组 - 用于组件中的选项列表
export const IconNames: string[] = Object.keys(iconComponents);

// 获取图标实例的辅助函数 - 返回ReactNode类型
export const getIcon = (iconName: string): React.ReactNode => {
  const Component = iconComponents[iconName];
  return Component ? createElement(Component) : null;
};

// 图标映射 - 提供组件实例而非组件引用
export const IconMap: Record<string, React.ReactNode> = {};

// 初始化IconMap，为每个图标创建组件实例
IconNames.forEach(iconName => {
  IconMap[iconName] = getIcon(iconName);
});
